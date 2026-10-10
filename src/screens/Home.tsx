import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, Footprints, Leaf, MapPin, Palette, Shirt, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card, CheckRow, Chip, Eyebrow, ProgressRing, SectionTitle, XPBar, cx } from '../components/ui'
import { levelFromXp, TIER_XP, type Tier } from '../lib/xp'

type DayMode = 'full' | 'short' | 'essentials' | 'busy'
type WorkoutVersion = 'full' | 'short' | 'recovery'

const DAY_MODES: { id: DayMode; label: string; note: string }[] = [
  { id: 'full', label: 'Full plan', note: 'Plenty of energy. Everything is on.' },
  { id: 'short', label: 'Shorter day', note: 'Optional extras are tucked away for today.' },
  { id: 'essentials', label: 'Essentials', note: 'Just the must-dos and recovery. That counts.' },
  { id: 'busy', label: 'Busy day', note: 'Flexible tasks can move to another day. Nothing is lost.' },
]

const VISIBLE: Record<DayMode, Tier[]> = {
  full: ['must', 'flexible', 'optional', 'recovery'],
  short: ['must', 'flexible', 'recovery'],
  essentials: ['must', 'recovery'],
  busy: ['must', 'recovery'],
}

const WORKOUT: Record<WorkoutVersion, { title: string; detail: string; xp: number }> = {
  full: { title: 'Upper body', detail: '45 min · pull-up ladder, rows, presses', xp: 30 },
  short: { title: 'Upper body, short', detail: '20 min · pull-up ladder and one superset', xp: 25 },
  recovery: { title: 'Recovery walk', detail: '25 min easy walk or mobility flow', xp: 20 },
}

const SAMPLE_TASKS: { id: string; title: string; meta: string; tier: Tier }[] = [
  { id: 't1', title: 'Morning routine', meta: '20 min', tier: 'must' },
  { id: 't2', title: 'Pack lunch and water', meta: '10 min', tier: 'must' },
  { id: 't3', title: 'Plan Thursday outfit', meta: '5 min', tier: 'flexible' },
  { id: 't4', title: 'Side project time', meta: '30 min', tier: 'flexible' },
  { id: 't5', title: '10 min stretch before bed', meta: '10 min', tier: 'recovery' },
  { id: 't6', title: 'Read for 15 minutes', meta: '15 min', tier: 'optional' },
]

const SCHEDULE = [
  { time: '9:00', label: 'Office', icon: Briefcase },
  { time: '5:30', label: 'Commute', icon: MapPin },
  { time: '6:30', label: 'Field shift', icon: Footprints },
]

const BASE_XP = 470 // preview starting total

