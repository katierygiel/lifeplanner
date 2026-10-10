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

export type BlockKind = 'work' | 'field' | 'gym' | 'friends' | 'family' | 'event' | 'commute' | 'other'

export type ScheduleBlock = {
  id: string
  title: string
  kind: BlockKind
  date: string | null // one-off
  weekday: number | null // weekly repeat, 0 = Sunday
  start_time: string // 'HH:MM' or 'HH:MM:SS'
  end_time: string
  repeat_from: string | null
  repeat_until: string | null
  skipped_dates: string[]
  notes: string | null
}
export type BlockInput = Omit<ScheduleBlock, 'id'>

export type WorkoutPlan = {
  id: string
  date: string
  full_title: string | null
  full_detail: string | null
  short_title: string | null
  short_detail: string | null
  recovery_title: string | null
  recovery_detail: string | null
  chosen: 'full' | 'short' | 'recovery' | null
  completed_at: string | null
  source: 'manual' | 'import'
}
export type WorkoutInput = Omit<WorkoutPlan, 'id'>

export type SeasonTheme = 'peri' | 'lilac' | 'lemon' | 'mint'

export type Season = {
  id: string
  name: string
  theme: SeasonTheme | null
  start_date: string
  end_date: string
  notes: string | null
  reflection: string | null
}

export type Milestone = {
  id: string
  title: string
  due_date: string | null
  done_at: string | null
  sort_order: number
}

export type Goal = {
  id: string
  season_id: string | null
  title: string
  description: string | null
  category: string | null
  target_date: string | null
  notes: string | null
  completed_at: string | null
  sort_order: number
  milestones: Milestone[]
  habit_ids: string[]
}
