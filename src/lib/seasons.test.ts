import { describe, expect, it } from 'vitest'
import { goalProgress, seasonStatus, seasonTime, suggestedSeason } from './seasons'
import type { Goal, Season } from './types'

const s: Season = { id: 's', name: 'Fall Reset', theme: 'peri', start_date: '2026-10-05', end_date: '2026-11-29', notes: null, reflection: null }
const g = (done: number, total: number, completed = false): Goal => ({
  id: 'g', season_id: 's', title: 'Run', description: null, category: null, target_date: null, notes: null,
  completed_at: completed ? '2026-10-10' : null, sort_order: 0, habit_ids: [],
  milestones: Array.from({ length: total }, (_, i) => ({ id: String(i), title: 'm', due_date: null, done_at: i < done ? 'x' : null, sort_order: i })),
})

describe('seasons', () => {
  it('knows if a season is upcoming, active, or ended', () => {
    expect(seasonStatus(s, '2026-10-01')).toBe('upcoming')
    expect(seasonStatus(s, '2026-10-10')).toBe('active')
    expect(seasonStatus(s, '2026-12-01')).toBe('ended')
  })
  it('counts weeks', () => {
    const t = seasonTime(s, '2026-10-12') // day 8
    expect(t.weeks).toBe(8)
    expect(t.week).toBe(2)
    expect(seasonTime(s, '2026-10-05').week).toBe(1)
  })
  it('measures goals by milestones, and finished goals are full', () => {
    expect(goalProgress(g(2, 4)).ratio).toBe(0.5)
    expect(goalProgress(g(0, 0)).ratio).toBe(0)
    expect(goalProgress(g(1, 4, true)).ratio).toBe(1)
  })
  it('suggests a Fall Reset in October, 8 weeks long', () => {
    const x = suggestedSeason('2026-10-10')
    expect(x.name).toBe('My Fall Reset')
    expect(x.end_date).toBe('2026-12-04')
  })
})
