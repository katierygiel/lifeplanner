import { supabase } from './supabase'
import type {
  BlockInput, Checkin, ClosetItem, GroceryItem, Meal, MealPlanEntry, WeeklyReview, DayMode, Goal, Outfit, OutfitDay, Habit, PullupLog, Race, Season, WorkoutLog, WorkoutTemplate, HabitInput, Routine, RoutineLog, ScheduleBlock, Task, TaskInput, WorkoutInput, WorkoutPlan, XpEvent,
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
  listSeasons(): Promise<Season[]>
  saveSeason(s: Season): Promise<Season>
  deleteSeason(id: string): Promise<void>
  listGoals(): Promise<Goal[]>
  saveGoal(g: Goal): Promise<Goal>
  deleteGoal(id: string): Promise<void>
  setMilestoneDone(id: string, done: boolean): Promise<void>
  setGoalCompleted(id: string, done: boolean): Promise<void>
  workoutLogs: Crud<WorkoutLog>
  templates: Crud<WorkoutTemplate>
  pullups: Crud<PullupLog>
  races: Crud<Race>
  closet: Crud<ClosetItem>
  outfits: Crud<Outfit>
  listOutfitDays(from: string, to: string): Promise<OutfitDay[]>
  setOutfitDay(date: string, outfitId: string | null): Promise<OutfitDay | null>
  setWorn(id: string, worn: boolean): Promise<void>
  uploadPhoto(itemId: string, blob: Blob): Promise<string>
  photoUrls(paths: string[]): Promise<Record<string, string>>
  removePhoto(path: string): Promise<void>
  reviews: Crud<WeeklyReview>
  meals: Crud<Meal>
  groceries: Crud<GroceryItem>
  listMealPlan(from: string, to: string): Promise<MealPlanEntry[]>
  setMealPlan(e: Omit<MealPlanEntry, 'id'>): Promise<MealPlanEntry | null>
  listHabitLogsBetween(from: string, to: string): Promise<{ habit_id: string; date: string }[]>
}

// Simple list/save/delete for tables owned by the signed-in person.
export type Crud<T extends { id: string }> = {
  list(): Promise<T[]>
  save(row: T): Promise<T>
  remove(id: string): Promise<void>
}

function supabaseCrud<T extends { id: string }>(table: string, cols: string, what: string, order = 'created_at'): Crud<T> {
  return {
    async list() {
      const { data, error } = await supabase.from(table).select(cols).order(order, { ascending: false })
      fail(`load your ${what}`, error)
      return (data ?? []) as unknown as T[]
    },
    async save(row) {
      const { data, error } = await supabase.from(table).upsert(row).select(cols).single()
      fail(`save that ${what.replace(/s$/, '')}`, error)
      return data as unknown as T
    },
    async remove(id) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      fail(`delete that ${what.replace(/s$/, '')}`, error)
    },
  }
}

