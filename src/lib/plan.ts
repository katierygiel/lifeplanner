import type { DayMode, Task } from './types'
import type { Tier } from './xp'

export const DAY_MODES: { id: DayMode; label: string; note: string }[] = [
  { id: 'full', label: 'Full plan', note: 'Plenty in the tank. Everything is on.' },
  { id: 'short', label: 'Shorter day', note: 'Optional extras are tucked away for today.' },
  { id: 'essentials', label: 'Essentials', note: 'Just the must-dos and recovery. That counts.' },
  { id: 'busy', label: 'Busy day', note: 'Must-dos only. Flexible tasks can move to another day.' },
]

export const VISIBLE_TIERS: Record<DayMode, Tier[]> = {
  full: ['must', 'flexible', 'optional', 'recovery'],
  short: ['must', 'flexible', 'recovery'],
  essentials: ['must', 'recovery'],
  busy: ['must', 'recovery'],
}

const TIER_ORDER: Record<Tier, number> = { must: 0, flexible: 1, recovery: 2, optional: 3 }

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      Number(a.status === 'done') - Number(b.status === 'done') ||
      (a.fixed_time ?? '99').localeCompare(b.fixed_time ?? '99') ||
      TIER_ORDER[a.tier] - TIER_ORDER[b.tier] ||
      a.sort_order - b.sort_order ||
      (a.created_at ?? '').localeCompare(b.created_at ?? ''),
  )
}

// Splits today's tasks for the chosen day mode. Finished tasks always stay visible, so effort is never hidden.
export function splitForMode(tasks: Task[], mode: DayMode) {
  const show = VISIBLE_TIERS[mode]
  const visible = sortTasks(tasks.filter((t) => t.status === 'done' || show.includes(t.tier)))
  const hidden = tasks.filter((t) => t.status !== 'done' && !show.includes(t.tier))
  const movable = mode === 'busy' ? hidden.filter((t) => t.tier === 'flexible') : []
  return { visible, hidden, movable }
}
