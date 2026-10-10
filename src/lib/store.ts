import { supabase } from './supabase'
import type {
  BlockInput, Checkin, DayMode, Habit, HabitInput, Routine, RoutineLog, ScheduleBlock, Task, TaskInput, WorkoutInput, WorkoutPlan, XpEvent,
} from './types'

// One interface, two backends: the real database, and a demo store (for testing and a future portfolio demo).
export interface Store {
  listTasks(date: string): Promise<Task[]>
  createTask(input: TaskInput): Promise<Task>
  updateTask(id: string, patch: Partial<Task>): Promise<Task>
  updateTasks(ids: string[], patch: Partial<Task>): Promise<void>
  deleteTask(id: string): Promise<void>
  listXp(): Promise<XpEvent[]>
  addXp(e: Omit<XpEvent, 'id'>): Promise<XpEvent | null>
  removeXp(source_type: string, source_id: string, date?: string): Promise<void>
  getDayMode(date: string): Promise<DayMode | null>
  setDayMode(date: string, mode: DayMode): Promise<void>
  getCheckin(date: string): Promise<Checkin | null>
  saveCheckin(date: string, fields: Partial<Omit<Checkin, 'date'>>): Promise<void>
  listHabits(): Promise<Habit[]>
  createHabit(h: HabitInput): Promise<Habit>
  updateHabit(id: string, patch: Partial<HabitInput>): Promise<Habit>
  deleteHabit(id: string): Promise<void>
  listHabitLogs(date: string): Promise<string[]> // habit ids done that day
  setHabitDone(habitId: string, date: string, done: boolean): Promise<void>
  listRoutines(): Promise<Routine[]>
  saveRoutine(r: Routine): Promise<Routine>
  deleteRoutine(id: string): Promise<void>
  listRoutineLogs(date: string): Promise<RoutineLog[]>
  saveRoutineLog(log: RoutineLog): Promise<void>
  listTasksBetween(from: string, to: string): Promise<Task[]>
  listBlocks(): Promise<ScheduleBlock[]>
  createBlocks(b: BlockInput[]): Promise<ScheduleBlock[]>
  updateBlock(id: string, patch: Partial<BlockInput>): Promise<ScheduleBlock>
  deleteBlock(id: string): Promise<void>
  listWorkouts(from: string, to: string): Promise<WorkoutPlan[]>
  saveWorkout(w: WorkoutInput & { id?: string }): Promise<WorkoutPlan>
  replaceWorkouts(ws: WorkoutInput[]): Promise<void>
  deleteWorkout(id: string): Promise<void>
  listAchievements(): Promise<{ achievement_key: string; earned_at: string }[]>
  addAchievements(keys: string[]): Promise<void>
}

const fail = (what: string, error: { message: string } | null) => {
  if (error) throw new Error(`Couldn't ${what}. ${error.message}`)
}

