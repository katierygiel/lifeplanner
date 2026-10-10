import { addDays } from './dates'
import type { PullupLog, PullupVariation, WorkoutKind, WorkoutLog } from './types'

export const KINDS: { id: WorkoutKind; label: string }[] = [
  { id: 'strength', label: 'Strength' },
  { id: 'run', label: 'Run' },
  { id: 'walk', label: 'Walk' },
  { id: 'pilates', label: 'Pilates' },
  { id: 'mobility', label: 'Mobility' },
  { id: 'hyrox', label: 'HYROX' },
  { id: 'other', label: 'Other' },
]
export const kindLabel = (k: WorkoutKind) => KINDS.find((x) => x.id === k)?.label ?? 'Workout'
export const hasDistance = (k: WorkoutKind) => k === 'run' || k === 'walk' || k === 'hyrox'
export const hasSets = (k: WorkoutKind) => k === 'strength' || k === 'hyrox' || k === 'other'

// Pace as m:ss per km.
export function pace(durationMin: number | null, km: number | null): string | null {
  if (!durationMin || !km) return null
  const secs = Math.round((durationMin * 60) / km)
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} /km`
}

export function weekTotals(logs: WorkoutLog[], from: string) {
  const to = addDays(from, 6)
  const wk = logs.filter((l) => l.date >= from && l.date <= to)
  return {
    sessions: wk.length,
    minutes: wk.reduce((s, l) => s + (l.duration_min ?? 0), 0),
    km: Math.round(wk.reduce((s, l) => s + Number(l.distance_km ?? 0), 0) * 10) / 10,
    byKind: Object.fromEntries(KINDS.map((k) => [k.id, wk.filter((l) => l.kind === k.id).length])) as Record<WorkoutKind, number>,
  }
}

// Heaviest weight lifted per exercise (any reps), and the reps at that weight.
export function strengthPRs(logs: WorkoutLog[]) {
  const best = new Map<string, { name: string; weight: number; reps: number; date: string }>()
  for (const l of logs)
    for (const ex of l.exercises) {
      const key = ex.name.trim().toLowerCase()
      if (!key) continue
      for (const s of ex.sets) {
        if (s.weight == null) continue
        const cur = best.get(key)
        if (!cur || s.weight > cur.weight || (s.weight === cur.weight && (s.reps ?? 0) > cur.reps))
          best.set(key, { name: ex.name.trim(), weight: s.weight, reps: s.reps ?? 0, date: l.date })
      }
    }
  return [...best.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function runPRs(logs: WorkoutLog[]) {
  const runs = logs.filter((l) => l.kind === 'run' && l.distance_km)
  const longest = runs.reduce<WorkoutLog | null>((b, l) => (!b || Number(l.distance_km) > Number(b.distance_km) ? l : b), null)
  const fastest = runs
    .filter((l) => l.duration_min && Number(l.distance_km) >= 1)
    .reduce<WorkoutLog | null>((b, l) => (!b || l.duration_min! / Number(l.distance_km) < b.duration_min! / Number(b.distance_km) ? l : b), null)
  return { longest, fastest }
}

// The most recent log with the same title, for "copy last time".
export function lastTime(logs: WorkoutLog[], title: string, beforeDate?: string) {
  const t = title.trim().toLowerCase()
  return [...logs]
    .filter((l) => l.title.trim().toLowerCase() === t && (!beforeDate || l.date <= beforeDate))
    .sort((a, b) => b.date.localeCompare(a.date))[0]
}

export const VARIATIONS: { id: PullupVariation; label: string; level: number }[] = [
  { id: 'negative', label: 'Negatives', level: 1 },
  { id: 'band', label: 'Band-assisted', level: 2 },
  { id: 'assisted', label: 'Machine-assisted', level: 2 },
  { id: 'chinup', label: 'Chin-ups', level: 3 },
  { id: 'strict', label: 'Strict pull-ups', level: 4 },
]

// Where she is on the road to the goal: the hardest variation logged, and best strict reps.
export function pullupStatus(logs: PullupLog[], goal = 20) {
  const strict = logs.filter((l) => l.variation === 'strict')
  const bestStrict = strict.reduce((m, l) => Math.max(m, l.best_reps), 0)
  const top = logs.reduce((m, l) => Math.max(m, VARIATIONS.find((v) => v.id === l.variation)?.level ?? 0), 0)
  const stage = VARIATIONS.filter((v) => v.level === top).map((v) => v.label).join(' / ') || 'Not started'
  return { bestStrict, goal, ratio: Math.min(1, bestStrict / goal), stage }
}
