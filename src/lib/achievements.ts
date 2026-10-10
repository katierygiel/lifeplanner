import { addDays } from './dates'
import type { Routine, XpEvent } from './types'
import { levelFromXp } from './xp'

export type AchievementDef = { key: string; title: string; hint: string; repeatable?: boolean }

// Celebrates showing up and progress, never long perfect streaks.
export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first-step', title: 'First step', hint: 'Check off anything' },
  { key: 'big-day', title: 'Big day', hint: 'Earn 100 XP in one day' },
  { key: 'short-counts', title: 'Short still counts', hint: 'Finish a short workout' },
  { key: 'rest-counts', title: 'Rest counts', hint: 'Finish a recovery option' },
  { key: 'five-workouts', title: 'Five workouts logged', hint: 'Finish 5 workouts, any version' },
  { key: 'first-week', title: 'First week of showing up', hint: 'Be active on 7 different days' },
  { key: 'personal-reset', title: 'Completed a reset', hint: 'Finish a weekly reset or reflection' },
  { key: 'routine-regular', title: 'Routine regular', hint: 'Finish the same routine 10 times' },
  { key: 'ten-in-a-month', title: 'Ten workouts in a month', hint: '10 workouts in one calendar month' },
  { key: 'first-month', title: 'First month of consistency', hint: '12 active days within 30 days' },
  { key: 'outfit-week', title: 'Planned every outfit for a week', hint: 'Plan an outfit for each day, Mon–Sun' },
  { key: 'first-goal', title: 'Completed a seasonal goal', hint: 'Finish a goal in a season' },
  { key: 'season-wrap', title: 'Wrapped a season', hint: 'Review a season when it ends' },
  { key: 'level-5', title: 'Level 5', hint: 'Reach level 5' },
  { key: 'level-10', title: 'Level 10', hint: 'Reach level 10' },
  { key: 'comeback', title: 'Came back after a break', hint: 'Return after 3 or more days away', repeatable: true },
]

export const WORKOUT_AMOUNTS = { full: 30, short: 25, recovery: 20 }

export function activeDays(xp: XpEvent[]): string[] {
  return [...new Set(xp.map((e) => e.date))].sort()
}

// Returns achievement keys newly earned as of `today`. Repeatable ones get a date suffix.
export function evaluate(xp: XpEvent[], routines: Routine[], earned: Set<string>, today: string): string[] {
  const out: string[] = []
  const add = (k: string) => {
    if (!earned.has(k) && !out.includes(k)) out.push(k)
  }
  if (!xp.length) return out
  add('first-step')

  const perDay = new Map<string, number>()
  for (const e of xp) perDay.set(e.date, (perDay.get(e.date) ?? 0) + e.amount)
  if ([...perDay.values()].some((v) => v >= 100)) add('big-day')

  const workouts = xp.filter((e) => e.source_type === 'workout' || e.source_type === 'workout-log')
  if (workouts.some((e) => e.amount === WORKOUT_AMOUNTS.short)) add('short-counts')
  if (workouts.some((e) => e.amount === WORKOUT_AMOUNTS.recovery)) add('rest-counts')
  if (workouts.length >= 5) add('five-workouts')
  const byMonth = new Map<string, number>()
  for (const w of workouts) byMonth.set(w.date.slice(0, 7), (byMonth.get(w.date.slice(0, 7)) ?? 0) + 1)
  if ([...byMonth.values()].some((n) => n >= 10)) add('ten-in-a-month')

  const days = activeDays(xp)
  if (days.length >= 7) add('first-week')
  for (const d of days) {
    const end = addDays(d, 29)
    if (days.filter((x) => x >= d && x <= end).length >= 12) {
      add('first-month')
      break
    }
  }

  const routineCounts = new Map<string, number>()
  for (const e of xp.filter((e) => e.source_type === 'routine' && e.source_id)) routineCounts.set(e.source_id!, (routineCounts.get(e.source_id!) ?? 0) + 1)
  if ([...routineCounts.values()].some((n) => n >= 10)) add('routine-regular')
  const weekly = new Set(routines.filter((r) => r.time_of_day === 'weekly').map((r) => r.id))
  if ([...routineCounts.keys()].some((id) => weekly.has(id)) || xp.some((e) => e.source_type === 'review')) add('personal-reset')

  if (xp.some((e) => e.source_type === 'goal')) add('first-goal')
  if (xp.some((e) => e.source_type === 'season')) add('season-wrap')

  const level = levelFromXp(xp.reduce((s, e) => s + e.amount, 0)).level
  if (level >= 5) add('level-5')
  if (level >= 10) add('level-10')

  // Comeback: active today, and the previous active day was 4+ days ago (3+ days away).
  if (perDay.has(today)) {
    const before = days.filter((d) => d < today)
    const last = before[before.length - 1]
    if (last && last < addDays(today, -3)) add(`comeback-${today}`)
  }
  return out
}

export function defFor(key: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => key === a.key || key.startsWith(a.key + '-'))
}

// Last 7 days ending today: which were active.
export function weekDots(xp: XpEvent[], today: string) {
  const active = new Set(xp.map((e) => e.date))
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6)
    return { date: d, active: active.has(d) }
  })
}

// Away for a while, nothing yet today: a gentle welcome back.
export function daysAway(xp: XpEvent[], today: string): number {
  const days = activeDays(xp).filter((d) => d < today)
  if (!days.length || xp.some((e) => e.date === today)) return 0
  const last = days[days.length - 1]
  let n = 0
  let d = last
  while (d < today) {
    d = addDays(d, 1)
    n++
  }
  return n - 1
}
