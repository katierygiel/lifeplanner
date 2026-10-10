import { describe, expect, it } from 'vitest'
import { checkinSuggestion, isOn, routineProgress } from './routines'
import type { Routine } from './types'

const r: Routine = {
  id: 'r', title: 'Morning', time_of_day: 'morning', days: [1, 2, 3, 4], xp: 20, sort_order: 0,
  steps: [
    { id: 'a', title: 'Get up', duration_min: null, optional: false, in_busy_version: true, sort_order: 0 },
    { id: 'b', title: 'Breakfast', duration_min: null, optional: false, in_busy_version: false, sort_order: 1 },
    { id: 'c', title: 'Read', duration_min: null, optional: true, in_busy_version: false, sort_order: 2 },
  ],
}
const log = (ids: string[]) => ({ routine_id: 'r', date: '2026-10-12', version: 'full' as const, completed_steps: ids, completed: false })

describe('routines', () => {
  it('knows which weekdays a routine runs', () => {
    expect(isOn([1, 2, 3, 4], '2026-10-12')).toBe(true) // Monday
    expect(isOn([1, 2, 3, 4], '2026-10-16')).toBe(false) // Friday
  })
  it('optional steps do not block completion', () => {
    expect(routineProgress(r, log(['a', 'b']), 'full').complete).toBe(true)
  })
  it('busy version only needs busy steps', () => {
    const p = routineProgress(r, log(['a']), 'busy')
    expect(p.total).toBe(1)
    expect(p.complete).toBe(true)
  })
  it('is not complete with nothing checked', () => {
    expect(routineProgress(r, undefined, 'full').complete).toBe(false)
  })
})

describe('check-in suggestions', () => {
  it('suggests essentials when tired and sore', () => {
    expect(checkinSuggestion({ energy: 2, soreness: 4 }, 'full')?.mode).toBe('essentials')
  })
  it('suggests a shorter day when a bit tired', () => {
    expect(checkinSuggestion({ energy: 2, soreness: 2 }, 'full')?.mode).toBe('short')
  })
  it('stays quiet when the plan already fits', () => {
    expect(checkinSuggestion({ energy: 2, soreness: 2 }, 'short')).toBeNull()
    expect(checkinSuggestion({ energy: 4, soreness: 1, motivation: 4 }, 'full')).toBeNull()
  })
})
