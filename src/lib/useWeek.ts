import { useCallback, useEffect, useState } from 'react'
import { addDays, fromDay, today } from './dates'
import { store } from './store'
import type { BlockInput, ScheduleBlock, Task, TaskInput, WorkoutInput, WorkoutPlan } from './types'

export const mondayOf = (date: string) => addDays(date, -((fromDay(date).getDay() + 6) % 7))

export function useWeek(weekStart: string) {
  const weekEnd = addDays(weekStart, 6)
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const report = (e: unknown) => setError((e as Error).message)

  const reload = useCallback(async () => {
    try {
      const [b, t, w] = await Promise.all([store.listBlocks(), store.listTasksBetween(weekStart, weekEnd), store.listWorkouts(weekStart, weekEnd)])
      setBlocks(b)
      setTasks(t)
      setWorkouts(w)
      setError(null)
    } catch (e) {
      report(e)
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd])

  useEffect(() => {
    reload()
  }, [reload])

  async function run<T>(fn: () => Promise<T>) {
    try {
      return await fn()
    } catch (e) {
      report(e)
      return null
    }
  }

  return {
    blocks, tasks, workouts, loading, error, weekStart, weekEnd, reload,
    clearError: () => setError(null),
    async addBlocks(bs: BlockInput[]) {
      const made = await run(() => store.createBlocks(bs))
      if (made) setBlocks((x) => [...x, ...made])
      return !!made
    },
    async updateBlock(id: string, patch: Partial<BlockInput>) {
      const saved = await run(() => store.updateBlock(id, patch))
      if (saved) setBlocks((x) => x.map((b) => (b.id === id ? saved : b)))
      return !!saved
    },
    async deleteBlock(id: string) {
      setBlocks((x) => x.filter((b) => b.id !== id))
      await run(() => store.deleteBlock(id))
    },
    async skipDay(block: ScheduleBlock, date: string) {
      const skipped = [...new Set([...block.skipped_dates, date])]
      const saved = await run(() => store.updateBlock(block.id, { skipped_dates: skipped }))
      if (saved) setBlocks((x) => x.map((b) => (b.id === block.id ? saved : b)))
    },
    async addTask(input: TaskInput) {
      const t = await run(() => store.createTask(input))
      if (t && t.planned_date && t.planned_date >= weekStart && t.planned_date <= weekEnd) setTasks((x) => [...x, t])
      return !!t
    },
    async editTask(id: string, patch: Partial<Task>) {
      const t = await run(() => store.updateTask(id, patch))
      if (t) setTasks((x) => (t.planned_date && t.planned_date >= weekStart && t.planned_date <= weekEnd ? x.map((y) => (y.id === id ? t : y)) : x.filter((y) => y.id !== id)))
      return !!t
    },
    async deleteTask(id: string) {
      setTasks((x) => x.filter((t) => t.id !== id))
      await run(() => store.deleteTask(id))
    },
    async saveWorkout(w: WorkoutInput & { id?: string }) {
      const saved = await run(() => store.saveWorkout(w))
      if (saved) setWorkouts((x) => [...x.filter((y) => y.id !== saved.id), saved])
      return !!saved
    },
    async deleteWorkout(id: string) {
      setWorkouts((x) => x.filter((w) => w.id !== id))
      await run(() => store.deleteWorkout(id))
    },
    // Replaces the repeating work hours from today on; past weeks keep their old hours.
    async saveBaseWeek(next: BlockInput[]) {
      const t = today()
      const old = blocks.filter((b) => b.weekday != null && b.kind === 'work' && (!b.repeat_until || b.repeat_until >= t))
      const ok = await run(async () => {
        for (const b of old) {
          if (b.repeat_from && b.repeat_from >= t) await store.deleteBlock(b.id)
          else await store.updateBlock(b.id, { repeat_until: addDays(t, -1) })
        }
        if (next.length) await store.createBlocks(next)
        return true
      })
      await reload()
      return !!ok
    },
    async importWorkouts(ws: WorkoutInput[]) {
      const ok = await run(() => store.replaceWorkouts(ws))
      await reload()
      return ok !== null
    },
  }
}
