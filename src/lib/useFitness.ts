import { useCallback, useEffect, useState } from 'react'
import { today } from './dates'
import { store } from './store'
import type { PullupLog, Race, WorkoutLog, WorkoutTemplate } from './types'
import { WORKOUT_XP } from './useToday'

export function useFitness() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [pullups, setPullups] = useState<PullupLog[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const [l, t, p, r] = await Promise.all([store.workoutLogs.list(), store.templates.list(), store.pullups.list(), store.races.list()])
      setLogs(l.map((x) => ({ ...x, distance_km: x.distance_km == null ? null : Number(x.distance_km) })))
      setTemplates(t)
      setPullups(p)
      setRaces(r)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function run<T>(fn: () => Promise<T>) {
    try {
      return await fn()
    } catch (e) {
      setError((e as Error).message)
      return null
    }
  }
  const upsert = <T extends { id: string }>(list: T[], row: T) => [row, ...list.filter((x) => x.id !== row.id)]

  return {
    logs, templates, pullups, races, loading, error, reload,
    clearError: () => setError(null),
    // A log not tied to a planned workout earns workout XP on its own (once per log).
    async saveLog(log: WorkoutLog, asTemplate: boolean) {
      const saved = await run(() => store.workoutLogs.save(log))
      if (!saved) return false
      setLogs((x) => upsert(x, { ...saved, distance_km: saved.distance_km == null ? null : Number(saved.distance_km) }).sort((a, b) => b.date.localeCompare(a.date)))
      if (!log.plan_id && log.date === today())
        await run(() => store.addXp({ amount: WORKOUT_XP[log.version ?? 'full'], source_type: 'workout-log', source_id: log.id, date: log.date }))
      if (asTemplate) {
        const existing = templates.find((t) => t.title.trim().toLowerCase() === log.title.trim().toLowerCase())
        const tpl: WorkoutTemplate = {
          id: existing?.id ?? log.id,
          title: log.title,
          kind: log.kind,
          exercises: log.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) })),
          notes: null,
        }
        const t = await run(() => store.templates.save(tpl))
        if (t) setTemplates((x) => upsert(x, t))
      }
      return true
    },
    async deleteLog(id: string) {
      setLogs((x) => x.filter((l) => l.id !== id))
      await run(() => store.workoutLogs.remove(id))
      await run(() => store.removeXp('workout-log', id))
    },
    async deleteTemplate(id: string) {
      setTemplates((x) => x.filter((t) => t.id !== id))
      await run(() => store.templates.remove(id))
    },
    async savePullup(p: PullupLog) {
      const saved = await run(() => store.pullups.save(p))
      if (saved) setPullups((x) => upsert(x, saved).sort((a, b) => b.date.localeCompare(a.date)))
      return !!saved
    },
    async deletePullup(id: string) {
      setPullups((x) => x.filter((p) => p.id !== id))
      await run(() => store.pullups.remove(id))
    },
    async saveRace(r: Race) {
      const saved = await run(() => store.races.save(r))
      if (saved) setRaces((x) => upsert(x, saved).sort((a, b) => b.date.localeCompare(a.date)))
      return !!saved
    },
    async deleteRace(id: string) {
      setRaces((x) => x.filter((r) => r.id !== id))
      await run(() => store.races.remove(id))
    },
  }
}