function greeting(d: Date) {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home({ onOpenStyle }: { onOpenStyle: () => void }) {
  const now = new Date()
  const [mode, setMode] = useState<DayMode>('full')
  const [version, setVersion] = useState<WorkoutVersion>('full')
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [workoutDone, setWorkoutDone] = useState(false)

  const visible = SAMPLE_TASKS.filter((t) => VISIBLE[mode].includes(t.tier))
  const moved = SAMPLE_TASKS.filter((t) => mode === 'busy' && t.tier === 'flexible')

  const earned = useMemo(() => {
    const tasks = SAMPLE_TASKS.filter((t) => done[t.id]).reduce((s, t) => s + TIER_XP[t.tier], 0)
    return tasks + (workoutDone ? WORKOUT[version].xp : 0)
  }, [done, workoutDone, version])

  const lvl = levelFromXp(BASE_XP + earned)
  const totalItems = visible.length + 1
  const doneItems = visible.filter((t) => done[t.id]).length + (workoutDone ? 1 : 0)
  const progress = doneItems / totalItems

  return (
    <div className="space-y-3">
      {/* Header */}
      <header className="flex items-center justify-between px-1 pt-2">
        <div>
          <div className="text-[13px] font-semibold text-ink-soft">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">{greeting(now)}</h1>
        </div>
        <ProgressRing value={progress} size={60} stroke={7}>
          <span className="text-[13px] font-extrabold">
            {doneItems}/{totalItems}
          </span>
        </ProgressRing>
      </header>

      {/* Check-in */}
      <Card>
        <Eyebrow>Today's check-in</Eyebrow>
        <p className="mt-1 text-[16px] font-bold">How much do you have in the tank?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DAY_MODES.map((m) => (
            <Chip key={m.id} selected={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </Chip>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={mode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-3 text-[13px] text-ink-soft"
          >
            {DAY_MODES.find((m) => m.id === mode)?.note}
          </motion.p>
        </AnimatePresence>
      </Card>

      {/* Priority */}
      <Card tone="lemon">
        <Eyebrow className="text-lemon-ink">Today's priority</Eyebrow>
        <div className="mt-1 flex items-center gap-3">
          <Star size={20} className="shrink-0 text-lemon-ink" />
          <p className="text-[17px] font-bold">Finish next week's content calendar before the field shift</p>
        </div>
      </Card>

      {/* Schedule */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {SCHEDULE.map(({ time, label, icon: Icon }) => (
          <div key={label} className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-soft">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-peri-wash text-peri-deep">
              <Icon size={16} />
            </span>
            <span>
              <span className="block text-[12px] font-semibold text-ink-soft">{time}</span>
              <span className="block text-[14px] font-bold">{label}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Workout */}
      <SectionTitle title="Workout" />
      <Card tone={version === 'recovery' ? 'mint' : 'peri'}>
        <div className="flex rounded-full bg-white/70 p-1">
          {(['full', 'short', 'recovery'] as WorkoutVersion[]).map((v) => (
            <button
              key={v}
              onClick={() => setVersion(v)}
              className={cx(
                'relative flex-1 rounded-full py-1.5 text-[13px] font-semibold capitalize',
                version === v ? 'text-ink' : 'text-ink-soft',
              )}
            >
              {version === v && (
                <motion.span layoutId="workout-pill" className="absolute inset-0 rounded-full bg-white shadow-soft" />
              )}
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
        {version !== 'full' && <p className="px-2 text-[12px] font-semibold text-ink-soft">Every version counts toward your week.</p>}
      </Card>

      {/* Tasks */}
      <SectionTitle title="Today's plan" action={<span className="text-[12px] font-semibold text-ink-faint">{visible.length} items</span>} />
      <Card className="px-2 py-2">
        <AnimatePresence initial={false}>
          {visible.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <CheckRow
                title={t.title}
                meta={t.meta}
                tier={t.tier}
                xp={TIER_XP[t.tier]}
                done={!!done[t.id]}
                onToggle={() => setDone((d) => ({ ...d, [t.id]: !d[t.id] }))}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </Card>
      {moved.length > 0 && (
        <Card tone="lilac" className="flex items-start gap-3">
          <Leaf size={18} className="mt-0.5 shrink-0 text-ink-soft" />
          <p className="text-[13px] text-ink">
            <b>{moved.length} flexible tasks</b> are ready to move to a lighter day. In the real app you'll pick which day.
          </p>
        </Card>
      )}

      {/* Progress */}
      <SectionTitle title="Progress" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card tone="lilac">
          <XPBar level={lvl.level} into={lvl.into} needed={lvl.needed} />
          <p className="mt-3 text-[12px] font-semibold text-ink-soft">+{earned} XP today</p>
        </Card>
        <Card>
          <Eyebrow>Current season</Eyebrow>
          <p className="mt-1 text-[16px] font-bold">My Fall Reset</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-lilac-wash">
            <div className="h-full w-[42%] rounded-full bg-lilac-deep" />
          </div>
          <p className="mt-2 text-[12px] font-semibold text-ink-soft">Week 3 of 8 · 4 of 9 milestones</p>
        </Card>
      </div>

      <Card tone="peri" className="flex items-center gap-3">
        <Shirt size={18} className="shrink-0 text-peri-deep" />
        <p className="flex-1 text-[13px]">Outfit of the day arrives with My Closet in Phase 3.</p>
      </Card>

      <div className="flex flex-col items-center gap-2 pb-4 pt-6">
        <p className="text-center text-[12px] text-ink-faint">Preview with sample data. Your own data saves once the database is connected.</p>
        <button onClick={onOpenStyle} className="flex items-center gap-1.5 text-[12px] font-semibold text-peri-deep md:hidden">
          <Palette size={14} /> View style guide
        </button>
      </div>
    </div>
  )
}
