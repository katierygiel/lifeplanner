import { Check, Copy, ExternalLink, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { addDays, dayLabel, fromDay } from '../lib/dates'
import { importPrompt, parseWorkouts } from '../lib/importer'
import type { WorkoutInput, WorkoutPlan } from '../lib/types'
import { FieldLabel, Sheet, inputClass } from './Sheet'
import { Button, Chip, cx } from './ui'

const VERSIONS = [
  { key: 'full', label: 'Full', hint: 'Your normal session' },
  { key: 'short', label: 'Short', hint: 'For busy or low-energy days' },
  { key: 'recovery', label: 'Recovery', hint: 'Walk, mobility, or rest' },
] as const

type Props = {
  open: boolean
  date: string
  workout: WorkoutPlan | null
  onClose: () => void
  onSave: (w: WorkoutInput & { id?: string }) => Promise<boolean>
  onDelete: (id: string) => void
}

export function WorkoutSheet({ open, date, workout, onClose, onSave, onDelete }: Props) {
  const [f, setF] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setF({
      full_title: workout?.full_title ?? '',
      full_detail: workout?.full_detail ?? '',
      short_title: workout?.short_title ?? '',
      short_detail: workout?.short_detail ?? '',
      recovery_title: workout?.recovery_title ?? 'Easy walk',
      recovery_detail: workout?.recovery_detail ?? '20–30 min',
    })
    setError(null)
    setConfirm(false)
  }, [open, workout])

  const submit = async () => {
    if (!f.full_title?.trim()) return setError('Add at least the full workout.')
    const v = (k: string) => f[k]?.trim() || null
    const ok = await onSave({
      ...(workout?.id ? { id: workout.id } : {}),
      date,
      full_title: v('full_title'),
      full_detail: v('full_detail'),
      short_title: v('short_title'),
      short_detail: v('short_detail'),
      recovery_title: v('recovery_title'),
      recovery_detail: v('recovery_detail'),
      chosen: workout?.chosen ?? null,
      completed_at: workout?.completed_at ?? null,
      source: workout?.source ?? 'manual',
    })
    if (ok) onClose()
  }

  return (
    <Sheet open={open} title={`Workout · ${dayLabel(date)}`} onClose={onClose} onSubmit={submit}>
      {error && <p className="mb-2 text-[13px] font-semibold text-[#B4456A]">{error}</p>}
      {VERSIONS.map((ver) => (
        <div key={ver.key}>
          <FieldLabel>
            {ver.label} <span className="font-semibold normal-case tracking-normal text-ink-faint">· {ver.hint}</span>
          </FieldLabel>
          <input
            id={`${ver.key}-title`}
            value={f[`${ver.key}_title`] ?? ''}
            onChange={(e) => setF((x) => ({ ...x, [`${ver.key}_title`]: e.target.value }))}
            placeholder={ver.key === 'full' ? 'Upper body' : ver.key === 'short' ? 'Upper body express' : 'Easy walk'}
            className={inputClass}
          />
          <input
            id={`${ver.key}-detail`}
            value={f[`${ver.key}_detail`] ?? ''}
            onChange={(e) => setF((x) => ({ ...x, [`${ver.key}_detail`]: e.target.value }))}
            placeholder="45 min · pull-up ladder, rows, presses"
            className="mt-2 h-11 w-full rounded-btn bg-white px-4 text-[14px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
          />
        </div>
      ))}
      <div className="mt-6 flex gap-2">
        {workout &&
          (confirm ? (
            <Button
              type="button"
              className="bg-[#FBE7EE] text-[#9C3558] ring-0"
              onClick={() => {
                onDelete(workout.id)
                onClose()
              }}
            >
              Delete
            </Button>
          ) : (
            <Button type="button" variant="ghost" aria-label="Delete workout" onClick={() => setConfirm(true)}>
              <Trash2 size={18} />
            </Button>
          ))}
        <Button type="submit" variant="primary" className="flex-1">
          Save workout
        </Button>
      </div>
    </Sheet>
  )
}

type ImportProps = {
  open: boolean
  defaultStart: string
  notes?: string | null
  onClose: () => void
  onImport: (ws: WorkoutInput[]) => Promise<boolean>
}

