import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dayLabel, fromDay } from '../lib/dates'
import { minutes, PRESETS } from '../lib/schedule'
import type { BlockInput, BlockKind, ScheduleBlock } from '../lib/types'
import { DayPicker, FieldLabel, Sheet, inputClass } from './Sheet'
import { Button, Chip, cx } from './ui'

type Props = {
  open: boolean
  block: ScheduleBlock | null
  date: string // the day being viewed
  presetKind?: BlockKind
  onClose: () => void
  onCreate: (bs: BlockInput[]) => Promise<boolean>
  onUpdate: (id: string, patch: Partial<BlockInput>) => Promise<boolean>
  onDelete: (id: string) => void
  onSkipDay: (b: ScheduleBlock, date: string) => void
}

export default function BlockSheet({ open, block, date, presetKind, onClose, onCreate, onUpdate, onDelete, onSkipDay }: Props) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<BlockKind>('event')
  const [start, setStart] = useState('12:00')
  const [end, setEnd] = useState('13:00')
  const [repeat, setRepeat] = useState(false)
  const [days, setDays] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const dow = fromDay(date).getDay()

  useEffect(() => {
    if (!open) return
    setError(null)
    setConfirm(false)
    if (block) {
      setTitle(block.title)
      setKind(block.kind)
      setStart(block.start_time.slice(0, 5))
      setEnd(block.end_time.slice(0, 5))
      setRepeat(block.weekday != null)
      setDays(block.weekday != null ? [block.weekday] : [dow])
    } else {
      const p = PRESETS.find((x) => x.kind === presetKind) ?? PRESETS[PRESETS.length - 1]
      setTitle(p.title)
      setKind(p.kind)
      setStart(p.start)
      setEnd(p.end)
      setRepeat(false)
      setDays([dow])
    }
  }, [open, block, presetKind, dow])

  const pickPreset = (k: BlockKind) => {
    const p = PRESETS.find((x) => x.kind === k)!
    setKind(k)
    if (!block) {
      if (!title || PRESETS.some((x) => x.title === title)) setTitle(p.title)
      setStart(p.start)
      setEnd(p.end)
    }
  }

  const submit = async () => {
    if (!title.trim()) return setError('Give it a name.')
    if (minutes(end) <= minutes(start)) return setError('End time needs to be after the start time.')
    if (repeat && !days.length) return setError('Pick at least one day.')
    const common = { title: title.trim(), kind, start_time: start, end_time: end, notes: null, repeat_until: null, skipped_dates: [] as string[] }
    let ok: boolean
    if (block) {
      ok = await onUpdate(block.id, { title: common.title, kind, start_time: start, end_time: end })
    } else if (repeat) {
      ok = await onCreate(days.map((d) => ({ ...common, date: null, weekday: d, repeat_from: date })))
    } else {
      ok = await onCreate([{ ...common, date, weekday: null, repeat_from: null }])
    }
    if (ok) onClose()
  }

  const recurring = block?.weekday != null

  return (
    <Sheet open={open} title={block ? 'Edit' : `Add to ${dayLabel(date)}`} onClose={onClose} onSubmit={submit}>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Chip key={p.kind + p.label} selected={kind === p.kind} onClick={() => pickPreset(p.kind)}>
            {p.label}
          </Chip>
        ))}
      </div>

      <FieldLabel>Name</FieldLabel>
      <input
        id="block-title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          setError(null)
        }}
        placeholder="Dinner with family"
        className={inputClass}
      />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      <FieldLabel>Time</FieldLabel>
      <div className="flex items-center gap-2">
        <input id="block-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} className={cx(inputClass, 'flex-1')} />
        <span className="text-ink-soft">to</span>
        <input id="block-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={cx(inputClass, 'flex-1')} />
      </div>

      {!block && (
        <>
          <FieldLabel>Happens</FieldLabel>
          <div className="flex gap-2">
            <Chip selected={!repeat} onClick={() => setRepeat(false)}>
              Just {dayLabel(date).toLowerCase() === 'today' ? 'today' : 'this day'}
            </Chip>
            <Chip selected={repeat} onClick={() => setRepeat(true)}>
              Every week
            </Chip>
          </div>
          {repeat && (
            <div className="mt-3">
              <DayPicker value={days} onChange={setDays} />
            </div>
          )}
        </>
      )}
      {recurring && <p className="mt-4 text-[12px] text-ink-soft">This repeats every week. Changes here apply to every week.</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {block &&
          (confirm ? (
            <Button
              type="button"
              className="bg-[#FBE7EE] text-[#9C3558] ring-0"
              onClick={() => {
                onDelete(block.id)
                onClose()
              }}
            >
              {recurring ? 'Delete every week' : 'Delete'}
            </Button>
          ) : (
            <Button type="button" variant="ghost" aria-label="Delete" onClick={() => setConfirm(true)}>
              <Trash2 size={18} />
            </Button>
          ))}
        {recurring && block && (
          <Button
            type="button"
            onClick={() => {
              onSkipDay(block, date)
              onClose()
            }}
          >
            Skip {dayLabel(date).toLowerCase() === 'today' ? 'today' : 'this day'} only
          </Button>
        )}
        <Button type="submit" variant="primary" className="flex-1">
          {block ? 'Save' : 'Add'}
        </Button>
      </div>
    </Sheet>
  )
}
