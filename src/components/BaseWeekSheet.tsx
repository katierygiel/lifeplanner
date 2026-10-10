import { useEffect, useState } from 'react'
import { minutes } from '../lib/schedule'
import type { BlockInput, ScheduleBlock } from '../lib/types'
import { FieldLabel, Sheet, inputClass } from './Sheet'
import { Button, cx } from './ui'

// Monday-first order for display; values are JS weekdays (0 = Sunday).
const ORDER = [1, 2, 3, 4, 5, 6, 0]
const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type Row = { on: boolean; start: string; end: string }

type Props = {
  open: boolean
  existing: ScheduleBlock[] // current repeating work blocks
  onClose: () => void
  onSave: (title: string, rows: Record<number, Row>) => Promise<boolean>
}

export function baseWeekBlocks(title: string, rows: Record<number, Row>, from: string): BlockInput[] {
  return ORDER.filter((d) => rows[d]?.on).map((d) => ({
    title, kind: 'work', date: null, weekday: d, start_time: rows[d].start, end_time: rows[d].end,
    repeat_from: from, repeat_until: null, skipped_dates: [], notes: null,
  }))
}

export default function BaseWeekSheet({ open, existing, onClose, onSave }: Props) {
  const [title, setTitle] = useState('Work')
  const [rows, setRows] = useState<Record<number, Row>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    const next: Record<number, Row> = {}
    for (const d of ORDER) {
      const b = existing.find((x) => x.weekday === d)
      next[d] = b ? { on: true, start: b.start_time.slice(0, 5), end: b.end_time.slice(0, 5) } : { on: false, start: '09:00', end: '17:00' }
    }
    setRows(next)
    setTitle(existing[0]?.title ?? 'Work')
  }, [open, existing])

  const set = (d: number, p: Partial<Row>) => setRows((r) => ({ ...r, [d]: { ...r[d], ...p } }))
  const firstOn = ORDER.find((d) => rows[d]?.on)
  const copyToAll = () => {
    if (firstOn == null) return
    setRows((r) => Object.fromEntries(ORDER.map((d) => [d, r[d].on ? { ...r[d], start: r[firstOn].start, end: r[firstOn].end } : r[d]])))
  }

  const submit = async () => {
    if (!title.trim()) return setError('Give it a name, like Work or School.')
    const bad = ORDER.find((d) => rows[d]?.on && minutes(rows[d].end) <= minutes(rows[d].start))
    if (bad != null) return setError(`${NAMES[bad]}: end time needs to be after the start time.`)
    if (await onSave(title.trim(), rows)) onClose()
  }

  return (
    <Sheet open={open} title="Your usual week" onClose={onClose} onSubmit={submit}>
      <p className="text-[13px] text-ink-soft">The hours that repeat most weeks. Anything different, like a Saturday shift, you can add week by week.</p>
      <FieldLabel>What is it</FieldLabel>
      <input id="base-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Work" className={inputClass} />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      <FieldLabel>Days and hours</FieldLabel>
      <ul className="space-y-1.5">
        {ORDER.map((d) => {
          const r = rows[d]
          if (!r) return null
          return (
            <li key={d} className={cx('flex items-center gap-2 rounded-2xl px-2 py-1.5', r.on ? 'bg-peri-wash' : 'bg-canvas')}>
              <button
                type="button"
                aria-pressed={r.on}
                onClick={() => set(d, { on: !r.on })}
                className={cx('w-[76px] shrink-0 rounded-xl px-2 py-2 text-left text-[13px] font-bold', r.on ? 'text-ink' : 'text-ink-faint')}
              >
                <span className={cx('mr-2 inline-block h-3 w-3 rounded-full align-[-1px]', r.on ? 'bg-peri-deep' : 'ring-2 ring-line')} />
                {NAMES[d].slice(0, 3)}
              </button>
              {r.on ? (
                <span className="flex min-w-0 flex-1 items-center gap-1">
                  <input aria-label={`${NAMES[d]} start`} type="time" value={r.start} onChange={(e) => set(d, { start: e.target.value })} className="h-9 min-w-0 flex-1 rounded-lg bg-white px-1.5 text-[13px] outline-none ring-1 ring-line" />
                  <span className="text-ink-faint">–</span>
                  <input aria-label={`${NAMES[d]} end`} type="time" value={r.end} onChange={(e) => set(d, { end: e.target.value })} className="h-9 min-w-0 flex-1 rounded-lg bg-white px-1.5 text-[13px] outline-none ring-1 ring-line" />
                </span>
              ) : (
                <span className="text-[13px] text-ink-faint">Off</span>
              )}
            </li>
          )
        })}
      </ul>
      {firstOn != null && (
        <button type="button" onClick={copyToAll} className="mt-2 text-[12px] font-bold text-peri-deep">
          Use {NAMES[firstOn]}'s hours for every work day
        </button>
      )}
      <p className="mt-4 text-[12px] text-ink-soft">Changes start today. Past weeks keep the hours they had.</p>
      <Button type="submit" variant="primary" className="mt-4 w-full">
        Save my week
      </Button>
    </Sheet>
  )
}
