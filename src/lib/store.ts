import { supabase } from './supabase'
import type { DayMode, Task, TaskInput, XpEvent } from './types'

// One interface, two backends: the real database, and a demo store (for testing and a future portfolio demo).
export interface Store {
  listTasks(date: string): Promise<Task[]>
  createTask(input: TaskInput): Promise<Task>
  updateTask(id: string, patch: Partial<Task>): Promise<Task>
  updateTasks(ids: string[], patch: Partial<Task>): Promise<void>
  deleteTask(id: string): Promise<void>
  listXp(): Promise<XpEvent[]>
  addXp(e: Omit<XpEvent, 'id'>): Promise<XpEvent | null>
  removeXp(source_type: string, source_id: string): Promise<void>
  getDayMode(date: string): Promise<DayMode | null>
  setDayMode(date: string, mode: DayMode): Promise<void>
}

const fail = (what: string, error: { message: string } | null) => {
  if (error) throw new Error(`Couldn't ${what}. ${error.message}`)
}

const TASK_COLS = 'id,title,notes,tier,duration_min,planned_date,fixed_time,is_priority,status,completed_at,sort_order,created_at'

export const supabaseStore: Store = {
  async listTasks(date) {
    const { data, error } = await supabase.from('tasks').select(TASK_COLS).eq('planned_date', date)
    fail('load your tasks', error)
    return (data ?? []) as Task[]
  },
  async createTask(input) {
    const { data, error } = await supabase.from('tasks').insert(input).select(TASK_COLS).single()
    fail('add that task', error)
    return data as Task
  },
  async updateTask(id, patch) {
    const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select(TASK_COLS).single()
    fail('save that change', error)
    return data as Task
  },
  async updateTasks(ids, patch) {
    if (!ids.length) return
    const { error } = await supabase.from('tasks').update(patch).in('id', ids)
    fail('move those tasks', error)
  },
  async deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    fail('delete that task', error)
  },
  async listXp() {
    const { data, error } = await supabase.from('xp_events').select('id,amount,source_type,source_id,date')
    fail('load your XP', error)
    return (data ?? []) as XpEvent[]
  },
  async addXp(e) {
    const { data, error } = await supabase.from('xp_events').insert(e).select('id,amount,source_type,source_id,date').single()
    if (error?.code === '23505') return null // already earned for this item today
    fail('save your XP', error)
    return data as XpEvent
  },
  async removeXp(source_type, source_id) {
    const { error } = await supabase.from('xp_events').delete().eq('source_type', source_type).eq('source_id', source_id)
    fail('update your XP', error)
  },
  async getDayMode(date) {
    const { data, error } = await supabase.from('checkins').select('day_mode').eq('date', date).maybeSingle()
    fail('load your check-in', error)
    return (data?.day_mode as DayMode) ?? null
  },
  async setDayMode(date, mode) {
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('checkins')
      .upsert({ user_id: u.user?.id, date, day_mode: mode }, { onConflict: 'user_id,date' })
    fail('save your check-in', error)
  },
}

/* ---------- Demo store (browser only) ---------- */
type DemoData = { tasks: Task[]; xp: XpEvent[]; modes: Record<string, DayMode> }
const KEY = 'levelup-demo'
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

function load(): DemoData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage unavailable */
  }
  return { tasks: [], xp: [], modes: {} }
}
let demo = load()
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(demo))
  } catch {
    /* storage unavailable */
  }
}

export const demoStore: Store = {
  async listTasks(date) {
    return demo.tasks.filter((t) => t.planned_date === date)
  },
  async createTask(input) {
    const t: Task = {
      id: uid(), notes: null, fixed_time: null, status: 'open', completed_at: null, sort_order: 0,
      created_at: new Date().toISOString(), ...input,
    }
    demo.tasks.push(t)
    save()
    return t
  },
  async updateTask(id, patch) {
    demo.tasks = demo.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t))
    save()
    return demo.tasks.find((t) => t.id === id)!
  },
  async updateTasks(ids, patch) {
    demo.tasks = demo.tasks.map((t) => (ids.includes(t.id) ? { ...t, ...patch } : t))
    save()
  },
  async deleteTask(id) {
    demo.tasks = demo.tasks.filter((t) => t.id !== id)
    save()
  },
  async listXp() {
    return demo.xp
  },
  async addXp(e) {
    if (demo.xp.some((x) => x.source_type === e.source_type && x.source_id === e.source_id && x.date === e.date)) return null
    const x = { id: uid(), ...e }
    demo.xp.push(x)
    save()
    return x
  },
  async removeXp(source_type, source_id) {
    demo.xp = demo.xp.filter((x) => !(x.source_type === source_type && x.source_id === source_id))
    save()
  },
  async getDayMode(date) {
    return demo.modes[date] ?? null
  },
  async setDayMode(date, mode) {
    demo.modes[date] = mode
    save()
  },
}

export const IS_DEMO = import.meta.env.VITE_DEMO === '1'
export const store: Store = IS_DEMO ? demoStore : supabaseStore
