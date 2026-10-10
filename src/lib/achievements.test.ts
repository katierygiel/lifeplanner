import { describe, expect, it } from 'vitest'
import { daysAway, defFor, evaluate } from './achievements'
import type { XpEvent } from './types'

let n = 0
const ev = (date: string, amount = 20, source_type = 'task', source_id: string | null = null): XpEvent => ({
  id: String(n++), date, amount, source_type, source_id: source_id ?? String(n),
})

describe('achievements', () => {
  it('awards the first step on any XP', () => {
    expect(evaluate([ev('2026-10-10')], [], new Set(), '2026-10-10')).toContain('first-step')
  })
  it('never re-awards what is already earned', () => {
    expect(evaluate([ev('2026-10-10')], [], new Set(['first-step']), '2026-10-10')).not.toContain('first-step')
  })
  it('counts short and recovery workouts as wins', () => {
    const r = evaluate([ev('2026-10-10', 25, 'workout'), ev('2026-10-11', 20, 'workout')], [], new Set(), '2026-10-11')
    expect(r).toEqual(expect.arrayContaining(['short-counts', 'rest-counts']))
  })
  it('first week means 7 active days, not 7 in a row', () => {
    const days = ['2026-10-01', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-08', '2026-10-09', '2026-10-12']
    expect(evaluate(days.map((d) => ev(d)), [], new Set(), '2026-10-12')).toContain('first-week')
  })
  it('celebrates coming back after 3+ days away', () => {
    const r = evaluate([ev('2026-10-01'), ev('2026-10-05')], [], new Set(), '2026-10-05')
    expect(r).toContain('comeback-2026-10-05')
    expect(defFor('comeback-2026-10-05')?.title).toBe('Came back after a break')
  })
  it('does not call two days off a comeback', () => {
    const r = evaluate([ev('2026-10-01'), ev('2026-10-04')], [], new Set(), '2026-10-04')
    expect(r.some((k) => k.startsWith('comeback'))).toBe(false)
  })
  it('notices a weekly reset routine', () => {
    const routines = [{ id: 'r1', title: 'Sunday reset', time_of_day: 'weekly' as const, days: [0], xp: 30, sort_order: 0, steps: [] }]
    expect(evaluate([ev('2026-10-11', 30, 'routine', 'r1')], routines, new Set(), '2026-10-11')).toContain('personal-reset')
  })
  it('measures days away', () => {
    expect(daysAway([ev('2026-10-01')], '2026-10-05')).toBe(3)
    expect(daysAway([ev('2026-10-04')], '2026-10-05')).toBe(0)
  })
})
