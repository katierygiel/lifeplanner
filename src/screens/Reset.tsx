import { ArrowLeft, CalendarDays, Check, ChevronRight, Dumbbell, Shirt, Utensils } from 'lucide-react'
import { useEffect, useState } from 'react'
import Celebration from '../components/Celebration'
import { Button, Card, Eyebrow, SectionTitle, cx } from '../components/ui'
import { evaluate } from '../lib/achievements'
import { addDays, fromDay, today } from '../lib/dates'
import { REVIEW_QUESTIONS, REVIEW_XP, reviewWeekStart, weekSummary } from '../lib/review'
import { newId, store } from '../lib/store'
import type { WeeklyReview, XpEvent } from '../lib/types'
import type { Celebration as C } from '../lib/useToday'

type Go = (r: 'week' | 'closet' | 'meals' | 'home') => void
const range = (start: string) =>
  `${fromDay(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${fromDay(addDays(start, 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

export default function Reset({ go }: { go: Go }) {
  const t0 = today()
  const weekStart = reviewWeekStart(t0)
  const nextMonday = addDays(weekStart, 7)
  const [xp, setXp] = useState<XpEvent[]>([])
  const [reviews, setReviews] = useState<WeeklyReview[]>([])
  const [form, setForm] = useState<Record<string, string>>({})
  const [addPriority, setAddPriority] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState<C[]>([])

  useEffect(() => {
    Promise.all([store.listXp(), store.reviews.list()])
      .then(([x, r]) => {
        setXp(x)
        setReviews(r)
        const existing = r.find((v) => v.week_start === weekStart)
        if (existing) {
          setForm(Object.fromEntries(REVIEW_QUESTIONS.map((q) => [q.key, existing[q.key] ?? ''])))
          setSaved(true)
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [weekStart])

  const s = weekSummary(xp, weekStart)
  const existing = reviews.find((v) => v.week_start === weekStart)
  const past = reviews.filter((v) => v.week_start !== weekStart).slice(0, 6)

  const save = async () => {
    if (!REVIEW_QUESTIONS.some((q) => form[q.key]?.trim())) return setError('Answer at least one question.')
    setSaving(true)
    setError(null)
    try {
      const review: WeeklyReview = {
        id: existing?.id ?? newId(),
        week_start: weekStart,
        went_well: form.went_well?.trim() || null,
        proud: form.proud?.trim() || null,
        hard: form.hard?.trim() || null,
        change: form.change?.trim() || null,
        next_priority: form.next_priority?.trim() || null,
      }
      const row = await store.reviews.save(review)
      setReviews((r) => [row, ...r.filter((x) => x.id !== row.id)])
      if (addPriority && review.next_priority && !existing?.next_priority) {
        await store.createTask({ title: review.next_priority, tier: 'must', duration_min: null, planned_date: nextMonday > t0 ? nextMonday : t0, is_priority: true })
      }
      const earned = await store.addXp({ amount: REVIEW_XP, source_type: 'review', source_id: row.id, date: t0 })
      if (earned) {
        const all = [...xp, earned]
        setXp(all)
        const have = new Set((await store.listAchievements()).map((a) => a.achievement_key))
        const fresh = evaluate(all, [], have, t0)
        if (fresh.length) {
          await store.addAchievements(fresh)
          setCelebrate(fresh.map((key) => ({ kind: 'achievement' as const, key })))
        }
      }
      setSaved(true)
    } catch (e) {
      setError((e as Error).message)
    }
    setSaving(false)
  }

  const plan = [
    { icon: CalendarDays, label: "Check next week's work hours and plans", to: 'week' as const },
    { icon: Dumbbell, label: 'Plan or import next week’s workouts', to: 'week' as const },
    { icon: Shirt, label: 'Plan outfits for the week', to: 'closet' as const },
    { icon: Utensils, label: 'Plan lunches and the grocery list', to: 'meals' as const },
  ]

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2 px-1 pt-2">
        <button onClick={() => go('home')} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="text-[13px] font-semibold text-ink-soft">{range(weekStart)}</div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Weekly reset</h1>
        </div>
      </header>

      {error && (
        <Card tone="lilac">
          <p className="text-[13px] font-semibold">
            {error}
            {/relation|does not exist|schema cache/i.test(error) ? ' Run the Phase 4 setup file in Supabase to turn on weekly reviews.' : ''}
          </p>
        </Card>
      )}

      <SectionTitle title="1. Look back" />
      <Card tone="peri">
        <p className="text-[15px] font-bold">{loading ? ' ' : s.activeDays ? `You showed up ${s.activeDays} ${s.activeDays === 1 ? 'day' : 'days'} this week.` : 'A quiet week. That happens, and a fresh one is about to start.'}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Mini v={s.xp} l="XP" />
          <Mini v={s.workouts} l={s.lighterWorkouts ? `workouts (${s.lighterWorkouts} lighter)` : 'workouts'} />
          <Mini v={s.routines} l="routines" />
          <Mini v={s.habits} l="habits" />
          <Mini v={s.tasks} l="tasks" />
          <Mini v={s.milestones} l="milestones" />
        </div>
      </Card>

      <SectionTitle title="2. Reflect" />
      <Card className="space-y-4">
        {REVIEW_QUESTIONS.map((q) => (
          <label key={q.key} className="block">
            <span className="text-[14px] font-bold">{q.label}</span>
            <textarea
              id={`review-${q.key}`}
              value={form[q.key] ?? ''}
              onChange={(e) => {
                setForm((f) => ({ ...f, [q.key]: e.target.value }))
                setSaved(false)
              }}
              rows={2}
              placeholder={q.placeholder}
              className="mt-1.5 w-full rounded-2xl bg-canvas p-3 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
            />
          </label>
        ))}
        {!existing?.next_priority && (
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input id="review-add-priority" type="checkbox" checked={addPriority} onChange={(e) => setAddPriority(e.target.checked)} className="h-5 w-5 accent-[#7484F2]" />
            Make it Monday's priority on Home
          </label>
        )}
        <Button variant="primary" className="w-full" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : saved ? (
            <>
              <Check size={18} /> Saved
            </>
          ) : existing ? 'Update reflection' : `Save reflection · +${REVIEW_XP} XP`}
        </Button>
      </Card>

      <SectionTitle title="3. Set up next week" />
      <Card className="px-2 py-2">
        {plan.map(({ icon: Icon, label, to }) => (
          <button key={label} onClick={() => go(to)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-canvas">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lilac-wash">
              <Icon size={17} />
            </span>
            <span className="flex-1 text-[14px] font-semibold">{label}</span>
            <ChevronRight size={18} className="text-ink-faint" />
          </button>
        ))}
      </Card>

      {past.length > 0 && (
        <>
          <SectionTitle title="Past weeks" />
          <div className="space-y-2">
            {past.map((r) => (
              <Card key={r.id}>
                <Eyebrow>{range(r.week_start)}</Eyebrow>
                {r.went_well && <p className="mt-1.5 text-[13px]"><b>Went well:</b> {r.went_well}</p>}
                {r.change && <p className="mt-1 text-[13px]"><b>Change:</b> {r.change}</p>}
                {r.next_priority && <p className="mt-1 text-[13px]"><b>Priority:</b> {r.next_priority}</p>}
              </Card>
            ))}
          </div>
        </>
      )}
      <div className="h-6" />
      <Celebration item={celebrate[0]} remaining={celebrate.length} onDone={() => setCelebrate((c) => c.slice(1))} />
    </div>
  )
}

function Mini({ v, l }: { v: number; l: string }) {
  return (
    <div className={cx('rounded-2xl bg-white/80 px-3 py-2')}>
      <div className="text-[20px] font-extrabold tabular-nums leading-none">{v}</div>
      <div className="mt-1 text-[11px] font-semibold leading-tight text-ink-soft">{l}</div>
    </div>
  )
}
