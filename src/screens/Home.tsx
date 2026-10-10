import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, Dumbbell, Plus, Settings, Sparkles, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import CheckinCard from '../components/CheckinCard'
import HabitSheet from '../components/HabitSheet'
import RoutineCard from '../components/RoutineCard'
import RoutineSheet from '../components/RoutineSheet'
import { describeDays } from '../components/Sheet'
import TaskSheet from '../components/TaskSheet'
import { WorkoutSheet } from '../components/WorkoutSheets'
import { formatRange, KIND_STYLE } from '../lib/schedule'
import { Button, Card, CheckRow, Eyebrow, ProgressRing, SectionTitle, XPBar, cx } from '../components/ui'
import { today } from '../lib/dates'
import { splitForMode } from '../lib/plan'
import { defaultVersion, isOn } from '../lib/routines'
import type { Habit, Routine, Task, TaskInput } from '../lib/types'
import { useToday, WORKOUT_XP } from '../lib/useToday'
import { TIER_XP } from '../lib/xp'

type WorkoutVersion = 'full' | 'short' | 'recovery'

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
  const [habitSheet, setHabitSheet] = useState<{ open: boolean; habit: Habit | null }>({ open: false, habit: null })
  const [routineSheet, setRoutineSheet] = useState<{ open: boolean; routine: Routine | null }>({ open: false, routine: null })
  const [pickedVersion, setPickedVersion] = useState<WorkoutVersion | null>(null)
  const [workoutOpen, setWorkoutOpen] = useState(false)

  const { visible, hidden, movable } = useMemo(() => splitForMode(day.tasks, day.mode), [day.tasks, day.mode])
  const listed = showHidden ? [...visible, ...hidden] : visible
  const priority = day.tasks.find((t) => t.is_priority)
  const counted = visible.filter((t) => !t.is_priority)

  const suggestedVersion: WorkoutVersion = day.mode === 'full' ? 'full' : day.mode === 'short' ? 'short' : 'recovery'
  const available = (['full', 'short', 'recovery'] as WorkoutVersion[]).filter((v) => day.workout?.[`${v}_title`])
  const version: WorkoutVersion =
    (day.workout?.completed_at && day.workout.chosen) ||
    (pickedVersion && available.includes(pickedVersion) ? pickedVersion : null) ||
    (available.includes(suggestedVersion) ? suggestedVersion : available[0] ?? 'full')
  const todaysHabits = day.habits.filter((h) => h.active && isOn(h.days, date))
  const todaysRoutines = day.routines.filter((r) => isOn(r.days, date))
  const routineDone = todaysRoutines.filter((r) => day.routineLogs.find((l) => l.routine_id === r.id)?.completed).length
  const totalCount = visible.length + todaysHabits.length + todaysRoutines.length + (day.workout ? 1 : 0)
  const doneCount =
    visible.filter((t) => t.status === 'done').length + todaysHabits.filter((h) => day.habitDone.includes(h.id)).length + routineDone + (day.workout?.completed_at ? 1 : 0)
  const progress = totalCount ? doneCount / totalCount : 0

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
              {doneCount}/{totalCount}
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
      {!day.loading && <CheckinCard checkin={day.checkin} onSave={day.saveCheckin} />}

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

      {/* Today's schedule */}
      {day.blocks.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
          {day.blocks.map((b) => (
            <div key={b.id} className={cx('flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5', KIND_STYLE[b.kind].bg)}>
              <span className={cx('h-7 w-1 rounded-full', KIND_STYLE[b.kind].dot)} />
              <span>
                <span className="block text-[12px] font-semibold text-ink-soft">{formatRange(b)}</span>
                <span className="block text-[14px] font-bold">{b.title}</span>
              </span>
            </div>
          ))}
        </div>
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

      {/* Routines */}
      <SectionTitle
        title="Routines"
        action={
          <button onClick={() => setRoutineSheet({ open: true, routine: null })} className="flex items-center gap-1 text-[13px] font-bold text-peri-deep">
            <Plus size={16} /> New
          </button>
        }
      />
      {!day.loading && day.routines.length === 0 ? (
        <Card tone="lilac">
          <p className="text-[15px] font-bold">Start with your routines from the brief?</p>
          <p className="mt-1 text-[13px] text-ink-soft">Morning routine, evening reset, and a Sunday reset. Edit or delete any of them.</p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={day.addStarterRoutines}>
              Add starters
            </Button>
            <Button onClick={() => setRoutineSheet({ open: true, routine: null })}>Make my own</Button>
          </div>
        </Card>
      ) : todaysRoutines.length === 0 ? (
        <p className="px-1 text-[13px] text-ink-soft">No routines scheduled today.</p>
      ) : (
        <div className="space-y-2">
          {todaysRoutines.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              log={day.routineLogs.find((l) => l.routine_id === r.id)}
              defaultVersion={defaultVersion(day.mode)}
              onToggleStep={(stepId, v) => day.toggleStep(r, stepId, v)}
              onEdit={() => setRoutineSheet({ open: true, routine: r })}
            />
          ))}
        </div>
      )}

      {/* Habits */}
      <SectionTitle
        title="Habits"
        action={
          <button onClick={() => setHabitSheet({ open: true, habit: null })} className="flex items-center gap-1 text-[13px] font-bold text-peri-deep">
            <Plus size={16} /> New
          </button>
        }
      />
      {todaysHabits.length === 0 ? (
        <button
          onClick={() => setHabitSheet({ open: true, habit: null })}
          className="w-full rounded-card border-2 border-dashed border-line px-4 py-4 text-left text-[13px] text-ink-soft"
        >
          {day.habits.length ? 'No habits scheduled today. Tap to add one.' : 'Add small daily habits, like water, steps, or stretching.'}
        </button>
      ) : (
        <Card className="px-2 py-2">
          {todaysHabits.map((h) => (
            <CheckRow
              key={h.id}
              title={h.title}
              tier={h.tier}
              meta={describeDays(h.days)}
              xp={h.xp}
              done={day.habitDone.includes(h.id)}
              onToggle={() => day.toggleHabit(h)}
              onOpen={() => setHabitSheet({ open: true, habit: h })}
            />
          ))}
        </Card>
      )}

      {/* Workout */}
      <SectionTitle
        title="Workout"
        action={
          day.workout ? (
            <button onClick={() => setWorkoutOpen(true)} className="text-[13px] font-bold text-peri-deep">
              Edit
            </button>
          ) : undefined
        }
      />
      {day.workout ? (
        <Card tone={version === 'recovery' ? 'mint' : 'peri'}>
          <div className="flex rounded-full bg-white/70 p-1">
            {(['full', 'short', 'recovery'] as WorkoutVersion[])
              .filter((v) => day.workout?.[`${v}_title`])
              .map((v) => (
                <button
                  key={v}
                  onClick={() => setPickedVersion(v)}
                  className={cx('relative flex-1 rounded-full py-1.5 text-[13px] font-semibold capitalize', version === v ? 'text-ink' : 'text-ink-soft')}
                >
                  {version === v && <motion.span layoutId="workout-pill" className="absolute inset-0 rounded-full bg-white shadow-soft" />}
                  <span className="relative">{v}</span>
                </button>
              ))}
          </div>
          <div className="mt-2">
            <CheckRow
              title={day.workout[`${version}_title`] ?? ''}
              meta={day.workout[`${version}_detail`] ?? undefined}
              xp={WORKOUT_XP[version]}
              done={!!day.workout.completed_at && day.workout.chosen === version}
              onToggle={() => day.completeWorkout(version)}
            />
          </div>
          {version !== 'full' && <p className="px-2 text-[12px] font-semibold text-ink-soft">Every version counts toward your week.</p>}
        </Card>
      ) : (
        <button
          onClick={() => setWorkoutOpen(true)}
          className="flex w-full items-center gap-3 rounded-card border-2 border-dashed border-peri-soft bg-peri-wash/50 px-4 py-4 text-left"
        >
          <Dumbbell size={20} className="shrink-0 text-peri-deep" />
          <span className="flex-1">
            <span className="block text-[15px] font-bold">No workout planned today</span>
            <span className="block text-[12px] text-ink-soft">Add one, or import a plan from ChatGPT in My Week.</span>
          </span>
          <Plus size={18} className="text-peri-deep" />
        </button>
      )}

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

      <WorkoutSheet
        open={workoutOpen}
        date={date}
        workout={day.workout}
        onClose={() => setWorkoutOpen(false)}
        onSave={day.saveWorkout}
        onDelete={day.deleteWorkout}
      />
      <HabitSheet
        open={habitSheet.open}
        habit={habitSheet.habit}
        onClose={() => setHabitSheet((x) => ({ ...x, open: false }))}
        onSave={day.saveHabit}
        onDelete={day.deleteHabit}
      />
      <RoutineSheet
        open={routineSheet.open}
        routine={routineSheet.routine}
        nextOrder={day.routines.length}
        onClose={() => setRoutineSheet((x) => ({ ...x, open: false }))}
        onSave={day.saveRoutine}
        onDelete={day.deleteRoutine}
      />
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
