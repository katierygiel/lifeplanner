import type { Tier } from './xp'

export type DayMode = 'full' | 'short' | 'essentials' | 'busy'

export type Task = {
  id: string
  title: string
  notes: string | null
  tier: Tier
  duration_min: number | null
  planned_date: string | null
  fixed_time: string | null
  is_priority: boolean
  status: 'open' | 'done' | 'skipped'
  completed_at: string | null
  sort_order: number
  created_at?: string
}

export type TaskInput = Pick<Task, 'title' | 'tier' | 'duration_min' | 'planned_date' | 'is_priority'> &
  Partial<Pick<Task, 'notes' | 'fixed_time'>>

export type XpEvent = {
  id: string
  amount: number
  source_type: string
  source_id: string | null
  date: string
}

export type Checkin = {
  date: string
  energy: number | null
  mood: number | null
  motivation: number | null
  soreness: number | null
  day_mode: DayMode
}

export type Habit = {
  id: string
  title: string
  tier: Tier
  xp: number
  days: number[] // 0 = Sunday … 6 = Saturday
  active: boolean
  sort_order: number
}
export type HabitInput = Omit<Habit, 'id'>

export type RoutineStep = {
  id: string
  title: string
  duration_min: number | null
  optional: boolean
  in_busy_version: boolean
  sort_order: number
}

export type Routine = {
  id: string
  title: string
  time_of_day: 'morning' | 'day' | 'evening' | 'weekly'
  days: number[]
  xp: number
  sort_order: number
  steps: RoutineStep[]
}

export type RoutineLog = {
  routine_id: string
  date: string
  version: 'full' | 'busy'
  completed_steps: string[]
  completed: boolean
}
