import { describe, expect, it } from 'vitest'
import { addDays, dayLabel, fromDay, toDay } from './dates'

describe('dates', () => {
  it('uses the local calendar day, even late at night', () => {
    expect(toDay(new Date(2026, 9, 10, 23, 59))).toBe('2026-10-10')
  })
  it('round-trips', () => {
    expect(toDay(fromDay('2026-03-08'))).toBe('2026-03-08')
  })
  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
  })
  it('handles the daylight saving change', () => {
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
  })
  it('labels nearby days', () => {
    expect(dayLabel('2026-10-10', '2026-10-10')).toBe('Today')
    expect(dayLabel('2026-10-11', '2026-10-10')).toBe('Tomorrow')
  })
})
