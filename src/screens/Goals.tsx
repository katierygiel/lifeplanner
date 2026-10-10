import { AnimatePresence, motion } from 'framer-motion'
import { Award, Check, ChevronDown, Flag, Lock, Pencil, Plus, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import Celebration from '../components/Celebration'
import { GoalSheet, SeasonSheet } from '../components/SeasonSheets'
import { Button, Card, Eyebrow, ProgressRing, SectionTitle, XPBar, cx } from '../components/ui'
import { ACHIEVEMENTS, activeDays, weekDots } from '../lib/achievements'
import { addDays, fromDay } from '../lib/dates'
import { goalProgress, seasonProgress, seasonStatus, seasonTime, THEMES } from '../lib/seasons'
import type { Goal, Habit, Season, XpEvent } from '../lib/types'
import { useSeasons } from '../lib/useSeasons'
import { mondayOf } from '../lib/useWeek'
import { levelFromXp } from '../lib/xp'

const fmt = (d: string) => fromDay(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function Goals() {
  const g = useSeasons()
  const t0 = g.date
  const [seasonSheet, setSeasonSheet] = useState<{ open: boolean; season: Season | null }>({ open: false, season: null })
  const [goalSheet, setGoalSheet] = useState<{ open: boolean; goal: Goal | null; seasonId: string | null }>({ open: false, goal: null, seasonId: null })

  const active = g.seasons.find((s) => seasonStatus(s, t0) === 'active')
  const upcoming = g.seasons.filter((s) => seasonStatus(s, t0) === 'upcoming')
  const ended = g.seasons.filter((s) => seasonStatus(s, t0) === 'ended')
  const toReview = ended.find((s) => !s.reflection)
  const looseGoals = g.goals.filter((x) => !x.season_id)

  return (
    <div className="space-y-3">
      <header className="flex items-end justify-between px-1 pb-2 pt-2">
        <div>
          <div className="text-[13px] font-semibold text-ink-soft">Seasons, goals, and wins</div>
          <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">My Goals</h1>
        </div>
        {g.seasons.length > 0 && (
          <button onClick={() => setSeasonSheet({ open: true, season: null })} className="flex h-10 items-center gap-1 rounded-full bg-white px-3 text-[13px] font-bold text-peri-deep shadow-soft">
            <Plus size={16} /> Season
          </button>
        )}
      </header>

      {g.error && (
        <Card tone="lilac" className="flex items-start gap-3">
          <p className="flex-1 text-[13px] font-semibold">{g.error}</p>
          <button onClick={g.clearError} className="text-[13px] font-bold text-peri-deep">OK</button>
        </Card>
      )}

      {toReview && <ReviewCard season={toReview} onSave={(text) => g.saveReflection(toReview, text)} onNew={() => setSeasonSheet({ open: true, season: null })} />}

      {/* Active season */}
      {!g.loading && !active && !toReview && (
        <Card tone="lilac">
          <Eyebrow>Seasons</Eyebrow>
          <p className="mt-1 text-[17px] font-bold">Start a season</p>
          <p className="mt-1 text-[13px] text-ink-soft">
            A season is a stretch of a few weeks with a handful of goals, like a Fall Reset. Small daily actions add up to it.
          </p>
          <Button variant="primary" className="mt-3" onClick={() => setSeasonSheet({ open: true, season: null })}>
            <Sparkles size={17} /> Start a season
          </Button>
        </Card>
      )}

      {active && (
        <SeasonBlock
          season={active}
          goals={g.goals.filter((x) => x.season_id === active.id)}
          habits={g.habits}
          today={t0}
          onEdit={() => setSeasonSheet({ open: true, season: active })}
          onAddGoal={() => setGoalSheet({ open: true, goal: null, seasonId: active.id })}
          onEditGoal={(goal) => setGoalSheet({ open: true, goal, seasonId: active.id })}
          onToggleMilestone={g.toggleMilestone}
          onToggleGoal={g.toggleGoal}
        />
      )}

      {upcoming.map((s) => (
        <button key={s.id} onClick={() => setSeasonSheet({ open: true, season: s })} className={cx('flex w-full items-center gap-3 rounded-card p-4 text-left', THEMES[s.theme ?? 'peri'].bg)}>
          <Flag size={18} className="shrink-0 text-ink-soft" />
          <span className="flex-1">
            <span className="block text-[15px] font-bold">{s.name}</span>
            <span className="block text-[12px] text-ink-soft">Starts {fmt(s.start_date)}</span>
          </span>
        </button>
      ))}

      {looseGoals.length > 0 && (
        <>
          <SectionTitle title="Other goals" />
          <div className="space-y-2">
            {looseGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} habits={g.habits} onEdit={() => setGoalSheet({ open: true, goal, seasonId: null })} onToggleMilestone={g.toggleMilestone} onToggleGoal={g.toggleGoal} />
            ))}
          </div>
        </>
      )}

      <Progress xp={g.xp} earnedKeys={g.earned} today={t0} loading={g.loading} />

      {ended.filter((s) => s.reflection).length > 0 && (
        <>
          <SectionTitle title="Past seasons" />
          <div className="space-y-2">
            {ended
              .filter((s) => s.reflection)
              .map((s) => {
                const sg = g.goals.filter((x) => x.season_id === s.id)
                return (
                  <Card key={s.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[15px] font-bold">{s.name}</p>
                      <span className="text-[12px] text-ink-faint">
                        {fmt(s.start_date)}–{fmt(s.end_date)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] font-semibold text-ink-soft">
                      {sg.filter((x) => x.completed_at).length} of {sg.length} goals completed
                    </p>
                    <p className="mt-2 text-[13px] italic text-ink-soft">“{s.reflection}”</p>
                  </Card>
                )
              })}
          </div>
        </>
      )}
      <div className="h-6" />

      <SeasonSheet
        open={seasonSheet.open}
        season={seasonSheet.season}
        onClose={() => setSeasonSheet((s) => ({ ...s, open: false }))}
        onSave={g.saveSeason}
        onDelete={g.deleteSeason}
      />
      <GoalSheet
        open={goalSheet.open}
        goal={goalSheet.goal}
        seasonId={goalSheet.seasonId}
        habits={g.habits}
        nextOrder={g.goals.length}
        onClose={() => setGoalSheet((s) => ({ ...s, open: false }))}
        onSave={g.saveGoal}
        onDelete={g.deleteGoal}
      />
      <Celebration item={g.celebrations[0]} remaining={g.celebrations.length} onDone={g.dismissCelebration} />
    </div>
  )
}

