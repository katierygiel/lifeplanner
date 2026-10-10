import { describe, expect, it } from 'vitest'
import { reviewWeekStart, weekSummary } from './review'

describe('weekly review', () => {
  it('reviews this week from Friday to Sunday', () => {
    expect(reviewWeekStart('2026-10-16')).toBe('2026-10-12') // Fri
    expect(reviewWeekStart('2026-10-18')).toBe('2026-10-12') // Sun
  })
  it('reviews last week early in the week', () => {
    expect(reviewWeekStart('2026-10-19')).toBe('2026-10-12') // Mon
    expect(reviewWeekStart('2026-10-22')).toBe('2026-10-12') // Thu
  })
  it('sums the week', () => {
    const s = weekSummary(
      [
        { id: '1', amount: 25, source_type: 'workout', source_id: 'a', date: '2026-10-12' },
        { id: '2', amount: 30, source_type: 'workout-log', source_id: 'b', date: '2026-10-13' },
        { id: '3', amount: 20, source_type: 'routine', source_id: 'c', date: '2026-10-13' },
        { id: '4', amount: 20, source_type: 'task', source_id: 'd', date: '2026-10-20' },
      ],
      '2026-10-12',
    )
    expect(s).toMatchObject({ xp: 75, activeDays: 2, workouts: 2, lighterWorkouts: 1, routines: 1, tasks: 0 })
  })
})