export function ImportSheet({ open, defaultStart, notes, onClose, onImport }: ImportProps) {
  const [start, setStart] = useState(defaultStart)
  const [days, setDays] = useState(14)
  const [copied, setCopied] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStart(defaultStart)
    setText('')
    setCopied(false)
    setError(null)
  }, [open, defaultStart])

  const prompt = importPrompt(start, days, notes)
  const parsed = useMemo(() => parseWorkouts(text), [text])
  const inRange = parsed.days.filter((d) => d.date >= start && d.date <= addDays(start, days - 1))
  const outOfRange = parsed.days.length - inRange.length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const el = document.getElementById('import-prompt') as HTMLTextAreaElement | null
      el?.focus()
      el?.select()
      setError('Select the request text and copy it.')
    }
  }

  const submit = async () => {
    if (!parsed.days.length)
      return setError(
        text.trim()
          ? "Couldn't find any days in that reply. Each day needs a line like DATE: 2026-10-12, then FULL:, SHORT:, and RECOVERY:."
          : "Paste ChatGPT's reply first.",
      )
    setBusy(true)
    const ok = await onImport(parsed.days.map((d) => ({ ...d, chosen: null, completed_at: null, source: 'import' as const })))
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Sheet open={open} title="Import from ChatGPT" onClose={onClose} onSubmit={submit}>
      <ol className="space-y-1 text-[13px] text-ink-soft">
        <li>
          <b className="text-ink">1.</b> Copy the request and send it to ChatGPT.
        </li>
        <li>
          <b className="text-ink">2.</b> Copy ChatGPT's whole reply and paste it below.
        </li>
      </ol>

      <FieldLabel>Plan starting</FieldLabel>
      <div className="flex flex-wrap items-center gap-2">
        <input id="import-start" type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} className="h-10 rounded-full bg-canvas px-3 text-[14px] font-semibold outline-none ring-1 ring-line" />
        {[7, 14].map((n) => (
          <Chip key={n} selected={days === n} onClick={() => setDays(n)}>
            {n === 7 ? '1 week' : '2 weeks'}
          </Chip>
        ))}
      </div>

      {!notes?.trim() && (
        <p className="mt-3 rounded-xl bg-lemon-soft px-3 py-2 text-[12px] text-lemon-ink">
          Tip: add your training goals in Settings and they'll be included in this request.
        </p>
      )}
      <textarea id="import-prompt" readOnly value={prompt} rows={5} className="mt-3 w-full resize-none rounded-2xl bg-canvas p-3 text-[12px] leading-relaxed text-ink-soft outline-none" />
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="primary" className="flex-1" onClick={copy}>
          {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copied' : 'Copy request'}
        </Button>
        <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-btn bg-white px-4 text-[15px] font-semibold ring-1 ring-line">
          ChatGPT <ExternalLink size={15} />
        </a>
      </div>

      <FieldLabel>Paste the reply</FieldLabel>
      <textarea
        id="import-reply"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        rows={5}
        placeholder={'DATE: ' + start + '\nFULL: …\nSHORT: …\nRECOVERY: …'}
        className="w-full rounded-2xl bg-white p-3 text-[14px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
      />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      {parsed.days.length > 0 && (
        <div className="mt-3 rounded-2xl bg-peri-wash p-3">
          <p className="text-[13px] font-bold">
            Found {parsed.days.length} {parsed.days.length === 1 ? 'day' : 'days'}
          </p>
          <ul className="mt-2 space-y-1">
            {parsed.days.map((d) => (
              <li key={d.date} className="flex gap-2 text-[12px]">
                <span className="w-24 shrink-0 font-semibold text-ink-soft">
                  {fromDay(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className={cx('min-w-0 flex-1 truncate', !d.short_title && 'text-ink-soft')}>
                  {d.full_title}
                  {d.short_title ? ` · ${d.short_title}` : ''}
                </span>
              </li>
            ))}
          </ul>
          {outOfRange > 0 && <p className="mt-2 text-[12px] text-ink-soft">{outOfRange} of these are outside the dates you picked. They'll still be imported.</p>}
          <p className="mt-2 text-[12px] text-ink-soft">Days you already finished a workout on stay as they are.</p>
        </div>
      )}

      <Button type="submit" variant="primary" className="mt-5 w-full" disabled={busy}>
        {busy ? 'Importing…' : parsed.days.length ? `Import ${parsed.days.length} days` : 'Import'}
      </Button>
    </Sheet>
  )
}
