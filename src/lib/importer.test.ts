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
  it('includes the real dates in the prompt', () => {
    const p = importPrompt('2026-10-13', 14)
    expect(p).toContain('DATE: 2026-10-13')
    expect(p).toContain('14 days')
  })
})