const BLK = 'id,title,kind,date,weekday,start_time,end_time,repeat_from,repeat_until,skipped_dates,notes'
const WK = 'id,date,full_title,full_detail,short_title,short_detail,recovery_title,recovery_detail,chosen,completed_at,source'
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
  async removeXp(source_type, source_id, date) {
    let q = supabase.from('xp_events').delete().eq('source_type', source_type).eq('source_id', source_id)
    if (date) q = q.eq('date', date)
    const { error } = await q
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
  async getCheckin(date) {
    const { data, error } = await supabase
      .from('checkins')
      .select('date,energy,mood,motivation,soreness,day_mode')
      .eq('date', date)
      .maybeSingle()
    fail('load your check-in', error)
    return (data as Checkin) ?? null
  },
  async saveCheckin(date, fields) {
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('checkins').upsert({ user_id: u.user?.id, date, ...fields }, { onConflict: 'user_id,date' })
    fail('save your check-in', error)
  },
  async listHabits() {
    const { data, error } = await supabase.from('habits').select('id,title,tier,xp,days,active,sort_order').order('sort_order')
    fail('load your habits', error)
    return (data ?? []) as Habit[]
  },
  async createHabit(h) {
    const { data, error } = await supabase.from('habits').insert(h).select('id,title,tier,xp,days,active,sort_order').single()
    fail('add that habit', error)
    return data as Habit
  },
  async updateHabit(id, patch) {
    const { data, error } = await supabase.from('habits').update(patch).eq('id', id).select('id,title,tier,xp,days,active,sort_order').single()
    fail('save that habit', error)
    return data as Habit
  },
  async deleteHabit(id) {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    fail('delete that habit', error)
  },
  async listHabitLogs(date) {
    const { data, error } = await supabase.from('habit_logs').select('habit_id').eq('date', date)
    fail('load your habits', error)
    return (data ?? []).map((r) => r.habit_id as string)
  },
  async setHabitDone(habitId, date, done) {
    const { error } = done
      ? await supabase.from('habit_logs').upsert({ habit_id: habitId, date }, { onConflict: 'habit_id,date', ignoreDuplicates: true })
      : await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', date)
    fail('save that habit', error)
  },
  async listRoutines() {
    const { data, error } = await supabase
      .from('routines')
      .select('id,title,time_of_day,days,xp,sort_order,steps:routine_steps(id,title,duration_min,optional,in_busy_version,sort_order)')
      .order('sort_order')
    fail('load your routines', error)
    return (data ?? []) as Routine[]
  },
  async saveRoutine(r) {
    const { steps, ...routine } = r
    const { error } = await supabase.from('routines').upsert(routine)
    fail('save that routine', error)
    const { data: existing, error: e2 } = await supabase.from('routine_steps').select('id').eq('routine_id', r.id)
    fail('save that routine', e2)
    const keep = new Set(steps.map((s) => s.id))
    const gone = (existing ?? []).map((s) => s.id as string).filter((id) => !keep.has(id))
    if (gone.length) {
      const { error: e3 } = await supabase.from('routine_steps').delete().in('id', gone)
      fail('save that routine', e3)
    }
    if (steps.length) {
      const { error: e4 } = await supabase.from('routine_steps').upsert(steps.map((s, i) => ({ ...s, sort_order: i, routine_id: r.id })))
      fail('save that routine', e4)
    }
    return r
  },
  async deleteRoutine(id) {
    const { error } = await supabase.from('routines').delete().eq('id', id)
    fail('delete that routine', error)
  },
  async listRoutineLogs(date) {
    const { data, error } = await supabase.from('routine_logs').select('routine_id,date,version,completed_steps,completed').eq('date', date)
    fail('load your routines', error)
    return (data ?? []) as RoutineLog[]
  },
  async saveRoutineLog(log) {
    const { error } = await supabase.from('routine_logs').upsert(log, { onConflict: 'routine_id,date' })
    fail('save your routine', error)
  },
  async listTasksBetween(from, to) {
    const { data, error } = await supabase.from('tasks').select(TASK_COLS).gte('planned_date', from).lte('planned_date', to)
    fail('load your week', error)
    return (data ?? []) as Task[]
  },
  async listBlocks() {
    const { data, error } = await supabase.from('schedule_blocks').select(BLK)
    fail('load your schedule', error)
    return (data ?? []) as ScheduleBlock[]
  },
  async createBlocks(bs) {
    const { data, error } = await supabase.from('schedule_blocks').insert(bs).select(BLK)
    fail('add that to your schedule', error)
    return (data ?? []) as ScheduleBlock[]
  },
  async updateBlock(id, patch) {
    const { data, error } = await supabase.from('schedule_blocks').update(patch).eq('id', id).select(BLK).single()
    fail('save that change', error)
    return data as ScheduleBlock
  },
  async deleteBlock(id) {
    const { error } = await supabase.from('schedule_blocks').delete().eq('id', id)
    fail('delete that', error)
  },
  async listWorkouts(from, to) {
    const { data, error } = await supabase.from('workouts_planned').select(WK).gte('date', from).lte('date', to)
    fail('load your workouts', error)
    return (data ?? []) as WorkoutPlan[]
  },
  async saveWorkout(w) {
    const { data, error } = await supabase.from('workouts_planned').upsert(w).select(WK).single()
    fail('save that workout', error)
    return data as WorkoutPlan
  },
  async replaceWorkouts(ws) {
    if (!ws.length) return
    const dates = ws.map((w) => w.date)
    const { error: e1 } = await supabase.from('workouts_planned').delete().in('date', dates).is('completed_at', null)
    fail('import your workouts', e1)
    const { data: kept, error: e2 } = await supabase.from('workouts_planned').select('date').in('date', dates)
    fail('import your workouts', e2)
    const done = new Set((kept ?? []).map((k) => k.date as string))
    const fresh = ws.filter((w) => !done.has(w.date))
    if (fresh.length) {
      const { error: e3 } = await supabase.from('workouts_planned').insert(fresh)
      fail('import your workouts', e3)
    }
  },
  async deleteWorkout(id) {
    const { error } = await supabase.from('workouts_planned').delete().eq('id', id)
    fail('delete that workout', error)
  },
  async listAchievements() {
    const { data, error } = await supabase.from('achievements_earned').select('achievement_key,earned_at').order('earned_at')
    fail('load your achievements', error)
    return data ?? []
  },
  async addAchievements(keys) {
    if (!keys.length) return
    const { error } = await supabase
      .from('achievements_earned')
      .upsert(keys.map((achievement_key) => ({ achievement_key })), { onConflict: 'user_id,achievement_key', ignoreDuplicates: true })
    fail('save your achievement', error)
  },
}

