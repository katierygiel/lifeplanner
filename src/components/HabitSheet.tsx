import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Habit, HabitInput } from '../lib/types'
import { TIER_LABEL, TIER_XP, type Tier } from '../lib/xp'
import { DayPicker, FieldLabel, Sheet, inputClass } from './Sheet'
import { Button, cx } from './ui'

const TIERS: Tier[] = ['must', 'flexible', 'optional', 'recovery']

type Props = {
  open: boolean
  habit: Habit | null
  onClose: () => void
  onSave: (id: string | null, h: HabitInput) => Promise<boolean>
  onDelete: (id: string) => void
}

export default function HabitSheet({ open, habit, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('')
  const [tier, setTier] = useState<Tier>('flexible')
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(habit?.title ?? '')
    setTier(habit?.tier ?? 'flexible')
    setDays(habit?.days ?? [0, 1, 2, 3, 4, 5, 6])
    setError(null)
    setConfirm(false)
  }, [open, habit])

  const submit = async () => {
    if (!title.trim()) return setError('Give the habit a name.')
    if (!days.length) return setError('Pick at least one day.')
    const ok = await onSave(habit?.id ?? null, {
      title: title.trim(),
      tier,
      xp: TIER_XP[tier],
      days,
      active: true,
      sort_order: habit?.sort_order ?? 0,
    })
    if (ok) onClose()
  }

  return (
    <Sheet open={open} title={habit ? 'Edit habit' : 'New habit'} onClose={onClose} onSubmit={submit}>
      <input
        id="habit-title"
        autoFocus={!habit}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          setError(null)
        }}
        placeholder="Drink 2 bottles of water"
        className={inputClass}
      />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      <FieldLabel>How important</FieldLabel>
      <div className="grid grid-cols-4 gap-1.5">
        {TIERS.map((t) => (
          <button
            type="button"
            key={t}
            aria-pressed={tier === t}
            onClick={() => setTier(t)}
            className={cx('rounded-2xl px-1 py-2 text-center ring-1', tier === t ? 'bg-peri-wash ring-2 ring-peri' : 'ring-line')}
          >
            <span className="block text-[12px] font-bold">{TIER_LABEL[t]}</span>
            <span className="block text-[11px] font-bold text-lemon-ink">+{TIER_XP[t]}</span>
          </button>
        ))}
      </div>

      <FieldLabel>Which days</FieldLabel>
      <DayPicker value={days} onChange={setDays} />

      <div className="mt-6 flex gap-2">
        {habit &&
          (confirm ? (
            <Button
              type="button"
              className="bg-[#FBE7EE] text-[#9C3558] ring-0"
              onClick={() => {
                onDelete(habit.id)
                onClose()
              }}
            >
              Delete
            </Button>
          ) : (
            <Button type="button" variant="ghost" aria-label="Delete habit" onClick={() => setConfirm(true)}>
              <Trash2 size={18} />
            </Button>
          ))}
        <Button type="submit" variant="primary" className="flex-1">
          {habit ? 'Save' : 'Add habit'}
        </Button>
      </div>
    </Sheet>
  )
}