/* ---------- Season dashboard ---------- */
function SeasonBlock({
  season, goals, habits, today, onEdit, onAddGoal, onEditGoal, onToggleMilestone, onToggleGoal,
}: {
  season: Season
  goals: Goal[]
  habits: Habit[]
  today: string
  onEdit: () => void
  onAddGoal: () => void
  onEditGoal: (g: Goal) => void
  onToggleMilestone: (goalId: string, id: string) => void
  onToggleGoal: (goalId: string) => void
}) {
  const t = seasonTime(season, today)
  const theme = THEMES[season.theme ?? 'peri']
  const overall = seasonProgress(goals)
  return (
    <>
      <div className={cx('rounded-card p-4', theme.bg)}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <Eyebrow>Current season</Eyebrow>
            <h2 className="mt-1 text-[22px] font-extrabold leading-tight tracking-tight [text-wrap:balance]">{season.name}</h2>
            <p className="mt-1 text-[13px] font-semibold text-ink-soft">
              Week {t.week} of {t.weeks} · {t.daysLeft} {t.daysLeft === 1 ? 'day' : 'days'} left
            </p>
          </div>
          <ProgressRing value={overall} size={64} stroke={7}>
            <span className="text-[13px] font-extrabold">{Math.round(overall * 100)}%</span>
          </ProgressRing>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[11px] font-semibold text-ink-soft">
            <span>{fmt(season.start_date)}</span>
            <span>{fmt(season.end_date)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/80">
            <div className={cx('h-full rounded-full', theme.bar)} style={{ width: `${Math.round(t.ratio * 100)}%` }} />
          </div>
        </div>
        {season.notes && <p className="mt-3 text-[13px] text-ink">{season.notes}</p>}
        <button onClick={onEdit} className="mt-3 flex items-center gap-1 text-[12px] font-bold text-peri-deep">
          <Pencil size={13} /> Edit season
        </button>
      </div>

      <SectionTitle
        title="Season goals"
        action={
          <button onClick={onAddGoal} className="flex items-center gap-1 text-[13px] font-bold text-peri-deep">
            <Plus size={16} /> Goal
          </button>
        }
      />
      {goals.length === 0 ? (
        <button onClick={onAddGoal} className="w-full rounded-card border-2 border-dashed border-line px-4 py-5 text-left">
          <span className="block text-[15px] font-bold">Add your first goal</span>
          <span className="block text-[13px] text-ink-soft">Like "Run consistently" or "Plan outfits ahead". Break it into small milestones.</span>
        </button>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} habits={habits} onEdit={() => onEditGoal(goal)} onToggleMilestone={onToggleMilestone} onToggleGoal={onToggleGoal} />
          ))}
        </div>
      )}
    </>
  )
}

