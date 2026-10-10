import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addDays } from './dates'
import { evaluate } from './achievements'
import { routineProgress } from './routines'
import { starterRoutines } from './starters'
import { store } from './store'
import { blocksOn } from './schedule'
import type {
  Checkin, DayMode, Goal, Habit, Season, HabitInput, Routine, RoutineLog, ScheduleBlock, Task, TaskInput, WorkoutInput, WorkoutPlan, XpEvent,
} from './types'
import { levelFromXp, TIER_XP } from './xp'

export type Celebration = { kind: 'level'; key: string; level: number } | { kind: 'achievement'; key: string }

export const WORKOUT_XP = { full: 30, short: 25, recovery: 20 } as const

const emptyCheckin = (date: string): Checkin => ({ date, energy: null, mood: null, motivation: null, soreness: null, day_mode: 'full' })

export function useToday(date: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [xp, setXpState] = useState<XpEvent[]>([])
  const [checkin, setCheckin] = useState<Checkin>(emptyCheckin(date))
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitDone, setHabitDone] = useState<string[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [routineLogs, setRoutineLogsState] = useState<RoutineLog[]>([])
  // Refs hold the latest values so quick taps never act on stale data.
  const logsRef = useRef<RoutineLog[]>([])
  const xpRef = useRef<XpEvent[]>([])
  const setRoutineLogs = (next: RoutineLog[] | ((l: RoutineLog[]) => RoutineLog[])) => {
    logsRef.current = typeof next === 'function' ? next(logsRef.current) : next
    setRoutineLogsState(logsRef.current)
  }
  const setXp = (next: XpEvent[] | ((x: XpEvent[]) => XpEvent[])) => {
    xpRef.current = typeof next === 'function' ? next(xpRef.current) : next
    setXpState(xpRef.current)
  }
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const earnedRef = useRef<Set<string> | null>(null)
  const levelRef = useRef<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const report = (e: unknown) => setError((e as Error).message)

  const reload = useCallback(async () => {
    try {
      const [t, x, c, h, hl, r, rl, b, w, ach, se, go] = await Promise.all([
        store.listTasks(date),
        store.listXp(),
        store.getCheckin(date),
        store.listHabits(),
        store.listHabitLogs(date),
        store.listRoutines(),
        store.listRoutineLogs(date),
        store.listBlocks(),
        store.listWorkouts(date, date),
        store.listAchievements().catch(() => []),
        store.listSeasons().catch(() => []),
        store.listGoals().catch(() => []),
      ])
      setSeasons(se)
      setGoals(go)
      earnedRef.current = new Set(ach.map((a) => a.achievement_key))
      setBlocks(blocksOn(b, date))
      setWorkout(w[0] ?? null)
      setTasks(t)
      setXp(x)
      setCheckin(c ?? emptyCheckin(date))
      setHabits(h)
      setHabitDone(hl)
      setRoutines(r)
      setRoutineLogs(rl)
      setError(null)
    } catch (e) {
      report(e)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    reload()
  }, [reload])

  // Celebrate new achievements and level-ups. Unchecking never takes an achievement away.
  useEffect(() => {
    if (loading || !earnedRef.current) return
    const real = xp.filter((e) => !e.id.startsWith('temp-'))
    const lvl = levelFromXp(real.reduce((s, e) => s + e.amount, 0)).level
    const queue: Celebration[] = []
    if (levelRef.current !== null && lvl > levelRef.current) queue.push({ kind: 'level', key: `level-up-${lvl}`, level: lvl })
    levelRef.current = Math.max(levelRef.current ?? 0, lvl)
    const fresh = evaluate(real, routines, earnedRef.current, date)
    if (fresh.length) {
      fresh.forEach((k) => earnedRef.current!.add(k))
      store.addAchievements(fresh).catch(report)
      queue.push(...fresh.map((key) => ({ kind: 'achievement' as const, key })))
    }
    if (queue.length) setCelebrations((c) => [...c, ...queue])
  }, [xp, loading, routines, date])

  const totalXp = useMemo(() => xp.reduce((s, e) => s + e.amount, 0), [xp])
  const todayXp = useMemo(() => xp.filter((e) => e.date === date).reduce((s, e) => s + e.amount, 0), [xp, date])
  const level = levelFromXp(totalXp)
  const mode = checkin.day_mode

  /* ----- XP helpers ----- */
  async function earn(source_type: string, source_id: string, amount: number) {
    const tempId = `temp-${source_type}-${source_id}`
    if (xpRef.current.some((e) => e.source_type === source_type && e.source_id === source_id && e.date === date)) return
    setXp((x) => [...x, { id: tempId, amount, source_type, source_id, date }])
    const saved = await store.addXp({ amount, source_type, source_id, date })
    setXp((x) => (saved ? x.map((e) => (e.id === tempId ? saved : e)) : x.filter((e) => e.id !== tempId)))
  }
  async function unearn(source_type: string, source_id: string, onlyToday: boolean) {
    setXp((x) => x.filter((e) => !(e.source_type === source_type && e.source_id === source_id && (!onlyToday || e.date === date))))
    await store.removeXp(source_type, source_id, onlyToday ? date : undefined)
  }

  /* ----- Tasks ----- */
  async function toggle(task: Task) {
    const done = task.status !== 'done'
    const patch: Partial<Task> = { status: done ? 'done' : 'open', completed_at: done ? new Date().toISOString() : null }
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, ...patch } : t)))
    try {
      await store.updateTask(task.id, patch)
      if (done) await earn('task', task.id, TIER_XP[task.tier])
      else await unearn('task', task.id, false)
    } catch (e) {
      report(e)
      reload()
    }
  }

  async function add(input: TaskInput) {
    try {
      if (input.is_priority) await clearPriority(input.planned_date)
      const t = await store.createTask(input)
      if (t.planned_date === date) setTasks((ts) => [...ts, t])
      return true
    } catch (e) {
      report(e)
      return false
    }
  }

  async function edit(id: string, patch: Partial<Task>) {
    try {
      if (patch.is_priority) await clearPriority(patch.planned_date ?? date, id)
      const t = await store.updateTask(id, patch)
      setTasks((ts) => (t.planned_date === date ? ts.map((x) => (x.id === id ? t : x)) : ts.filter((x) => x.id !== id)))
      return true
    } catch (e) {
      report(e)
      return false
    }
  }

  async function clearPriority(day: string | null, exceptId?: string) {
    if (day !== date) return
    const others = tasks.filter((t) => t.is_priority && t.id !== exceptId).map((t) => t.id)
    if (!others.length) return
    await store.updateTasks(others, { is_priority: false })
    setTasks((ts) => ts.map((t) => (others.includes(t.id) ? { ...t, is_priority: false } : t)))
  }

  async function remove(id: string) {
    const before = tasks
    setTasks((ts) => ts.filter((t) => t.id !== id))
    try {
      await store.deleteTask(id)
    } catch (e) {
      setTasks(before)
      report(e)
    }
  }

  async function moveToTomorrow(ids: string[]) {
    const before = tasks
    setTasks((ts) => ts.filter((t) => !ids.includes(t.id)))
    try {
      await store.updateTasks(ids, { planned_date: addDays(date, 1), is_priority: false })
    } catch (e) {
      setTasks(before)
      report(e)
    }
  }

  /* ----- Check-in ----- */
  async function saveCheckin(fields: Partial<Omit<Checkin, 'date'>>) {
    setCheckin((c) => ({ ...c, ...fields }))
    try {
      await store.saveCheckin(date, fields)
    } catch (e) {
      report(e)
    }
  }
  const setMode = (m: DayMode) => saveCheckin({ day_mode: m })

  /* ----- Habits ----- */
  async function toggleHabit(h: Habit) {
    const done = !habitDone.includes(h.id)
    setHabitDone((d) => (done ? [...d, h.id] : d.filter((x) => x !== h.id)))
    try {
      await store.setHabitDone(h.id, date, done)
      if (done) await earn('habit', h.id, h.xp)
      else await unearn('habit', h.id, true)
    } catch (e) {
      report(e)
      reload()
    }
  }
  async function saveHabit(id: string | null, h: HabitInput) {
    try {
      if (id) {
        const saved = await store.updateHabit(id, h)
        setHabits((hs) => hs.map((x) => (x.id === id ? saved : x)))
      } else {
        const saved = await store.createHabit({ ...h, sort_order: habits.length })
        setHabits((hs) => [...hs, saved])
      }
      return true
    } catch (e) {
      report(e)
      return false
    }
  }
  async function deleteHabit(id: string) {
    setHabits((hs) => hs.filter((h) => h.id !== id))
    try {
      await store.deleteHabit(id)
    } catch (e) {
      report(e)
      reload()
    }
  }

  /* ----- Routines ----- */
  async function toggleStep(r: Routine, stepId: string, version: 'full' | 'busy') {
    const prev = logsRef.current.find((l) => l.routine_id === r.id)
    const steps = new Set(prev?.completed_steps ?? [])
    if (steps.has(stepId)) steps.delete(stepId)
    else steps.add(stepId)
    const draft: RoutineLog = { routine_id: r.id, date, version, completed_steps: [...steps], completed: false }
    draft.completed = routineProgress(r, draft, version).complete
    setRoutineLogs((ls) => [...ls.filter((l) => l.routine_id !== r.id), draft])
    try {
      await store.saveRoutineLog(draft)
      if (draft.completed && !prev?.completed) await earn('routine', r.id, r.xp)
      if (!draft.completed && prev?.completed) await unearn('routine', r.id, true)
    } catch (e) {
      report(e)
      reload()
    }
  }
  async function saveRoutine(r: Routine) {
    try {
      const saved = await store.saveRoutine(r)
      setRoutines((rs) => [...rs.filter((x) => x.id !== r.id), saved].sort((a, b) => a.sort_order - b.sort_order))
      return true
    } catch (e) {
      report(e)
      return false
    }
  }
  async function deleteRoutine(id: string) {
    setRoutines((rs) => rs.filter((r) => r.id !== id))
    try {
      await store.deleteRoutine(id)
    } catch (e) {
      report(e)
      reload()
    }
  }
  /* ----- Workout ----- */
  async function completeWorkout(version: 'full' | 'short' | 'recovery') {
    if (!workout) return
    const already = workout.completed_at && workout.chosen === version
    const next: WorkoutPlan = already ? { ...workout, chosen: version, completed_at: null } : { ...workout, chosen: version, completed_at: new Date().toISOString() }
    setWorkout(next)
    try {
      await store.saveWorkout(next)
      await unearn('workout', workout.id, true)
      if (!already) await earn('workout', workout.id, WORKOUT_XP[version])
    } catch (e) {
      report(e)
      reload()
    }
  }
  async function saveWorkout(w: WorkoutInput & { id?: string }) {
    try {
      const saved = await store.saveWorkout(w)
      if (saved.date === date) setWorkout(saved)
      return true
    } catch (e) {
      report(e)
      return false
    }
  }
  async function deleteWorkout(id: string) {
    setWorkout(null)
    try {
      await store.deleteWorkout(id)
    } catch (e) {
      report(e)
      reload()
    }
  }

  async function addStarterRoutines() {
    try {
      const starters = starterRoutines().map((r, i) => ({ ...r, sort_order: routines.length + i }))
      for (const r of starters) await store.saveRoutine(r)
      setRoutines((rs) => [...rs, ...starters])
    } catch (e) {
      report(e)
      reload()
    }
  }

  return {
    tasks, mode, checkin, habits, habitDone, routines, routineLogs, loading, error, level, totalXp, todayXp,
    toggle, add, edit, remove, moveToTomorrow, setMode, saveCheckin,
    toggleHabit, saveHabit, deleteHabit,
    toggleStep, saveRoutine, deleteRoutine, addStarterRoutines,
    seasons, goals,
    blocks, workout, completeWorkout, saveWorkout, deleteWorkout,
    celebrations,
    reload,
    xpEvents: xp,
    dismissCelebration: () => setCelebrations((c) => c.slice(1)),
    clearError: () => setError(null),
  }
}
