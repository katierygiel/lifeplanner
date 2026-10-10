import { addDays, fromDay } from './dates'
import type { Goal, Season } from './types'

const dayDiff = (a: string, b: string) => Math.round((fromDay(b).getTime() - fromDay(a).getTime()) / 86400000)

export function seasonStatus(s: Season, today: string): 'upcoming' | 'active' | 'ended' {
  if (today < s.start_date) return 'upcoming'
  if (today > s.end_date) return 'ended'
  return 'active'
}

export function seasonTime(s: Season, today: string) {
  const total = dayDiff(s.start_date, s.end_date) + 1
  const elapsed = Math.min(total, Math.max(0, dayDiff(s.start_date, today) + 1))
  const weeks = Math.max(1, Math.ceil(total / 7))
  const week = Math.min(weeks, Math.max(1, Math.ceil(elapsed / 7)))
  return { total, elapsed, ratio: total ? elapsed / total : 0, week, weeks, daysLeft: Math.max(0, total - elapsed) }
}

// A goal's progress: milestones done, or complete when marked complete.
export function goalProgress(g: Goal) {
  if (g.completed_at) return { done: g.milestones.length, total: g.milestones.length, ratio: 1 }
  const done = g.milestones.filter((m) => m.done_at).length
  return { done, total: g.milestones.length, ratio: g.milestones.length ? done / g.milestones.length : 0 }
}

export function seasonProgress(goals: Goal[]) {
  if (!goals.length) return 0
  return goals.reduce((s, g) => s + goalProgress(g).ratio, 0) / goals.length
}

export const CATEGORIES = ['Fitness', 'Personal growth', 'Career', 'Creative', 'Finances', 'Organization', 'Lifestyle']

export const THEMES: Record<string, { label: string; bg: string; bar: string; soft: string }> = {
  peri: { label: 'Periwinkle', bg: 'bg-peri-wash', bar: 'bg-peri-deep', soft: 'bg-peri-soft' },
  lilac: { label: 'Lilac', bg: 'bg-lilac-wash', bar: 'bg-lilac-deep', soft: 'bg-lilac' },
  lemon: { label: 'Lemon', bg: 'bg-lemon-soft', bar: 'bg-lemon-deep', soft: 'bg-lemon' },
  mint: { label: 'Mint', bg: 'bg-mint/50', bar: 'bg-mint-ink', soft: 'bg-mint' },
}

// A suggested 8-week season starting today, named for the time of year.
export function suggestedSeason(today: string) {
  const m = fromDay(today).getMonth()
  const name = m >= 8 && m <= 10 ? 'My Fall Reset' : m === 11 || m <= 1 ? 'New Year, New Rhythm' : m <= 4 ? 'Spring Season' : 'Summer Season'
  return { name, start_date: today, end_date: addDays(today, 8 * 7 - 1) }
}

export const MILESTONE_XP = 15
export const GOAL_XP = 50
