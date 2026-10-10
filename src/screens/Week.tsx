import { ChevronLeft, ChevronRight, Download, Dumbbell, Plus, Repeat } from 'lucide-react'
import { useMemo, useState } from 'react'
import BaseWeekSheet, { baseWeekBlocks } from '../components/BaseWeekSheet'
import BlockSheet from '../components/BlockSheet'
import TaskSheet from '../components/TaskSheet'
import { Button, Card, Eyebrow, SectionTitle, TierChip, cx } from '../components/ui'
import { ImportSheet, WorkoutSheet } from '../components/WorkoutSheets'
import { addDays, dayLabel, fromDay, today } from '../lib/dates'
import { blocksOn, dayLoad, formatRange, KIND_STYLE, PRESETS } from '../lib/schedule'
import type { BlockKind, ScheduleBlock, Task, TaskInput, WorkoutPlan } from '../lib/types'
import { mondayOf, useWeek } from '../lib/useWeek'

const LOAD_TEXT = { light: 'Light day', steady: 'Steady day', busy: 'Busy day', full: 'Very full day' }

export default function Week({ trainingNotes }: { trainingNotes?: string | null }) {
  const t0 = today()
  const [weekStart, setWeekStart] = useState(mondayOf(t0))
  const [selected, setSelected] = useState(t0)
  const week = useWeek(weekStart)
  const [blockSheet, setBlockSheet] = useState<{ open: boolean; block: ScheduleBlock | null; kind?: BlockKind }>({ open: false, block: null })
  const [taskSheet, setTaskSheet] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })
  const [workoutSheet, setWorkoutSheet] = useState<{ open: boolean; workout: WorkoutPlan | null }>({ open: false, workout: null })
  const [importOpen, setImportOpen] = useState(false)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const byDay = useMemo(
    () =>
      Object.fromEntries(
        days.map((d) => {
          const blocks = blocksOn(week.blocks, d)
          const tasks = week.tasks.filter((t) => t.planned_date === d)
          return [d, { blocks, tasks, load: dayLoad(blocks, tasks), workout: week.workouts.find((w) => w.date === d) ?? null }]
        }),
      ),
    [days, week.blocks, week.tasks, week.workouts],
  )
  const day = byDay[selected] ?? { blocks: [], tasks: [], load: dayLoad([], []), workout: null }


  const goWeek = (n: number) => {
    const next = addDays(weekStart, 7 * n)
    setWeekStart(next)
    setSelected(n === 0 ? t0 : next)
  }

  const baseBlocks = week.blocks.filter((b) => b.weekday != null && b.kind === 'work' && (!b.repeat_until || b.repeat_until >= t0))
  const [baseOpen, setBaseOpen] = useState(false)

  return (
    <div className="space-y-3">
      <header className="flex items-end justify-between px-1 pt-2">
        <div>
          <div className="text-[13px] font-semibold text-ink-soft">
            {weekStart === mondayOf(t0) ? 'This week' : `Week of ${fromDay(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </div>
          <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">My Week</h1>
        </div>
        <div className="flex items-center gap-1">
          <button aria-label="Previous week" onClick={() => goWeek(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft">
            <ChevronLeft size={20} />
          </button>
          {weekStart !== mondayOf(t0) && (
            <button onClick={() => { setWeekStart(mondayOf(t0)); setSelected(t0) }} className="h-10 rounded-full bg-white px-3 text-[13px] font-bold shadow-soft">
              Today
            </button>
          )}
          <button aria-label="Next week" onClick={() => goWeek(1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {week.error && (
        <Card tone="lilac" className="flex items-start gap-3">
          <p className="flex-1 text-[13px] font-semibold">{week.error}</p>
          <button onClick={week.clearError} className="text-[13px] font-bold text-peri-deep">OK</button>
        </Card>
      )}

      {/* Week strip */}
      <Card className="px-2 py-3">
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const info = byDay[d]
            const on = d === selected
            const isToday = d === t0
            return (
              <button key={d} onClick={() => setSelected(d)} aria-pressed={on} aria-label={dayLabel(d)} className={cx('flex flex-col items-center gap-1.5 rounded-2xl py-2 transition-colors', on ? 'bg-peri-wash' : 'hover:bg-canvas')}>
                <span className={cx('text-[11px] font-bold', isToday ? 'text-peri-deep' : 'text-ink-soft')}>
                  {fromDay(d).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                </span>
                <span className={cx('flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-extrabold', isToday ? 'bg-ink text-white' : '')}>
                  {fromDay(d).getDate()}
                </span>
                <span className="flex h-10 w-2.5 items-end overflow-hidden rounded-full bg-canvas">
                  <span
                    className={cx('w-full rounded-full', info.load.level === 'full' ? 'bg-lilac-deep' : info.load.level === 'busy' ? 'bg-peri' : 'bg-peri-soft')}
                    style={{ height: `${Math.max(info.load.ratio * 100, info.load.hours ? 12 : 0)}%` }}
                  />
                </span>
                <span className="flex h-1.5 gap-0.5">{info.workout && <span className="h-1.5 w-1.5 rounded-full bg-lemon-deep" />}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {!week.loading && baseBlocks.length === 0 && (
        <Card tone="lilac">
          <p className="text-[15px] font-bold">Set up your usual week</p>
          <p className="mt-1 text-[13px] text-ink-soft">Pick the days and hours you work most weeks. They'll repeat automatically, and you can change or skip any single day.</p>
          <Button variant="primary" className="mt-3" onClick={() => setBaseOpen(true)}>
            Set up my week
          </Button>
        </Card>
      )}

      {/* Selected day */}
      <SectionTitle
        title={dayLabel(selected)}
        action={<span className="text-[12px] font-semibold text-ink-soft">{day.load.hours ? `${LOAD_TEXT[day.load.level]} · ${Math.round(day.load.hours * 2) / 2} hrs planned` : 'Nothing planned yet'}</span>}
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
        {PRESETS.map((p) => (
          <button
            key={p.kind + p.label}
            onClick={() => setBlockSheet({ open: true, block: null, kind: p.kind })}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[13px] font-semibold shadow-soft"
          >
            <span className={cx('h-2 w-2 rounded-full', KIND_STYLE[p.kind].dot)} />
            {p.label}
          </button>
        ))}
      </div>

      <Card className="px-2 py-2">
        {day.blocks.length === 0 && day.tasks.length === 0 && !day.workout && (
          <p className="px-2 py-4 text-center text-[13px] text-ink-soft">Open day. Tap a button above to add work, plans, or events.</p>
        )}
        {day.blocks.map((b) => (
          <button key={b.id} onClick={() => setBlockSheet({ open: true, block: b })} className={cx('mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left', KIND_STYLE[b.kind].bg)}>
            <span className={cx('h-8 w-1 shrink-0 rounded-full', KIND_STYLE[b.kind].dot)} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold">{b.title}</span>
              <span className="block text-[12px] text-ink-soft">{formatRange(b)}</span>
            </span>
            {b.weekday != null && <Repeat size={14} className="text-ink-faint" aria-label="Repeats weekly" />}
          </button>
        ))}
        {day.workout && (
          <button onClick={() => setWorkoutSheet({ open: true, workout: day.workout })} className="mb-1 flex w-full items-center gap-3 rounded-2xl bg-lemon-soft px-3 py-2.5 text-left">
            <Dumbbell size={18} className="shrink-0 text-lemon-ink" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold">{day.workout.full_title}</span>
              <span className="block truncate text-[12px] text-ink-soft">
                {day.workout.completed_at ? `Done · ${day.workout.chosen} version` : [day.workout.short_title && `Short: ${day.workout.short_title}`, day.workout.recovery_title && `Recovery: ${day.workout.recovery_title}`].filter(Boolean).join(' · ')}
              </span>
            </span>
          </button>
        )}
        {day.tasks.map((t) => (
          <button key={t.id} onClick={() => setTaskSheet({ open: true, task: t })} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-canvas">
            <span className={cx('h-5 w-5 shrink-0 rounded-full', t.status === 'done' ? 'bg-lemon-deep' : 'ring-2 ring-peri-soft')} />
            <span className={cx('min-w-0 flex-1 truncate text-[14px] font-semibold', t.status === 'done' && 'text-ink-faint line-through')}>{t.title}</span>
            <TierChip tier={t.tier} />
          </button>
        ))}
        <div className="mt-1 flex gap-2 px-1 pb-1">
          <Button className="h-9 flex-1 px-3 text-[13px]" onClick={() => setTaskSheet({ open: true, task: null })}>
            <Plus size={15} /> Task
          </Button>
          {!day.workout && (
            <Button className="h-9 flex-1 px-3 text-[13px]" onClick={() => setWorkoutSheet({ open: true, workout: null })}>
              <Plus size={15} /> Workout
            </Button>
          )}
        </div>
      </Card>

      {baseBlocks.length > 0 && (
        <button onClick={() => setBaseOpen(true)} className="flex w-full items-center gap-2 px-1 text-left text-[13px] font-bold text-peri-deep">
          <Repeat size={14} /> Edit my usual week
        </button>
      )}

      {/* Workouts */}
      <SectionTitle title="Workouts" />
      <Card tone="peri" className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
          <Download size={18} className="text-peri-deep" />
        </span>
        <span className="min-w-0 flex-1">
          <Eyebrow>From ChatGPT</Eyebrow>
          <span className="block text-[13px]">Get full, short, and recovery workouts for the next 1–2 weeks in one paste.</span>
        </span>
        <Button variant="primary" className="h-9 px-3 text-[13px]" onClick={() => setImportOpen(true)}>
          Import
        </Button>
      </Card>
      <div className="h-6" />

      <BaseWeekSheet
        open={baseOpen}
        existing={baseBlocks}
        onClose={() => setBaseOpen(false)}
        onSave={(title, rows) => week.saveBaseWeek(baseWeekBlocks(title, rows, t0))}
      />
      <BlockSheet
        open={blockSheet.open}
        block={blockSheet.block}
        presetKind={blockSheet.kind}
        date={selected}
        onClose={() => setBlockSheet((s) => ({ ...s, open: false }))}
        onCreate={week.addBlocks}
        onUpdate={week.updateBlock}
        onDelete={week.deleteBlock}
        onSkipDay={week.skipDay}
      />
      <TaskSheet
        open={taskSheet.open}
        task={taskSheet.task}
        date={selected}
        onClose={() => setTaskSheet((s) => ({ ...s, open: false }))}
        onCreate={(input: TaskInput) => week.addTask(input)}
        onSave={week.editTask}
        onDelete={week.deleteTask}
      />
      <WorkoutSheet
        open={workoutSheet.open}
        date={selected}
        workout={workoutSheet.workout}
        onClose={() => setWorkoutSheet((s) => ({ ...s, open: false }))}
        onSave={week.saveWorkout}
        onDelete={week.deleteWorkout}
      />
      <ImportSheet
        open={importOpen}
        defaultStart={fromDay(t0).getDay() === 0 ? addDays(t0, 1) : t0}
        notes={trainingNotes}
        onClose={() => setImportOpen(false)}
        onImport={week.importWorkouts}
      />
    </div>
  )
}
