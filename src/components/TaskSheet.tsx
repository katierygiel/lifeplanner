import { AnimatePresence, motion } from 'framer-motion'
import { Star, Trash2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { addDays, today } from '../lib/dates'
import type { Task, TaskInput } from '../lib/types'
import { TIER_LABEL, TIER_XP, type Tier } from '../lib/xp'
import { Button, Chip, cx } from './ui'

const TIERS: { id: Tier; hint: string }[] = [
  { id: 'must', hint: 'Has to happen today' },
  { id: 'flexible', hint: 'Important, can move' },
  { id: 'optional', hint: 'Nice extra' },
  { id: 'recovery', hint: 'Rest that counts' },
]
const DURATIONS = [5, 10, 15, 30, 45, 60, 90]

type Props = {
  open: boolean
  task: Task | null // null = new task
  date: string
  preset?: Partial<TaskInput>
  onClose: () => void
  onCreate: (input: TaskInput) => Promise<boolean>
  onSave: (id: string, patch: Partial<Task>) => Promise<boolean>
  onDelete: (id: string) => void
}

export default function TaskSheet({ open, task, date, preset, onClose, onCreate, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('')
  const [tier, setTier] = useState<Tier>('flexible')
  const [duration, setDuration] = useState<number | null>(null)
  const [day, setDay] = useState(date)
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setTier(task?.tier ?? preset?.tier ?? 'flexible')
    setDuration(task?.duration_min ?? null)
    setDay(task?.planned_date ?? date)
    setTime(task?.fixed_time?.slice(0, 5) ?? '')
    setPriority(task?.is_priority ?? preset?.is_priority ?? false)
    setError(null)
    setConfirmDelete(false)
  }, [open, task, date, preset])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return setError('Give the task a name.')
    setSaving(true)
    const fields = {
      title: title.trim(),
      tier,
      duration_min: duration,
      planned_date: day,
      fixed_time: time || null,
      is_priority: priority,
    }
    const ok = task ? await onSave(task.id, fields) : await onCreate(fields)
    setSaving(false)
    if (ok) onClose()
  }

  const base = today()
  const dayChoices = [
    { id: base, label: 'Today' },
    { id: addDays(base, 1), label: 'Tomorrow' },
  ]
  const customDay = !dayChoices.some((d) => d.id === day)

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
          <motion.form
            onSubmit={submit}
            noValidate
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white px-5 pt-3 md:rounded-[28px]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line md:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[19px] font-extrabold">{task ? 'Edit task' : 'New task'}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-canvas">
                <X size={20} />
              </button>
            </div>

            <input
              id="task-title"
              autoFocus={!task}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setError(null)
              }}
              placeholder="Pack gym bag"
              className="h-12 w-full rounded-btn bg-canvas px-4 text-[17px] font-semibold outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
            />
            {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

            <Label>How important</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIERS.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTier(t.id)}
                  aria-pressed={tier === t.id}
                  className={cx(
                    'rounded-2xl px-3 py-2.5 text-left ring-1 transition-colors',
                    tier === t.id ? 'bg-peri-wash ring-2 ring-peri' : 'ring-line hover:bg-canvas',
                  )}
                >
                  <span className="flex items-baseline justify-between">
                    <span className="text-[14px] font-bold">{TIER_LABEL[t.id]}</span>
                    <span className="text-[11px] font-bold text-lemon-ink">+{TIER_XP[t.id]}</span>
                  </span>
                  <span className="block text-[12px] text-ink-soft">{t.hint}</span>
                </button>
              ))}
            </div>

            <Label>When</Label>
            <div className="flex flex-wrap items-center gap-2">
              {dayChoices.map((d) => (
                <Chip key={d.id} selected={day === d.id} onClick={() => setDay(d.id)}>
                  {d.label}
                </Chip>
              ))}
              <label
                className={cx(
                  'relative rounded-full px-3.5 py-2 text-[13px] font-semibold',
                  customDay ? 'bg-ink text-white' : 'bg-white ring-1 ring-line',
                )}
              >
                {customDay ? new Date(day + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pick a day'}
                <input
                  id="task-day"
                  type="date"
                  value={day}
                  min={base}
                  onChange={(e) => e.target.value && setDay(e.target.value)}
                  className="absolute inset-0 opacity-0"
                />
              </label>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
                Time (optional)
                <input
                  id="task-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-9 rounded-full bg-canvas px-3 text-[14px] text-ink outline-none ring-1 ring-line"
                />
              </label>
            </div>

            <Label>About how long</Label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((m) => (
                <Chip key={m} selected={duration === m} onClick={() => setDuration(duration === m ? null : m)}>
                  {m < 60 ? `${m} min` : `${m / 60 === 1 ? '1 hr' : '1.5 hr'}`}
                </Chip>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPriority((p) => !p)}
              aria-pressed={priority}
              className={cx(
                'mt-5 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
                priority ? 'bg-lemon-soft' : 'bg-canvas',
              )}
            >
              <Star size={20} className={priority ? 'fill-lemon-deep text-lemon-ink' : 'text-ink-faint'} />
              <span className="flex-1">
                <span className="block text-[14px] font-bold">Make this the day's priority</span>
                <span className="block text-[12px] text-ink-soft">One per day. It shows at the top of Home.</span>
              </span>
            </button>

            <div className="mt-5 flex gap-2">
              {task &&
                (confirmDelete ? (
                  <Button
                    type="button"
                    className="bg-[#FBE7EE] text-[#9C3558] ring-0"
                    onClick={() => {
                      onDelete(task.id)
                      onClose()
                    }}
                  >
                    Delete
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" aria-label="Delete task" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={18} />
                  </Button>
                ))}
              <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
                {saving ? 'Saving…' : task ? 'Save' : 'Add task'}
              </Button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Label({ children }: { children: string }) {
  return <div className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">{children}</div>
}
