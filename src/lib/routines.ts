import type { Checkin, DayMode, Routine, RoutineLog, RoutineStep } from './types'

export const isOn = (days: number[], date: string) => days.includes(new Date(date + 'T12:00').getDay())

// Busy-version steps are the ones marked for busy days. Optional steps never block completion.
export function stepsFor(routine: Routine, version: 'full' | 'busy'): RoutineStep[] {
  const steps = [...routine.steps].sort((a, b) => a.sort_order - b.sort_order)
  return version === 'busy' ? steps.filter((s) => s.in_busy_version) : steps
}

export function routineProgress(routine: Routine, log: RoutineLog | undefined, version: 'full' | 'busy') {
  const steps = stepsFor(routine, version)
  const required = steps.filter((s) => !s.optional)
  const done = new Set(log?.completed_steps ?? [])
  const requiredDone = required.filter((s) => done.has(s.id)).length
  return {
    steps,
    doneCount: steps.filter((s) => done.has(s.id)).length,
    total: steps.length,
    complete: required.length > 0 ? requiredDone === required.length : steps.length > 0 && steps.every((s) => done.has(s.id)),
  }
}

export const defaultVersion = (mode: DayMode): 'full' | 'busy' => (mode === 'full' ? 'full' : 'busy')

// Gentle, rule-based nudge from the check-in. Returns null when the current plan already fits.
export function checkinSuggestion(c: Partial<Checkin>, mode: DayMode): { mode: DayMode; text: string } | null {
  const tired = (c.energy ?? 3) <= 2
  const sore = (c.soreness ?? 1) >= 4
  const low = (c.motivation ?? 3) <= 2
  if ((tired && sore) || (c.energy ?? 3) === 1) {
    if (mode === 'essentials' || mode === 'busy') return null
    return { mode: 'essentials', text: 'Low energy and sore? Essentials plus recovery still counts as a win today.' }
  }
  if (tired || sore || low) {
    if (mode !== 'full') return null
    return { mode: 'short', text: sore ? 'Feeling sore. A shorter day with the short or recovery workout could fit better.' : 'A shorter day might fit better. Short versions still earn XP.' }
  }
  return null
}
