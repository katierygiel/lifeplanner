import { describe, expect, it } from 'vitest'
import { blocksOn, dayLoad, formatTime } from './schedule'
import type { ScheduleBlock } from './types'

const base = (p: Partial<ScheduleBlock>): ScheduleBlock => ({
  id: Math.random().toString(), title: 'Work', kind: 'work', date: null, weekday: null, start_time: '10:00', end_time: '17:00',
  repeat_from: null, repeat_until: null, skipped_dates: [], notes: null, ...p,
})

describe('schedule', () => {
  const work = base({ weekday: 1 }) // Mondays
  it('repeats weekly on its weekday', () => {
    expect(blocksOn([work], '2026-10-12')).toHaveLength(1) // Monday
    expect(blocksOn([work], '2026-10-13')).toHaveLength(0) // Tuesday
  })
  it('can skip one day of a repeat', () => {
    expect(blocksOn([{ ...work, skipped_dates: ['2026-10-12'] }], '2026-10-12')).toHaveLength(0)
    expect(blocksOn([{ ...work, skipped_dates: ['2026-10-12'] }], '2026-10-19')).toHaveLength(1)
  })
  it('respects start and end of a repeat', () => {
    expect(blocksOn([{ ...work, repeat_from: '2026-10-19' }], '2026-10-12')).toHaveLength(0)
    expect(blocksOn([{ ...work, repeat_until: '2026-10-12' }], '2026-10-19')).toHaveLength(0)
  })
  it('includes one-offs on their date, sorted by time', () => {
    const dinner = base({ title: 'Family dinner', date: '2026-10-12', start_time: '18:00', end_time: '20:00' })
    const gym = base({ title: 'Gym', date: '2026-10-12', start_time: '07:00', end_time: '09:00' })
    expect(blocksOn([work, dinner, gym], '2026-10-12').map((b) => b.title)).toEqual(['Gym', 'Work', 'Family dinner'])
  })
  it('merges overlapping blocks when measuring load', () => {
    const a = base({ start_time: '10:00', end_time: '17:00' })
    const b = base({ start_time: '16:00', end_time: '18:00' })
    expect(dayLoad([a, b], []).hours).toBe(8)
  })
  it('formats times simply', () => {
    expect(formatTime('10:00:00')).toBe('10am')
    expect(formatTime('17:30')).toBe('5:30pm')
    expect(formatTime('00:15')).toBe('12:15am')
  })
})
