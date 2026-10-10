import { AnimatePresence, motion } from 'framer-motion'
import { Check, Lightbulb, Utensils, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { addDays } from '../lib/dates'
import { reviewWeekStart } from '../lib/review'
import { store } from '../lib/store'
import { suggest, type Suggestion, type SuggestionAction } from '../lib/suggestions'
import type { Meal, MealPlanEntry, WorkoutPlan } from '../lib/types'
import { mondayOf } from '../lib/useWeek'
import { Card, Eyebrow, cx } from './ui'

const dismissKey = (d: string) => `levelup-dismissed-${d}`
function readDismissed(d: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(dismissKey(d)) ?? '[]')
  } catch {
    return []
  }
}
function writeDismissed(d: string, ids: string[]) {
  try {
    localStorage.setItem(dismissKey(d), JSON.stringify(ids))
  } catch {
    /* storage unavailable */
  }
}

// Gentle, rule-based nudges. Nothing changes until she taps an action.
export function Suggestions({ date, onEditHabit, onGo, onChanged }: {
  date: string
  onEditHabit: (habitId: string) => void
  onGo: (to: 'closet' | 'reset' | 'meals' | 'week') => void
  onChanged: () => void
}) {
  const [items, setItems] = useState<Suggestion[]>([])
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([])
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed(date))

  const load = useCallback(async () => {
    const nextMon = addDays(mondayOf(date), 7)
    const safe = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback)
    const [blocks, ws, habits, logs, outfits, days, reviews] = await Promise.all([
      safe(store.listBlocks(), []),
      safe(store.listWorkouts(addDays(date, -1), addDays(date, 6)), []),
      safe(store.listHabits(), []),
      safe(store.listHabitLogsBetween(addDays(date, -14), addDays(date, -1)), []),
      safe(store.outfits.list(), []),
      safe(store.listOutfitDays(nextMon, addDays(nextMon, 6)), []),
      safe(store.reviews.list(), []),
    ])
    setWorkouts(ws)
    setItems(
      suggest({
        today: date, blocks, workouts: ws, habits, habitLogs: logs, outfitsSaved: outfits.length, outfitDaysNextWeek: days.length,
        reviewedThisWeek: reviews.some((r) => r.week_start === reviewWeekStart(date)),
      }),
    )
  }, [date])

  useEffect(() => {
    load()
  }, [load])

  const dismiss = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    writeDismissed(date, next)
  }

  const act = async (s: Suggestion, a: SuggestionAction) => {
    if (a.kind === 'move-workout') {
      const w = workouts.find((x) => x.id === a.workoutId)
      if (w) await store.saveWorkout({ ...w, date: a.to }).catch(() => {})
    } else if (a.kind === 'shorten-week') {
      for (const id of a.workoutIds) {
        const w = workouts.find((x) => x.id === id)
        if (w) await store.saveWorkout({ ...w, chosen: 'short' }).catch(() => {})
      }
    } else if (a.kind === 'edit-habit') {
      onEditHabit(a.habitId)
    } else if (a.kind === 'go') {
      onGo(a.to)
    }
    dismiss(s.id)
    if (a.kind === 'move-workout' || a.kind === 'shorten-week') {
      onChanged()
      load()
    }
  }

  const shown = items.filter((s) => !dismissed.includes(s.id)).slice(0, 2)
  return (
    <AnimatePresence initial={false}>
      {shown.map((s) => (
        <motion.div key={s.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <Card tone="lemon" className="flex items-start gap-3">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-lemon-ink" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">{s.text}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {s.actions.map((a) => (
                  <button key={a.label} onClick={() => act(s, a)} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-ink shadow-soft">
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <button aria-label="Dismiss" onClick={() => dismiss(s.id)} className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lemon-ink">
              <X size={16} />
            </button>
          </Card>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

// Today's lunch and dinner from the meal plan, with a quick "packed" check.
export function TodayMeals({ date, onOpen }: { date: string; onOpen: () => void }) {
  const [plan, setPlan] = useState<MealPlanEntry[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([store.listMealPlan(date, date), store.meals.list()])
      .then(([p, m]) => {
        setPlan(p)
        setMeals(m)
        setReady(true)
      })
      .catch(() => setReady(false))
  }, [date])

  if (!ready) return null
  const name = (e?: MealPlanEntry) => (e ? meals.find((m) => m.id === e.meal_id)?.name ?? e.label ?? '' : '')
  const lunch = plan.find((p) => p.slot === 'lunch')
  const dinner = plan.find((p) => p.slot === 'dinner')
  const togglePacked = async () => {
    if (!lunch) return
    const next = { ...lunch, prepped: !lunch.prepped }
    setPlan((p) => p.map((x) => (x.id === lunch.id ? next : x)))
    await store.setMealPlan({ date, slot: 'lunch', meal_id: lunch.meal_id, label: lunch.label, prepped: next.prepped }).catch(() => {})
  }

  return (
    <Card className="flex items-center gap-3">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lemon-soft">
          <Utensils size={18} className="text-lemon-ink" />
        </span>
        <span className="min-w-0">
          <Eyebrow>Meals today</Eyebrow>
          {lunch || dinner ? (
            <span className="block truncate text-[14px] font-semibold">
              {lunch ? `Lunch: ${name(lunch)}` : ''}
              {lunch && dinner ? ' · ' : ''}
              {dinner ? `Dinner: ${name(dinner)}` : ''}
            </span>
          ) : (
            <span className="block text-[13px] text-ink-soft">Nothing planned. Tap to plan lunches.</span>
          )}
        </span>
      </button>
      {lunch && (
        <button onClick={togglePacked} aria-pressed={lunch.prepped} className={cx('flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12px] font-bold', lunch.prepped ? 'bg-lemon text-lemon-ink' : 'bg-canvas text-ink-soft')}>
          {lunch.prepped && <Check size={13} strokeWidth={3} />} {lunch.prepped ? 'Packed' : 'Packed?'}
        </button>
      )}
    </Card>
  )
}
