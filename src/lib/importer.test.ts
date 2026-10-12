import { describe, expect, it } from 'vitest'
import { importPrompt, parseWorkouts } from './importer'

describe('workout importer', () => {
  it('reads the requested format', () => {
    const { days } = parseWorkouts(`DATE: 2026-10-13
FULL: Upper body | 45 min · pull-up ladder
SHORT: Upper express | 20 min
RECOVERY: Easy walk | 25 min

DATE: 2026-10-14
FULL: Rest day`)
    expect(days).toHaveLength(2)
    expect(days[0]).toMatchObject({ date: '2026-10-13', full_title: 'Upper body', full_detail: '45 min · pull-up ladder', recovery_title: 'Easy walk' })
    expect(days[1]).toMatchObject({ full_title: 'Rest day', short_title: null })
  })
  it('forgives bold, bullets, casing, and dashes', () => {
    const { days } = parseWorkouts(`**Date:** 2026-10-15 (Thursday)
- **Full:** Lower body – squats and lunges
* short: Lower express | 20 min`)
    expect(days[0]).toMatchObject({ date: '2026-10-15', full_title: 'Lower body', full_detail: 'squats and lunges', short_title: 'Lower express' })
  })
  it('ignores chatter and counts what it skipped', () => {
    const r = parseWorkouts(`Here is your plan!\nDATE: 2026-10-16\nFULL: Run | 5k easy\nHave a great week!`)
    expect(r.days).toHaveLength(1)
    expect(r.skipped).toBe(2)
  })
  it('reads a reply pasted as one line with long dashes in the dates', () => {
    const one =
      'DATE: 2026–10–12 FULL: Lower body | 45 min · squats, hip thrusts SHORT: Lower body express | 20 min · squats RECOVERY: Easy walk | 30 min · flat route, no vest DATE: 2026—10—13 FULL: Upper body | 45 min · rows'
    const { days } = parseWorkouts(one)
    expect(days.map((d) => d.date)).toEqual(['2026-10-12', '2026-10-13'])
    expect(days[0]).toMatchObject({ full_title: 'Lower body', full_detail: '45 min · squats, hip thrusts', short_title: 'Lower body express', recovery_title: 'Easy walk', recovery_detail: '30 min · flat route, no vest' })
    expect(days[1].full_title).toBe('Upper body')
  })
  it('does not split on the word recovery inside a description', () => {
    const { days } = parseWorkouts('DATE: 2026-10-14\nFULL: Mobility | active recovery day, 30 min')
    expect(days[0].full_detail).toBe('active recovery day, 30 min')
  })
  it('includes the real dates in the prompt', () => {
    const p = importPrompt('2026-10-13', 14)
    expect(p).toContain('DATE: 2026-10-13')
    expect(p).toContain('14 days')
  })
})
