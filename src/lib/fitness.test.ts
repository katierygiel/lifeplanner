import { describe, expect, it } from 'vitest'
import { lastTime, pace, pullupStatus, runPRs, strengthPRs, weekTotals } from './fitness'
import type { WorkoutLog } from './types'

const log = (p: Partial<WorkoutLog>): WorkoutLog => ({
  id: Math.random().toString(), date: '2026-10-12', kind: 'strength', title: 'Upper', version: 'full', plan_id: null,
  duration_min: null, distance_km: null, exercises: [], effort: null, notes: null, ...p,
})

describe('fitness', () => {
  it('formats pace per km', () => {
    expect(pace(30, 5)).toBe('6:00 /km')
    expect(pace(27.5, 5)).toBe('5:30 /km')
    expect(pace(null, 5)).toBeNull()
  })
  it('totals a week', () => {
    const t = weekTotals([log({ duration_min: 45 }), log({ kind: 'run', distance_km: 5, duration_min: 30, date: '2026-10-14' }), log({ date: '2026-10-20' })], '2026-10-12')
    expect(t).toMatchObject({ sessions: 2, minutes: 75, km: 5 })
    expect(t.byKind.run).toBe(1)
  })
  it('finds the heaviest set per exercise, ignoring case', () => {
    const prs = strengthPRs([
      log({ exercises: [{ name: 'Goblet squat', sets: [{ reps: 10, weight: 30 }, { reps: 8, weight: 35 }] }] }),
      log({ exercises: [{ name: 'goblet squat', sets: [{ reps: 6, weight: 35 }] }] }),
    ])
    expect(prs).toEqual([{ name: 'Goblet squat', weight: 35, reps: 8, date: '2026-10-12' }])
  })
  it('finds longest and fastest runs', () => {
    const a = log({ kind: 'run', distance_km: 5, duration_min: 30 })
    const b = log({ kind: 'run', distance_km: 8, duration_min: 56 })
    const r = runPRs([a, b])
    expect(r.longest).toBe(b)
    expect(r.fastest).toBe(a)
  })
  it('copies the most recent session with the same name', () => {
    const old = log({ title: 'Upper body', date: '2026-10-01' })
    const recent = log({ title: 'upper body ', date: '2026-10-08' })
    expect(lastTime([old, recent], 'Upper Body')).toBe(recent)
  })
  it('tracks pull-up progress toward the goal', () => {
    const s = pullupStatus([
      { id: '1', date: '2026-10-01', variation: 'negative', best_reps: 5, sets: 3, notes: null },
      { id: '2', date: '2026-10-08', variation: 'strict', best_reps: 2, sets: 3, notes: null },
    ])
    expect(s).toMatchObject({ bestStrict: 2, goal: 20, stage: 'Strict pull-ups' })
    expect(s.ratio).toBeCloseTo(0.1)
  })
})
