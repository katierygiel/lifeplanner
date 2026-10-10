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

export type WorkoutKind = 'strength' | 'run' | 'walk' | 'pilates' | 'mobility' | 'hyrox' | 'other'
export type SetEntry = { reps: number | null; weight: number | null }
export type ExerciseEntry = { name: string; sets: SetEntry[]; notes?: string }

export type WorkoutLog = {
  id: string
  date: string
  kind: WorkoutKind
  title: string
  version: 'full' | 'short' | 'recovery' | null
  plan_id: string | null
  duration_min: number | null
  distance_km: number | null
  exercises: ExerciseEntry[]
  effort: number | null
  notes: string | null
}

export type WorkoutTemplate = {
  id: string
  title: string
  kind: WorkoutKind
  exercises: ExerciseEntry[]
  notes: string | null
}

export type PullupVariation = 'negative' | 'band' | 'assisted' | 'chinup' | 'strict'
export type PullupLog = { id: string; date: string; variation: PullupVariation; best_reps: number; sets: number | null; notes: string | null }

export type Race = { id: string; name: string; date: string; division: string | null; result: string | null; notes: string | null }

export type ClosetItem = {
  id: string
  name: string
  category: string
  color: string | null
  seasons: string[]
  occasions: string[]
  photo_path: string | null
  favorite: boolean
  notes: string | null
}

export type Outfit = {
  id: string
  name: string | null
  occasion: string | null
  item_ids: string[]
  favorite: boolean
  notes: string | null
}

export type OutfitDay = { id: string; date: string; outfit_id: string; worn: boolean }

export type WeeklyReview = {
  id: string
  week_start: string
  went_well: string | null
  proud: string | null
  hard: string | null
  change: string | null
  next_priority: string | null
}

export type MealKind = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Meal = { id: string; name: string; kind: MealKind; notes: string | null; is_backup: boolean; favorite: boolean }
export type MealSlot = 'breakfast' | 'lunch' | 'dinner'
export type MealPlanEntry = { id: string; date: string; slot: MealSlot; meal_id: string | null; label: string | null; prepped: boolean }
export type GroceryItem = { id: string; name: string; category: string | null; checked: boolean }
