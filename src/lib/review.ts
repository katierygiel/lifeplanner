import { addDays, fromDay } from './dates'
import type { XpEvent } from './types'

// Friday through Sunday you review the current week; Monday to Thursday, the week that just ended.
export function reviewWeekStart(today: string) {
  const dow = fromDay(today).getDay() // 0 Sun … 6 Sat
  const monday = addDays(today, -((dow + 6) % 7))
  return dow === 0 || dow >= 5 ? monday : addDays(monday, -7)
}

export function weekSummary(xp: XpEvent[], weekStart: string) {
  const end = addDays(weekStart, 6)
  const evs = xp.filter((e) => e.date >= weekStart && e.date <= end)
  const count = (pred: (e: XpEvent) => boolean) => evs.filter(pred).length
  return {
    xp: evs.reduce((s, e) => s + e.amount, 0),
    activeDays: new Set(evs.map((e) => e.date)).size,
    workouts: count((e) => e.source_type.startsWith('workout')),
    lighterWorkouts: count((e) => e.source_type.startsWith('workout') && e.amount < 30),
    routines: count((e) => e.source_type === 'routine'),
    habits: count((e) => e.source_type === 'habit'),
    tasks: count((e) => e.source_type === 'task'),
    milestones: count((e) => e.source_type === 'milestone'),
  }
}

export const REVIEW_QUESTIONS = [
  { key: 'went_well', label: 'What went well this week?', placeholder: 'Got 3 workouts in even with two field nights.' },
  { key: 'proud', label: 'What am I proud of?', placeholder: 'Planned my outfits every night.' },
  { key: 'hard', label: 'What made consistency hard?', placeholder: 'Late shifts Wednesday and Thursday.' },
  { key: 'change', label: 'What do I want to change next week?', placeholder: 'Lay out gym clothes the night before.' },
  { key: 'next_priority', label: 'My main priority next week', placeholder: 'Finish the portfolio case study.' },
] as const
export const REVIEW_XP = 25
