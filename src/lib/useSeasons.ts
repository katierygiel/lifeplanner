import { useCallback, useEffect, useRef, useState } from 'react'
import { evaluate } from './achievements'
import { today } from './dates'
import { GOAL_XP, MILESTONE_XP } from './seasons'
import { store } from './store'
import type { Goal, Habit, Routine, Season, XpEvent } from './types'
import type { Celebration } from './useToday'
import { levelFromXp } from './xp'

type Earned = { achievement_key: string; earned_at: string }

export function useSeasons() {
  const date = today()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [xp, setXp] = useState<XpEvent[]>([])
  const [earned, setEarned] = useState<Earned[]>([])
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const xpRef = useRef<XpEvent[]>([])
  const report = (e: unknown) => setError((e as Error).message)

  const reload = useCallback(async () => {
    try {
      const [s, g, h, r, x, a] = await Promise.all([
        store.listSeasons(), store.listGoals(), store.listHabits(), store.listRoutines(), store.listXp(), store.listAchievements(),
      ])
      setSeasons(s)
      setGoals(g)
      setHabits(h)
      setRoutines(r)
      setXp(x)
      xpRef.current = x
      setEarned(a)
      setError(null)
    } catch (e) {
      report(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function earn(source_type: string, source_id: string, amount: number) {
    if (xpRef.current.some((e) => e.source_type === source_type && e.source_id === source_id)) return
    const before = levelFromXp(xpRef.current.reduce((s, e) => s + e.amount, 0)).level
    const saved = await store.addXp({ amount, source_type, source_id, date })
    if (!saved) return
    xpRef.current = [...xpRef.current, saved]
    setXp(xpRef.current)
    const queue: Celebration[] = []
    const after = levelFromXp(xpRef.current.reduce((s, e) => s + e.amount, 0)).level
    if (after > before) queue.push({ kind: 'level', key: `level-up-${after}`, level: after })
    const have = new Set(earned.map((e) => e.achievement_key))
    const fresh = evaluate(xpRef.current, routines, have, date)
    if (fresh.length) {
      await store.addAchievements(fresh)
      setEarned((x) => [...x, ...fresh.map((k) => ({ achievement_key: k, earned_at: new Date().toISOString() }))])
      queue.push(...fresh.map((key) => ({ kind: 'achievement' as const, key })))
    }
    if (queue.length) setCelebrations((c) => [...c, ...queue])
  }
  async function unearn(source_type: string, source_id: string) {
    xpRef.current = xpRef.current.filter((e) => !(e.source_type === source_type && e.source_id === source_id))
    setXp(xpRef.current)
    await store.removeXp(source_type, source_id)
  }

  async function run(fn: () => Promise<unknown>) {
    try {
      await fn()
      return true
    } catch (e) {
      report(e)
      reload()
      return false
    }
  }

  return {
    seasons, goals, habits, xp, earned, celebrations, loading, error, date,
    clearError: () => setError(null),
    dismissCelebration: () => setCelebrations((c) => c.slice(1)),
    saveSeason: (s: Season) =>
      run(async () => {
        const saved = await store.saveSeason(s)
        setSeasons((x) => [saved, ...x.filter((y) => y.id !== s.id)].sort((a, b) => b.start_date.localeCompare(a.start_date)))
      }),
    deleteSeason: (id: string) =>
      run(async () => {
        setSeasons((x) => x.filter((s) => s.id !== id))
        setGoals((g) => g.map((x) => (x.season_id === id ? { ...x, season_id: null } : x)))
        await store.deleteSeason(id)
      }),
    saveGoal: (g: Goal) =>
      run(async () => {
        await store.saveGoal(g)
        setGoals((x) => [...x.filter((y) => y.id !== g.id), g].sort((a, b) => a.sort_order - b.sort_order))
      }),
    deleteGoal: (id: string) =>
      run(async () => {
        setGoals((x) => x.filter((g) => g.id !== id))
        await store.deleteGoal(id)
      }),
    toggleMilestone: (goalId: string, milestoneId: string) =>
      run(async () => {
        const g = goals.find((x) => x.id === goalId)
        const m = g?.milestones.find((x) => x.id === milestoneId)
        if (!g || !m) return
        const done = !m.done_at
        setGoals((x) =>
          x.map((y) => (y.id === goalId ? { ...y, milestones: y.milestones.map((z) => (z.id === milestoneId ? { ...z, done_at: done ? new Date().toISOString() : null } : z)) } : y)),
        )
        await store.setMilestoneDone(milestoneId, done)
        if (done) await earn('milestone', milestoneId, MILESTONE_XP)
        else await unearn('milestone', milestoneId)
      }),
    toggleGoal: (goalId: string) =>
      run(async () => {
        const g = goals.find((x) => x.id === goalId)
        if (!g) return
        const done = !g.completed_at
        setGoals((x) => x.map((y) => (y.id === goalId ? { ...y, completed_at: done ? new Date().toISOString() : null } : y)))
        await store.setGoalCompleted(goalId, done)
        if (done) await earn('goal', goalId, GOAL_XP)
        else await unearn('goal', goalId)
      }),
    saveReflection: (s: Season, reflection: string) =>
      run(async () => {
        const saved = await store.saveSeason({ ...s, reflection })
        setSeasons((x) => x.map((y) => (y.id === s.id ? saved : y)))
        await earn('season', s.id, 30)
      }),
  }
}
