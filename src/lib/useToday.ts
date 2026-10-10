import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays } from './dates'
import { store } from './store'
import type { DayMode, Task, TaskInput, XpEvent } from './types'
import { levelFromXp, TIER_XP } from './xp'

export function useToday(date: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [xp, setXp] = useState<XpEvent[]>([])
  const [mode, setModeState] = useState<DayMode>('full')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const report = (e: unknown) => setError((e as Error).message)

  const reload = useCallback(async () => {
    try {
      const [t, x, m] = await Promise.all([store.listTasks(date), store.listXp(), store.getDayMode(date)])
      setTasks(t)
      setXp(x)
      setModeState(m ?? 'full')
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

  const totalXp = useMemo(() => xp.reduce((s, e) => s + e.amount, 0), [xp])
  const todayXp = useMemo(() => xp.filter((e) => e.date === date).reduce((s, e) => s + e.amount, 0), [xp, date])
  const level = levelFromXp(totalXp)

  async function toggle(task: Task) {
    const done = task.status !== 'done'
    const patch: Partial<Task> = { status: done ? 'done' : 'open', completed_at: done ? new Date().toISOString() : null }
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, ...patch } : t)))
    const tempId = `temp-${task.id}`
    if (done) setXp((x) => [...x, { id: tempId, amount: TIER_XP[task.tier], source_type: 'task', source_id: task.id, date }])
    else setXp((x) => x.filter((e) => !(e.source_type === 'task' && e.source_id === task.id)))
    try {
      await store.updateTask(task.id, patch)
      if (done) {
        const saved = await store.addXp({ amount: TIER_XP[task.tier], source_type: 'task', source_id: task.id, date })
        setXp((x) => (saved ? x.map((e) => (e.id === tempId ? saved : e)) : x.filter((e) => e.id !== tempId)))
      } else {
        await store.removeXp('task', task.id)
      }
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

  async function setMode(m: DayMode) {
    setModeState(m)
    try {
      await store.setDayMode(date, m)
    } catch (e) {
      report(e)
    }
  }

  return {
    tasks, mode, loading, error, level, totalXp, todayXp,
    toggle, add, edit, remove, moveToTomorrow, setMode, clearError: () => setError(null),
  }
}
