import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { newId } from '../lib/store'
import type { Routine, RoutineStep } from '../lib/types'
import { DayPicker, FieldLabel, Sheet, inputClass } from './Sheet'
import { Button, Chip, cx } from './ui'

const TIMES: { id: Routine['time_of_day']; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'day', label: 'Daytime' },
  { id: 'evening', label: 'Evening' },
  { id: 'weekly', label: 'Weekly reset' },
]

type Props = {
  open: boolean
  routine: Routine | null
  nextOrder: number
  onClose: () => void
  onSave: (r: Routine) => Promise<boolean>
  onDelete: (id: string) => void
}

export default function RoutineSheet({ open, routine, nextOrder, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState<Routine['time_of_day']>('morning')
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [steps, setSteps] = useState<RoutineStep[]>([])
  const [newStep, setNewStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(routine?.title ?? '')
    setTime(routine?.time_of_day ?? 'morning')
    setDays(routine?.days ?? [0, 1, 2, 3, 4, 5, 6])
    setSteps(routine ? [...routine.steps].sort((a, b) => a.sort_order - b.sort_order) : [])
    setNewStep('')
    setError(null)
    setConfirm(false)
  }, [open, routine])

  const patch = (id: string, p: Partial<RoutineStep>) => setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const move = (i: number, d: -1 | 1) =>
    setSteps((s) => {
      const j = i + d
      if (j < 0 || j >= s.length) return s
      const copy = [...s]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  const addStep = () => {
    if (!newStep.trim()) return
    setSteps((s) => [...s, { id: newId(), title: newStep.trim(), duration_min: null, optional: false, in_busy_version: true, sort_order: s.length }])
    setNewStep('')
  }

  const submit = async () => {
    const pending = newStep.trim()
    const allSteps = pending
      ? [...steps, { id: newId(), title: pending, duration_min: null, optional: false, in_busy_version: true, sort_order: steps.length }]
      : steps
    if (!title.trim()) return setError('Give the routine a name.')
    if (!allSteps.length) return setError('Add at least one step.')
    if (!days.length) return setError('Pick at least one day.')
    const ok = await onSave({
      id: routine?.id ?? newId(),
      title: title.trim(),
      time_of_day: time,
      days,
      xp: time === 'weekly' ? 30 : 20,
      sort_order: routine?.sort_order ?? nextOrder,
      steps: allSteps.filter((s) => s.title.trim()).map((s, i) => ({ ...s, title: s.title.trim(), sort_order: i })),
    })
    if (ok) onClose()
  }

  return (
    <Sheet open={open} title={routine ? 'Edit routine' : 'New routine'} onClose={onClose} onSubmit={submit}>
      <input id="routine-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pack-my-gym-bag routine" className={inputClass} />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      <FieldLabel>When</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {TIMES.map((t) => (
          <Chip key={t.id} selected={time === t.id} onClick={() => setTime(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>
      <div className="mt-3">
        <DayPicker value={days} onChange={setDays} />
      </div>

      <FieldLabel>Steps</FieldLabel>
      <p className="-mt-1 mb-2 text-[12px] text-ink-soft">
        Tap <b>Busy</b> to keep a step in the short version. <b>Optional</b> steps never block finishing.
      </p>
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.id} className="rounded-2xl bg-canvas p-2">
            <div className="flex items-center gap-1">
              <input
                id={`step-${s.id}`}
                value={s.title}
                onChange={(e) => patch(s.id, { title: e.target.value })}
                className="h-9 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-[14px] font-semibold outline-none focus:bg-white"
              />
              <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-white">
                <ArrowUp size={16} />
              </button>
              <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-white">
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                aria-label="Remove step"
                onClick={() => setSteps((x) => x.filter((y) => y.id !== s.id))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-1 flex gap-1.5 px-1">
              <Toggle on={s.in_busy_version} onClick={() => patch(s.id, { in_busy_version: !s.in_busy_version })}>
                Busy
              </Toggle>
              <Toggle on={s.optional} onClick={() => patch(s.id, { optional: !s.optional })}>
                Optional
              </Toggle>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          id="new-step"
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addStep()
            }
          }}
          placeholder="Add a step"
          className="h-11 min-w-0 flex-1 rounded-btn bg-white px-4 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
        />
        <Button type="button" onClick={addStep} aria-label="Add step">
          <Plus size={18} />
        </Button>
      </div>

      <div className="mt-6 flex gap-2">
        {routine &&
          (confirm ? (
            <Button
              type="button"
              className="bg-[#FBE7EE] text-[#9C3558] ring-0"
              onClick={() => {
                onDelete(routine.id)
                onClose()
              }}
            >
              Delete
            </Button>
          ) : (
            <Button type="button" variant="ghost" aria-label="Delete routine" onClick={() => setConfirm(true)}>
              <Trash2 size={18} />
            </Button>
          ))}
        <Button type="submit" variant="primary" className="flex-1">
          {routine ? 'Save' : 'Add routine'}
        </Button>
      </div>
    </Sheet>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', on ? 'bg-peri-soft text-ink' : 'bg-white text-ink-faint ring-1 ring-line')}
    >
      {children}
    </button>
  )
}