/* ---------- Demo store (browser only) ---------- */
type DemoData = {
  tasks: Task[]
  xp: XpEvent[]
  modes: Record<string, DayMode>
  checkins?: Record<string, Checkin>
  habits?: Habit[]
  habitLogs?: { habit_id: string; date: string }[]
  routines?: Routine[]
  routineLogs?: RoutineLog[]
  blocks?: ScheduleBlock[]
  workouts?: WorkoutPlan[]
  achievements?: { achievement_key: string; earned_at: string }[]
}
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

export const demoStore = {
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
  async removeXp(source_type, source_id, date) {
    demo.xp = demo.xp.filter((x) => !(x.source_type === source_type && x.source_id === source_id && (!date || x.date === date)))
    save()
  },
  async getDayMode(date) {
    return demo.modes[date] ?? null
  },
  async setDayMode(date, mode) {
    demo.modes[date] = mode
    save()
  },
  async getCheckin(date) {
    const c = demo.checkins?.[date]
    return c ? { ...c, day_mode: demo.modes[date] ?? c.day_mode } : null
  },
  async saveCheckin(date, fields) {
    demo.checkins ??= {}
    const prev = demo.checkins[date] ?? { date, energy: null, mood: null, motivation: null, soreness: null, day_mode: 'full' }
    demo.checkins[date] = { ...prev, ...fields }
    if (fields.day_mode) demo.modes[date] = fields.day_mode
    save()
  },
  async listHabits() {
    return [...(demo.habits ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  },
  async createHabit(h) {
    const habit = { id: uid(), ...h }
    demo.habits = [...(demo.habits ?? []), habit]
    save()
    return habit
  },
  async updateHabit(id, patch) {
    demo.habits = (demo.habits ?? []).map((h) => (h.id === id ? { ...h, ...patch } : h))
    save()
    return demo.habits.find((h) => h.id === id)!
  },
  async deleteHabit(id) {
    demo.habits = (demo.habits ?? []).filter((h) => h.id !== id)
    demo.habitLogs = (demo.habitLogs ?? []).filter((l) => l.habit_id !== id)
    save()
  },
  async listHabitLogs(date) {
    return (demo.habitLogs ?? []).filter((l) => l.date === date).map((l) => l.habit_id)
  },
  async setHabitDone(habitId, date, done) {
    const logs = (demo.habitLogs ?? []).filter((l) => !(l.habit_id === habitId && l.date === date))
    demo.habitLogs = done ? [...logs, { habit_id: habitId, date }] : logs
    save()
  },
  async listRoutines() {
    return [...(demo.routines ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  },
  async saveRoutine(r) {
    const rest = (demo.routines ?? []).filter((x) => x.id !== r.id)
    demo.routines = [...rest, { ...r, steps: r.steps.map((s, i) => ({ ...s, sort_order: i })) }]
    save()
    return r
  },
  async deleteRoutine(id) {
    demo.routines = (demo.routines ?? []).filter((r) => r.id !== id)
    demo.routineLogs = (demo.routineLogs ?? []).filter((l) => l.routine_id !== id)
    save()
  },
  async listRoutineLogs(date) {
    return (demo.routineLogs ?? []).filter((l) => l.date === date)
  },
  async saveRoutineLog(log) {
    demo.routineLogs = [...(demo.routineLogs ?? []).filter((l) => !(l.routine_id === log.routine_id && l.date === log.date)), log]
    save()
  },
} as Store

export const newId = uid

Object.assign(demoStore, {
  async listTasksBetween(from: string, to: string) {
    return demo.tasks.filter((t) => t.planned_date && t.planned_date >= from && t.planned_date <= to)
  },
  async listBlocks() {
    return demo.blocks ?? []
  },
  async createBlocks(bs: BlockInput[]) {
    const made = bs.map((b) => ({ id: uid(), ...b }))
    demo.blocks = [...(demo.blocks ?? []), ...made]
    save()
    return made
  },
  async updateBlock(id: string, patch: Partial<BlockInput>) {
    demo.blocks = (demo.blocks ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b))
    save()
    return demo.blocks.find((b) => b.id === id)!
  },
  async deleteBlock(id: string) {
    demo.blocks = (demo.blocks ?? []).filter((b) => b.id !== id)
    save()
  },
  async listWorkouts(from: string, to: string) {
    return (demo.workouts ?? []).filter((w) => w.date >= from && w.date <= to)
  },
  async saveWorkout(w: WorkoutInput & { id?: string }) {
    const saved = { ...w, id: w.id ?? uid() } as WorkoutPlan
    demo.workouts = [...(demo.workouts ?? []).filter((x) => x.id !== saved.id), saved]
    save()
    return saved
  },
  async replaceWorkouts(ws: WorkoutInput[]) {
    const dates = new Set(ws.map((w) => w.date))
    const keep = (demo.workouts ?? []).filter((w) => !dates.has(w.date) || w.completed_at)
    const done = new Set(keep.filter((w) => w.completed_at).map((w) => w.date))
    demo.workouts = [...keep, ...ws.filter((w) => !done.has(w.date)).map((w) => ({ ...w, id: uid() }))]
    save()
  },
  async deleteWorkout(id: string) {
    demo.workouts = (demo.workouts ?? []).filter((w) => w.id !== id)
    save()
  },
  async listAchievements() {
    return demo.achievements ?? []
  },
  async addAchievements(keys: string[]) {
    const have = new Set((demo.achievements ?? []).map((a) => a.achievement_key))
    demo.achievements = [...(demo.achievements ?? []), ...keys.filter((k) => !have.has(k)).map((k) => ({ achievement_key: k, earned_at: new Date().toISOString() }))]
    save()
  },
} satisfies Partial<Store>)

export const IS_DEMO = import.meta.env.VITE_DEMO === '1'
export const store: Store = IS_DEMO ? demoStore : supabaseStore