function GoalCard({
  goal, habits, onEdit, onToggleMilestone, onToggleGoal,
}: {
  goal: Goal
  habits: Habit[]
  onEdit: () => void
  onToggleMilestone: (goalId: string, id: string) => void
  onToggleGoal: (goalId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const p = goalProgress(goal)
  const linked = habits.filter((h) => goal.habit_ids.includes(h.id))
  const done = !!goal.completed_at
  return (
    <div className={cx('rounded-card', done ? 'bg-lemon-soft' : 'bg-white shadow-soft')}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full p-4 text-left">
        <div className="flex items-start gap-3">
          <span className="min-w-0 flex-1">
            {goal.category && <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft">{goal.category}</span>}
            <span className="block text-[15px] font-bold leading-snug">{goal.title}</span>
          </span>
          {done ? (
            <span className="flex h-7 items-center gap-1 rounded-full bg-lemon px-2.5 text-[11px] font-bold text-lemon-ink">
              <Check size={13} strokeWidth={3} /> Done
            </span>
          ) : (
            <ChevronDown size={20} className={cx('mt-1 shrink-0 text-ink-faint transition-transform', open && 'rotate-180')} />
          )}
        </div>
        {p.total > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
              <motion.div className="h-full rounded-full bg-peri" initial={false} animate={{ width: `${Math.round(p.ratio * 100)}%` }} />
            </div>
            <span className="text-[12px] font-bold tabular-nums text-ink-soft">
              {p.done}/{p.total}
            </span>
          </div>
        )}
        {goal.target_date && !done && <span className="mt-2 block text-[12px] text-ink-faint">Target {fmt(goal.target_date)}</span>}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              {goal.description && <p className="mb-2 text-[13px] text-ink-soft">{goal.description}</p>}
              <ul>
                {[...goal.milestones]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((m) => (
                    <li key={m.id}>
                      <button onClick={() => onToggleMilestone(goal.id, m.id)} className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-peri-wash/50">
                        <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-lg', m.done_at ? 'bg-lemon-deep' : 'ring-2 ring-peri-soft')}>
                          {m.done_at && <Check size={14} strokeWidth={3} />}
                        </span>
                        <span className={cx('flex-1 text-[14px] font-semibold', m.done_at && 'text-ink-faint line-through')}>{m.title}</span>
                        <span className={cx('text-[11px] font-bold', m.done_at ? 'text-lemon-ink' : 'text-ink-faint')}>+15</span>
                      </button>
                    </li>
                  ))}
              </ul>
              {linked.length > 0 && (
                <p className="mt-2 text-[12px] text-ink-soft">
                  Built by: <span className="font-semibold text-ink">{linked.map((h) => h.title).join(', ')}</span>
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button className="h-9 flex-1 px-3 text-[13px]" variant={done ? 'secondary' : 'primary'} onClick={() => onToggleGoal(goal.id)}>
                  {done ? 'Mark not done' : 'Mark goal complete · +50 XP'}
                </Button>
                <Button className="h-9 px-3 text-[13px]" onClick={onEdit} aria-label="Edit goal">
                  <Pencil size={15} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {done && (
        <div className="flex justify-end px-4 pb-3">
          <button onClick={() => setOpen((o) => !o)} className="text-[12px] font-bold text-lemon-ink">
            {open ? 'Hide' : 'Details'}
          </button>
        </div>
      )}
    </div>
  )
}

function ReviewCard({ season, onSave, onNew }: { season: Season; onSave: (t: string) => Promise<boolean>; onNew: () => void }) {
  const [text, setText] = useState('')
  const [err, setErr] = useState<string | null>(null)
  return (
    <Card tone="lemon">
      <Eyebrow className="text-lemon-ink">Season wrap-up</Eyebrow>
      <p className="mt-1 text-[17px] font-bold">{season.name} ended {fmt(season.end_date)}</p>
      <p className="mt-1 text-[13px] text-ink-soft">What went well? What would you keep or change next season?</p>
      <textarea
        id="season-reflection"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setErr(null)
        }}
        rows={3}
        className="mt-3 w-full rounded-2xl bg-white p-3 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
      />
      {err && <p className="mt-1 text-[13px] font-semibold text-[#B4456A]">{err}</p>}
      <div className="mt-2 flex gap-2">
        <Button variant="primary" className="flex-1" onClick={async () => (text.trim() ? await onSave(text.trim()) : setErr('Write a sentence or two first.'))}>
          Save reflection · +30 XP
        </Button>
        <Button onClick={onNew}>New season</Button>
      </div>
    </Card>
  )
}

/* ---------- Level, week summary, achievements ---------- */
function Progress({ xp, earnedKeys: earned, today: t0, loading }: { xp: XpEvent[]; earnedKeys: { achievement_key: string; earned_at: string }[]; today: string; loading: boolean }) {
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
  const keys = new Set(earned.map((e) => e.achievement_key))
  const comebacks = earned.filter((e) => e.achievement_key.startsWith('comeback-')).length

  return (
    <>
      <SectionTitle title="Progress" />
      <Card tone="lilac">
        <XPBar level={level.level} into={level.into} needed={level.needed} />
        <p className="mt-3 text-[12px] font-semibold text-ink-soft">
          {loading ? ' ' : `${totalActive} active ${totalActive === 1 ? 'day' : 'days'} so far · ${level.needed - level.into} XP to level ${level.level + 1}`}
        </p>
      </Card>

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
        <p className="mt-3 text-[13px] text-ink-soft">Lemon days are days you showed up. Rest days count too when you check off recovery.</p>
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

      <SectionTitle
        title="Achievements"
        action={<span className="text-[12px] font-semibold text-ink-faint">{ACHIEVEMENTS.filter((a) => (a.repeatable ? comebacks > 0 : keys.has(a.key))).length} of {ACHIEVEMENTS.length}</span>}
      />
      <div className="grid grid-cols-2 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = a.repeatable ? comebacks > 0 : keys.has(a.key)
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
              <p className="mt-0.5 text-[11px] text-ink-faint">{got && when ? new Date(when.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : a.hint}</p>
            </div>
          )
        })}
      </div>
    </>
  )
}

function Stat({ label, value, prev, note }: { label: string; value: number; prev: number; note?: string }) {
  const diff = value - prev
  return (
    <div className="rounded-2xl bg-canvas px-3 py-2.5">
      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft">{label}</div>
      <div className="mt-0.5 text-[22px] font-extrabold tabular-nums">{value}</div>
      <div className="text-[11px] text-ink-faint">{note ?? (diff > 0 ? `+${diff} vs last week` : `Last week: ${prev}`)}</div>
    </div>
  )
}
