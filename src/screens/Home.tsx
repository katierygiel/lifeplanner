import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, Plus, Settings, Sparkles, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import TaskSheet from '../components/TaskSheet'
import { Button, Card, CheckRow, Chip, Eyebrow, ProgressRing, SectionTitle, XPBar, cx } from '../components/ui'
import { today } from '../lib/dates'
import { DAY_MODES, splitForMode } from '../lib/plan'
import type { Task, TaskInput } from '../lib/types'
import { useToday } from '../lib/useToday'
import { TIER_XP } from '../lib/xp'

type WorkoutVersion = 'full' | 'short' | 'recovery'
const WORKOUT: Record<WorkoutVersion, { title: string; detail: string; xp: number }> = {
  full: { title: 'Upper body', detail: '45 min · sample workout', xp: 30 },
  short: { title: 'Upper body, short', detail: '20 min · sample workout', xp: 25 },
  recovery: { title: 'Recovery walk', detail: '25 min · sample workout', xp: 20 },
}

function greeting(d: Date) {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function meta(t: Task) {
  const parts: string[] = []
  if (t.fixed_time) {
    const [h, m] = t.fixed_time.split(':').map(Number)
    parts.push(new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
  }
  if (t.duration_min) parts.push(t.duration_min < 60 ? `${t.duration_min} min` : `${t.duration_min / 60} hr`)
  return parts.join(' · ')
}

export default function Home({ name, onOpenSettings }: { name?: string | null; onOpenSettings: () => void }) {
  const now = new Date()
  const date = today()
  const day = useToday(date)
  const [sheet, setSheet] = useState<{ open: boolean; task: Task | null; preset?: Partial<TaskInput> }>({ open: false, task: null })
  const [showHidden, setShowHidden] = useState(false)
  const [version, setVersion] = useState<WorkoutVersion>('full')
  const [workoutDone, setWorkoutDone] = useState(false)

  const { visible, hidden, movable } = useMemo(() => splitForMode(day.tasks, day.mode), [day.tasks, day.mode])
  const listed = showHidden ? [...visible, ...hidden] : visible
  const priority = day.tasks.find((t) => t.is_priority)
  const counted = visible.filter((t) => !t.is_priority)
  const doneCount = visible.filter((t) => t.status === 'done').length
  const progress = visible.length ? doneCount / visible.length : 0

  const openNew = (preset?: Partial<TaskInput>) => setSheet({ open: true, task: null, preset })
  const openEdit = (task: Task) => setSheet({ open: true, task })

  return (
    <div className="space-y-3">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-1 pt-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink-soft">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight [text-wrap:balance]">
            {greeting(now)}
            {name ? `, ${name}` : ''}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ProgressRing value={progress} size={60} stroke={7}>
            <span className="text-[13px] font-extrabold">
              {doneCount}/{visible.length}
            </span>
          </ProgressRing>
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-soft shadow-soft md:hidden"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {day.error && (
        <Card tone="lilac" className="flex items-start gap-3">
          <p className="flex-1 text-[13px] font-semibold">{day.error}</p>
          <button onClick={day.clearError} className="text-[13px] font-bold text-peri-deep">
            OK
          </button>
        </Card>
      )}

      {/* Check-in */}
      <Card>
        <Eyebrow>Today's check-in</Eyebrow>
        <p className="mt-1 text-[16px] font-bold">How much do you have in the tank?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DAY_MODES.map((m) => (
            <Chip key={m.id} selected={day.mode === m.id} onClick={() => day.setMode(m.id)}>
              {m.label}
            </Chip>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={day.mode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-3 text-[13px] text-ink-soft"
          >
            {DAY_MODES.find((m) => m.id === day.mode)?.note}
          </motion.p>
        </AnimatePresence>
      </Card>

      {/* Priority */}
      {priority ? (
        <Card tone="lemon" className="px-2 py-2">
          <Eyebrow className="px-2 pt-2 text-lemon-ink">Today's priority</Eyebrow>
          <CheckRow
            title={priority.title}
            meta={meta(priority)}
            xp={TIER_XP[priority.tier]}
            done={priority.status === 'done'}
            onToggle={() => day.toggle(priority)}
            onOpen={() => openEdit(priority)}
          />
        </Card>
      ) : (
        !day.loading && (
          <button
            onClick={() => openNew({ is_priority: true, tier: 'must' })}
            className="flex w-full items-center gap-3 rounded-card border-2 border-dashed border-lemon-deep/70 bg-lemon-soft/50 px-4 py-4 text-left"
          >
            <Star size={20} className="shrink-0 text-lemon-ink" />
            <span className="flex-1">
              <span className="block text-[15px] font-bold">What's the one thing for today?</span>
              <span className="block text-[12px] text-ink-soft">Set a priority so it's always at the top.</span>
            </span>
            <Plus size={18} className="text-lemon-ink" />
          </button>
        )
      )}

      {/* Tasks */}
      <SectionTitle
        title="Today's plan"
        action={
          <button onClick={() => openNew()} className="flex items-center gap-1 text-[13px] font-bold text-peri-deep">
            <Plus size={16} /> Add
          </button>
        }
      />
      {day.loading ? (
        <Card className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-canvas" />
          ))}
        </Card>
      ) : counted.length === 0 && hidden.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac">
            <CalendarCheck size={22} />
          </div>
          <p className="text-[16px] font-bold">Plan today in a minute</p>
          <p className="mt-1 max-w-xs text-[13px] text-ink-soft">Add what needs to happen, what can flex, and a little recovery.</p>
          <Button variant="primary" className="mt-4" onClick={() => openNew()}>
            <Plus size={18} /> Add a task
          </Button>
        </Card>
      ) : (
        <Card className="px-2 py-2">
          <AnimatePresence initial={false}>
            {listed
              .filter((t) => !t.is_priority)
              .map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: hidden.includes(t) ? 0.55 : 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <CheckRow
                    title={t.title}
                    meta={meta(t)}
                    tier={t.tier}
                    xp={TIER_XP[t.tier]}
                    done={t.status === 'done'}
                    onToggle={() => day.toggle(t)}
                    onOpen={() => openEdit(t)}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
          {hidden.length > 0 && (
            <button
              onClick={() => setShowHidden((s) => !s)}
              className="w-full px-2 pb-1 pt-2 text-left text-[12px] font-semibold text-ink-soft"
            >
              {showHidden ? 'Hide extras' : `${hidden.length} tucked away for today · Show`}
            </button>
          )}
        </Card>
      )}

      {movable.length > 0 && (
        <Card tone="lilac" className="flex items-center gap-3">
          <p className="flex-1 text-[13px]">
            <b>
              {movable.length} flexible {movable.length === 1 ? 'task' : 'tasks'}
            </b>{' '}
            can wait. Move to tomorrow?
          </p>
          <Button className="h-9 px-3 text-[13px]" onClick={() => day.moveToTomorrow(movable.map((t) => t.id))}>
            Move <ArrowRight size={15} />
          </Button>
        </Card>
      )}

      {/* Workout (preview until stage 9) */}
      <SectionTitle title="Workout" action={<span className="text-[11px] font-semibold text-ink-faint">Sample until stage 9</span>} />
      <Card tone={version === 'recovery' ? 'mint' : 'peri'}>
        <div className="flex rounded-full bg-white/70 p-1">
          {(['full', 'short', 'recovery'] as WorkoutVersion[]).map((v) => (
            <button
              key={v}
              onClick={() => setVersion(v)}
              className={cx('relative flex-1 rounded-full py-1.5 text-[13px] font-semibold capitalize', version === v ? 'text-ink' : 'text-ink-soft')}
            >
              {version === v && <motion.span layoutId="workout-pill" className="absolute inset-0 rounded-full bg-white shadow-soft" />}
              <span className="relative">{v}</span>
            </button>
          ))}
        </div>
        <div className="mt-2">
          <CheckRow
            title={WORKOUT[version].title}
            meta={WORKOUT[version].detail}
            xp={WORKOUT[version].xp}
            done={workoutDone}
            onToggle={() => setWorkoutDone((d) => !d)}
          />
        </div>
      </Card>

      {/* Progress */}
      <SectionTitle title="Progress" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card tone="lilac">
          <XPBar level={day.level.level} into={day.level.into} needed={day.level.needed} />
          <p className="mt-3 text-[12px] font-semibold text-ink-soft">
            {day.todayXp > 0 ? `+${day.todayXp} XP today` : 'Check something off to earn XP'}
          </p>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lilac">
            <Sparkles size={18} />
          </span>
          <span>
            <span className="block text-[14px] font-bold">Seasons</span>
            <span className="block text-[12px] text-ink-soft">Your first season arrives in stage 10.</span>
          </span>
        </Card>
      </div>

      <div className="h-6" />

      {/* Floating add (phone) */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => openNew()}
        aria-label="Add a task"
        className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-peri-deep text-white shadow-[0_8px_24px_rgb(116_132_242/0.45)] md:hidden"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
      >
        <Plus size={26} />
      </motion.button>

      <TaskSheet
        open={sheet.open}
        task={sheet.task}
        preset={sheet.preset}
        date={date}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        onCreate={day.add}
        onSave={day.edit}
        onDelete={day.remove}
      />
    </div>
  )
}
