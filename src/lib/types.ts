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