function demoCrud<T extends { id: string }>(key: string, order: keyof T): Crud<T> {
  const rows = () => ((demo as unknown as Record<string, T[]>)[key] ??= [])
  const set = (v: T[]) => {
    ;(demo as unknown as Record<string, T[]>)[key] = v
    save()
  }
  return {
    async list() {
      return [...rows()].sort((a, b) => String(b[order]).localeCompare(String(a[order])))
    },
    async save(row) {
      set([...rows().filter((r) => r.id !== row.id), row])
      return row
    },
    async remove(id) {
      set(rows().filter((r) => r.id !== id))
    },
  }
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
  async listSeasons() {
    const { data, error } = await supabase.from('seasons').select('id,name,theme,start_date,end_date,notes,reflection').order('start_date', { ascending: false })
    fail('load your seasons', error)
    return (data ?? []) as Season[]
  },
  async saveSeason(se) {
    const { data, error } = await supabase.from('seasons').upsert(se).select('id,name,theme,start_date,end_date,notes,reflection').single()
    fail('save that season', error)
    return data as Season
  },
  async deleteSeason(id) {
    const { error } = await supabase.from('seasons').delete().eq('id', id)
    fail('delete that season', error)
  },
  async listGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('id,season_id,title,description,category,target_date,notes,completed_at,sort_order,milestones(id,title,due_date,done_at,sort_order),goal_habits(habit_id)')
      .order('sort_order')
    fail('load your goals', error)
    return (data ?? []).map(({ goal_habits, ...g }) => ({ ...g, habit_ids: (goal_habits as { habit_id: string }[]).map((x) => x.habit_id) })) as Goal[]
  },
  async saveGoal(g) {
    const { milestones, habit_ids, ...goal } = g
    const { error } = await supabase.from('goals').upsert(goal)
    fail('save that goal', error)
    const { data: existing, error: e2 } = await supabase.from('milestones').select('id').eq('goal_id', g.id)
    fail('save that goal', e2)
    const keep = new Set(milestones.map((m) => m.id))
    const gone = (existing ?? []).map((m) => m.id as string).filter((id) => !keep.has(id))
    if (gone.length) fail('save that goal', (await supabase.from('milestones').delete().in('id', gone)).error)
    if (milestones.length) fail('save that goal', (await supabase.from('milestones').upsert(milestones.map((m, i) => ({ ...m, sort_order: i, goal_id: g.id })))).error)
    fail('save that goal', (await supabase.from('goal_habits').delete().eq('goal_id', g.id)).error)
    if (habit_ids.length) fail('save that goal', (await supabase.from('goal_habits').insert(habit_ids.map((habit_id) => ({ goal_id: g.id, habit_id })))).error)
    return g
  },
  async deleteGoal(id) {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    fail('delete that goal', error)
  },
  async setMilestoneDone(id, done) {
    const { error } = await supabase.from('milestones').update({ done_at: done ? new Date().toISOString() : null }).eq('id', id)
    fail('save that milestone', error)
  },
  async setGoalCompleted(id, done) {
    const { error } = await supabase.from('goals').update({ completed_at: done ? new Date().toISOString() : null }).eq('id', id)
    fail('save that goal', error)
  },
  workoutLogs: supabaseCrud<WorkoutLog>('workout_logs', 'id,date,kind,title,version,plan_id,duration_min,distance_km,exercises,effort,notes', 'workouts', 'date'),
  templates: supabaseCrud<WorkoutTemplate>('workout_templates', 'id,title,kind,exercises,notes', 'templates'),
  pullups: supabaseCrud<PullupLog>('pullup_logs', 'id,date,variation,best_reps,sets,notes', 'pull-up logs', 'date'),
  races: supabaseCrud<Race>('races', 'id,name,date,division,result,notes', 'races', 'date'),
  closet: supabaseCrud<ClosetItem>('closet_items', 'id,name,category,color,seasons,occasions,photo_path,favorite,notes', 'clothes'),
  outfits: supabaseCrud<Outfit>('outfits', 'id,name,occasion,item_ids,favorite,notes', 'outfits'),
  async listOutfitDays(from, to) {
    const { data, error } = await supabase.from('outfit_days').select('id,date,outfit_id,worn').gte('date', from).lte('date', to)
    fail('load your outfit calendar', error)
    return (data ?? []) as OutfitDay[]
  },
  async setOutfitDay(date, outfitId) {
    if (!outfitId) {
      const { error } = await supabase.from('outfit_days').delete().eq('date', date)
      fail('clear that day', error)
      return null
    }
    const { data: u } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('outfit_days')
      .upsert({ user_id: u.user?.id, date, outfit_id: outfitId, worn: false }, { onConflict: 'user_id,date' })
      .select('id,date,outfit_id,worn')
      .single()
    fail('plan that outfit', error)
    return data as OutfitDay
  },
  async setWorn(id, worn) {
    const { error } = await supabase.from('outfit_days').update({ worn }).eq('id', id)
    fail('save that', error)
  },
  async uploadPhoto(itemId, blob) {
    const { data: u } = await supabase.auth.getUser()
    if (!u.user) throw new Error('Sign in again to add photos.')
    const path = `${u.user.id}/${itemId}-${Date.now().toString(36)}.jpg`
    const { error } = await supabase.storage.from('closet').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
    fail('upload that photo', error)
    return path
  },
  async photoUrls(paths) {
    if (!paths.length) return {}
    const { data, error } = await supabase.storage.from('closet').createSignedUrls(paths, 60 * 60 * 6)
    fail('load your photos', error)
    return Object.fromEntries((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl as string]))
  },
  async removePhoto(path) {
    const { error } = await supabase.storage.from('closet').remove([path])
    fail('remove that photo', error)
  },
  reviews: supabaseCrud<WeeklyReview>('weekly_reviews', 'id,week_start,went_well,proud,hard,change,next_priority', 'weekly reviews', 'week_start'),
  meals: supabaseCrud<Meal>('meals', 'id,name,kind,notes,is_backup,favorite', 'meals'),
  groceries: supabaseCrud<GroceryItem>('grocery_items', 'id,name,category,checked', 'grocery items'),
  async listMealPlan(from, to) {
    const { data, error } = await supabase.from('meal_plan').select('id,date,slot,meal_id,label,prepped').gte('date', from).lte('date', to)
    fail('load your meal plan', error)
    return (data ?? []) as MealPlanEntry[]
  },
  async setMealPlan(e) {
    if (!e.meal_id && !e.label) {
      const { error } = await supabase.from('meal_plan').delete().eq('date', e.date).eq('slot', e.slot)
      fail('clear that meal', error)
      return null
    }
    const { data: u } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('meal_plan')
      .upsert({ user_id: u.user?.id, ...e }, { onConflict: 'user_id,date,slot' })
      .select('id,date,slot,meal_id,label,prepped')
      .single()
    fail('plan that meal', error)
    return data as MealPlanEntry
  },
  async listHabitLogsBetween(from, to) {
    const { data, error } = await supabase.from('habit_logs').select('habit_id,date').gte('date', from).lte('date', to)
    fail('load your habits', error)
    return (data ?? []) as { habit_id: string; date: string }[]
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
  seasons?: Season[]
  goals?: Goal[]
  outfitDays?: OutfitDay[]
  photos?: Record<string, string>
  mealPlan?: MealPlanEntry[]
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
    demo.tasks = [...demo.tasks, t]
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
    return [...demo.xp]
  },
  async addXp(e) {
    if (demo.xp.some((x) => x.source_type === e.source_type && x.source_id === e.source_id && x.date === e.date)) return null
    const x = { id: uid(), ...e }
    demo.xp = [...demo.xp, x]
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
  async listSeasons() {
    return [...(demo.seasons ?? [])].sort((a, b) => b.start_date.localeCompare(a.start_date))
  },
  async saveSeason(se: Season) {
    demo.seasons = [...(demo.seasons ?? []).filter((x) => x.id !== se.id), se]
    save()
    return se
  },
  async deleteSeason(id: string) {
    demo.seasons = (demo.seasons ?? []).filter((x) => x.id !== id)
    demo.goals = (demo.goals ?? []).map((g) => (g.season_id === id ? { ...g, season_id: null } : g))
    save()
  },
  async listGoals() {
    return [...(demo.goals ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  },
  async saveGoal(g: Goal) {
    demo.goals = [...(demo.goals ?? []).filter((x) => x.id !== g.id), g]
    save()
    return g
  },
  async deleteGoal(id: string) {
    demo.goals = (demo.goals ?? []).filter((x) => x.id !== id)
    save()
  },
  async setMilestoneDone(id: string, done: boolean) {
    demo.goals = (demo.goals ?? []).map((g) => ({ ...g, milestones: g.milestones.map((m) => (m.id === id ? { ...m, done_at: done ? new Date().toISOString() : null } : m)) }))
    save()
  },
  async setGoalCompleted(id: string, done: boolean) {
    demo.goals = (demo.goals ?? []).map((g) => (g.id === id ? { ...g, completed_at: done ? new Date().toISOString() : null } : g))
    save()
  },
  workoutLogs: demoCrud<WorkoutLog>('workoutLogs', 'date'),
  templates: demoCrud<WorkoutTemplate>('templates', 'title'),
  pullups: demoCrud<PullupLog>('pullups', 'date'),
  races: demoCrud<Race>('races', 'date'),
  closet: demoCrud<ClosetItem>('closet', 'name'),
  outfits: demoCrud<Outfit>('outfits', 'name'),
  async listOutfitDays(from: string, to: string) {
    return (demo.outfitDays ?? []).filter((d) => d.date >= from && d.date <= to)
  },
  async setOutfitDay(date: string, outfitId: string | null) {
    const rest = (demo.outfitDays ?? []).filter((d) => d.date !== date)
    const row = outfitId ? { id: uid(), date, outfit_id: outfitId, worn: false } : null
    demo.outfitDays = row ? [...rest, row] : rest
    save()
    return row
  },
  async setWorn(id: string, worn: boolean) {
    demo.outfitDays = (demo.outfitDays ?? []).map((d) => (d.id === id ? { ...d, worn } : d))
    save()
  },
  async uploadPhoto(itemId: string, blob: Blob) {
    const { blobToDataUrl } = await import('./image')
    const path = `demo/${itemId}-${Date.now().toString(36)}.jpg`
    demo.photos = { ...(demo.photos ?? {}), [path]: await blobToDataUrl(blob) }
    save()
    return path
  },
  async photoUrls(paths: string[]) {
    return Object.fromEntries(paths.filter((p) => demo.photos?.[p]).map((p) => [p, demo.photos![p]]))
  },
  async removePhoto(path: string) {
    if (demo.photos) delete demo.photos[path]
    save()
  },
  reviews: demoCrud<WeeklyReview>('reviews', 'week_start'),
  meals: demoCrud<Meal>('meals', 'name'),
  groceries: demoCrud<GroceryItem>('groceries', 'name'),
  async listMealPlan(from: string, to: string) {
    return (demo.mealPlan ?? []).filter((m) => m.date >= from && m.date <= to)
  },
  async setMealPlan(e: Omit<MealPlanEntry, 'id'>) {
    const rest = (demo.mealPlan ?? []).filter((m) => !(m.date === e.date && m.slot === e.slot))
    const row = e.meal_id || e.label ? { id: uid(), ...e } : null
    demo.mealPlan = row ? [...rest, row] : rest
    save()
    return row
  },
  async listHabitLogsBetween(from: string, to: string) {
    return (demo.habitLogs ?? []).filter((l) => l.date >= from && l.date <= to)
  },
} satisfies Partial<Store>)

export const IS_DEMO = import.meta.env.VITE_DEMO === '1'
export const store: Store = IS_DEMO ? demoStore : supabaseStore
