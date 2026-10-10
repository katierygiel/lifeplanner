import { Award, Lock, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Card, Eyebrow, SectionTitle, XPBar, cx } from '../components/ui'
import { ACHIEVEMENTS, activeDays, defFor, weekDots } from '../lib/achievements'
import { addDays, fromDay, today } from '../lib/dates'
import { store } from '../lib/store'
import type { XpEvent } from '../lib/types'
import { mondayOf } from '../lib/useWeek'
import { levelFromXp } from '../lib/xp'

type Earned = { achievement_key: string; earned_at: string }

export default function Goals() {
  const t0 = today()
  const [xp, setXp] = useState<XpEvent[]>([])
  const [earned, setEarned] = useState<Earned[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([store.listXp(), store.listAchievements()])
      .then(([x, a]) => {
        setXp(x)
        setEarned(a)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const level = levelFromXp(xp.reduce((s, e) => s + e.amount, 0))
  const weekStart = mondayOf(t0)
  const lastWeekStart = addDays(weekStart, -7)
  const summary = useMemo(() => {
    const inRange = (from: string, to: string) => xp.filter((e) => e.date >= from && e.date <= to)
    const make = (evs: XpEvent[]) => ({
      xp: evs.reduce((s, e) => s + e.amount, 0),
      days: new Set(evs.map((e) => e.date)).size,
      workouts: evs.filter((e) => e.source_type === 'workout').length,
      shortOrRecovery: evs.filter((e) => e.source_type === 'workout' && e.amount < 30).length,
      routines: evs.filter((e) => e.source_type === 'routine').length,
      habits: evs.filter((e) => e.source_type === 'habit').length,
      tasks: evs.filter((e) => e.source_type === 'task').length,
    })
    return { now: make(inRange(weekStart, addDays(weekStart, 6))), last: make(inRange(lastWeekStart, addDays(lastWeekStart, 6))) }
  }, [xp, weekStart, lastWeekStart])
  const dots = weekDots(xp, t0)
  const totalActive = activeDays(xp).length
  const earnedKeys = new Set(earned.map((e) => e.achievement_key))
  const comebacks = earned.filter((e) => e.achievement_key.startsWith('comeback-')).length

  return (
    <div className="space-y-3">
      <header className="px-1 pb-2 pt-2">
        <div className="text-[13px] font-semibold text-ink-soft">Seasons, goals, and wins</div>
        <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">My Goals</h1>
      </header>

      {error && (
        <Card tone="lilac">
          <p className="text-[13px] font-semibold">{error}</p>
        </Card>
      )}

      <Card tone="lilac">
        <XPBar level={level.level} into={level.into} needed={level.needed} />
        <p className="mt-3 text-[12px] font-semibold text-ink-soft">
          {loading ? ' ' : `${totalActive} active ${totalActive === 1 ? 'day' : 'days'} so far · ${level.needed - level.into} XP to level ${level.level + 1}`}
        </p>
      </Card>

      <SectionTitle title="This week" />
      <Card>
        <Eyebrow>Last 7 days</Eyebrow>
        <div className="mt-2 flex items-end justify-between gap-2">
          {dots.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className={cx('h-9 w-full max-w-[38px] rounded-xl', d.active ? 'bg-lemon-deep' : 'bg-canvas')} />
              <span className={cx('text-[11px] font-bold', d.date === t0 ? 'text-peri-deep' : 'text-ink-faint')}>
                {fromDay(d.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-ink-soft">
          Lemon days are days you showed up. Rest days count too when you check off recovery.
        </p>
        <div className="mt-5">
          <Eyebrow>Monday to today</Eyebrow>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat label="XP this week" value={summary.now.xp} prev={summary.last.xp} />
          <Stat label="Active days" value={summary.now.days} prev={summary.last.days} />
          <Stat label="Workouts" value={summary.now.workouts} prev={summary.last.workouts} note={summary.now.shortOrRecovery ? `${summary.now.shortOrRecovery} short or recovery` : undefined} />
          <Stat label="Routines finished" value={summary.now.routines} prev={summary.last.routines} />
          <Stat label="Habits" value={summary.now.habits} prev={summary.last.habits} />
          <Stat label="Tasks done" value={summary.now.tasks} prev={summary.last.tasks} />
        </div>
      </Card>

      <SectionTitle title="Achievements" action={<span className="text-[12px] font-semibold text-ink-faint">{ACHIEVEMENTS.filter((a) => (a.repeatable ? comebacks > 0 : earnedKeys.has(a.key))).length} of {ACHIEVEMENTS.length}</span>} />
      <div className="grid grid-cols-2 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = a.repeatable ? comebacks > 0 : earnedKeys.has(a.key)
          const when = earned.find((e) => (a.repeatable ? e.achievement_key.startsWith(a.key + '-') : e.achievement_key === a.key))
          return (
            <div key={a.key} className={cx('rounded-card p-3.5', got ? 'bg-lemon-soft' : 'bg-white shadow-soft')}>
              <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl', got ? 'bg-lemon' : 'bg-canvas')}>
                {got ? <Award size={18} className="text-lemon-ink" /> : <Lock size={15} className="text-ink-faint" />}
              </span>
              <p className={cx('mt-2 text-[13px] font-bold leading-tight', !got && 'text-ink-soft')}>
                {a.title}
                {a.repeatable && comebacks > 1 ? ` ×${comebacks}` : ''}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-faint">
                {got && when ? new Date(when.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : a.hint}
              </p>
            </div>
          )
        })}
      </div>

      <SectionTitle title="Seasons" />
      <Card className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lilac">
          <Sparkles size={18} />
        </span>
        <span>
          <Eyebrow>Next up</Eyebrow>
          <span className="block text-[13px] text-ink-soft">Seasons and goals arrive in stage 10, like a Fall Reset with milestones.</span>
        </span>
      </Card>
      <div className="h-6" />
      {earned.length > 0 && <span className="sr-only">{earned.map((e) => defFor(e.achievement_key)?.title).join(', ')}</span>}
    </div>
  )
}

function Stat({ label, value, prev, note }: { label: string; value: number; prev: number; note?: string }) {
  const diff = value - prev
  return (
    <div className="rounded-2xl bg-canvas px-3 py-2.5">
      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft">{label}</div>
      <div className="mt-0.5 text-[22px] font-extrabold tabular-nums">{value}</div>
      <div className="text-[11px] text-ink-faint">{note ?? (prev || value ? (diff > 0 ? `+${diff} vs last week` : `Last week: ${prev}`) : 'Last week: 0')}</div>
    </div>
  )
}
