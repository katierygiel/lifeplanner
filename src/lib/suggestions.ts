import { addDays, fromDay } from './dates'
import { blocksOn, dayLoad } from './schedule'
import type { Habit, ScheduleBlock, WorkoutPlan } from './types'

export type SuggestionAction =
  | { kind: 'move-workout'; label: string; workoutId: string; to: string }
  | { kind: 'shorten-week'; label: string; workoutIds: string[] }
  | { kind: 'edit-habit'; label: string; habitId: string }
  | { kind: 'go'; label: string; to: 'closet' | 'reset' | 'meals' | 'week' }

export type Suggestion = { id: string; text: string; actions: SuggestionAction[] }

export type SuggestContext = {
  today: string
  blocks: ScheduleBlock[] // all blocks (repeating + one-off)
  workouts: WorkoutPlan[] // yesterday through the next 6 days
  habits: Habit[]
  habitLogs: { habit_id: string; date: string }[] // last 14 days, not today
  outfitsSaved: number
  outfitDaysNextWeek: number
  reviewedThisWeek: boolean
}

// Plain rules on her own data. Each one suggests; nothing changes without a tap.
export function suggest(c: SuggestContext): Suggestion[] {
  const out: Suggestion[] = []
  const dow = fromDay(c.today).getDay()
  const yesterday = addDays(c.today, -1)
  const tomorrow = addDays(c.today, 1)
  const hasWorkout = (d: string) => c.workouts.some((w) => w.date === d)

  const missed = c.workouts.find((w) => w.date === yesterday && !w.completed_at)
  if (missed) {
    const actions: SuggestionAction[] = []
    if (!hasWorkout(c.today)) actions.push({ kind: 'move-workout', label: 'Move to today', workoutId: missed.id, to: c.today })
    if (!hasWorkout(tomorrow)) actions.push({ kind: 'move-workout', label: 'Move to tomorrow', workoutId: missed.id, to: tomorrow })
    if (actions.length)
      out.push({ id: `missed-${missed.id}`, text: `Yesterday's ${missed.full_title ?? 'workout'} didn't happen, and that's okay. Want to move it?`, actions })
  }

  const rest = Array.from({ length: 7 - ((dow + 6) % 7) }, (_, i) => addDays(c.today, i)) // today through Sunday
  const busyDays = rest.filter((d) => ['busy', 'full'].includes(dayLoad(blocksOn(c.blocks, d), []).level)).length
  const fullWorkouts = c.workouts.filter((w) => w.date >= c.today && rest.includes(w.date) && !w.completed_at && w.short_title && w.chosen !== 'short')
  if (busyDays >= 3 && fullWorkouts.length >= 2)
    out.push({
      id: `busy-${c.today}`,
      text: `${busyDays} busy days left this week. Switch the remaining workouts to their short versions? They still count.`,
      actions: [{ kind: 'shorten-week', label: 'Use short versions', workoutIds: fullWorkouts.map((w) => w.id) }],
    })

  for (const h of c.habits.filter((x) => x.active)) {
    const scheduled = Array.from({ length: 14 }, (_, i) => addDays(c.today, -14 + i)).filter((d) => h.days.includes(fromDay(d).getDay()))
    if (scheduled.length < 6) continue
    const done = c.habitLogs.filter((l) => l.habit_id === h.id && scheduled.includes(l.date)).length
    if (done / scheduled.length < 0.35) {
      out.push({
        id: `habit-${h.id}`,
        text: `"${h.title}" has been tough lately (${done} of ${scheduled.length} days). A smaller version still builds the habit.`,
        actions: [{ kind: 'edit-habit', label: 'Make it smaller', habitId: h.id }],
      })
      break
    }
  }

  if ((dow === 0 || dow >= 5) && !c.reviewedThisWeek)
    out.push({ id: `reset-${c.today}`, text: 'Time for your weekly reset: look back, reflect, and set up next week.', actions: [{ kind: 'go', label: 'Start reset', to: 'reset' }] })

  if ((dow === 0 || dow === 6) && c.outfitsSaved > 0 && c.outfitDaysNextWeek < 3)
    out.push({ id: `outfits-${c.today}`, text: "Next week's outfits aren't planned yet. A few minutes now saves mornings later.", actions: [{ kind: 'go', label: 'Plan outfits', to: 'closet' }] })

  return out
}
