import { describe, expect, it } from 'vitest'
import { suggest, type SuggestContext } from './suggestions'
import type { ScheduleBlock, WorkoutPlan } from './types'

const w = (date: string, p: Partial<WorkoutPlan> = {}): WorkoutPlan => ({
  id: date, date, full_title: 'Upper body', full_detail: null, short_title: 'Upper express', short_detail: null,
  recovery_title: 'Walk', recovery_detail: null, chosen: null, completed_at: null, source: 'manual', ...p,
})
const base: SuggestContext = { today: '2026-10-14', blocks: [], workouts: [], habits: [], habitLogs: [], outfitsSaved: 0, outfitDaysNextWeek: 0, reviewedThisWeek: false }
const ids = (c: Partial<SuggestContext>) => suggest({ ...base, ...c }).map((s) => s.id.split('-')[0])

describe('suggestions', () => {
  it('offers to move a missed workout to a free day', () => {
    const s = suggest({ ...base, workouts: [w('2026-10-13'), w('2026-10-14')] })
    expect(s[0].actions.map((a) => a.label)).toEqual(['Move to tomorrow'])
  })
  it('stays quiet when yesterday was done', () => {
    expect(ids({ workouts: [w('2026-10-13', { completed_at: 'x' })] })).not.toContain('missed')
  })
  it('suggests short versions in a busy week', () => {
    const work = (d: number): ScheduleBlock => ({ id: String(d), title: 'Work', kind: 'work', date: null, weekday: d, start_time: '09:00', end_time: '18:00', repeat_from: null, repeat_until: null, skipped_dates: [], notes: null })
    const s = ids({ blocks: [3, 4, 5].map(work), workouts: [w('2026-10-14'), w('2026-10-16')] })
    expect(s).toContain('busy')
  })
  it('notices a struggling habit and suggests a smaller version', () => {
    const h = { id: 'h', title: 'Stretch', tier: 'flexible' as const, xp: 15, days: [0, 1, 2, 3, 4, 5, 6], active: true, sort_order: 0 }
    expect(ids({ habits: [h], habitLogs: [{ habit_id: 'h', date: '2026-10-10' }] })).toContain('habit')
    const logs = Array.from({ length: 8 }, (_, i) => ({ habit_id: 'h', date: `2026-10-0${i + 1}` }))
    expect(ids({ habits: [h], habitLogs: logs })).not.toContain('habit')
  })
  it('prompts the weekly reset and outfits on the weekend', () => {
    const s = ids({ today: '2026-10-18', outfitsSaved: 2 })
    expect(s).toEqual(expect.arrayContaining(['reset', 'outfits']))
    expect(ids({ today: '2026-10-18', outfitsSaved: 2, reviewedThisWeek: true, outfitDaysNextWeek: 5 })).toEqual([])
  })
})
