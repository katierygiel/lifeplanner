import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { today } from '../lib/dates'
import { VARIATIONS } from '../lib/fitness'
import { newId } from '../lib/store'
import type { PullupLog, PullupVariation, Race } from '../lib/types'
import { FieldLabel, Sheet, inputClass } from './Sheet'
import { Button, Chip } from './ui'

const small = 'h-11 w-full rounded-btn bg-canvas px-3 text-[15px] font-semibold outline-none ring-1 ring-line'

function Remove({ onConfirm }: { onConfirm: () => void }) {
  const [c, setC] = useState(false)
  return c ? (
    <Button type="button" className="bg-[#FBE7EE] text-[#9C3558] ring-0" onClick={onConfirm}>
      Delete
    </Button>
  ) : (
    <Button type="button" variant="ghost" aria-label="Delete" onClick={() => setC(true)}>
      <Trash2 size={18} />
    </Button>
  )
}

export function PullupSheet({
  open, entry, onClose, onSave, onDelete,
}: { open: boolean; entry: PullupLog | null; onClose: () => void; onSave: (p: PullupLog) => Promise<boolean>; onDelete: (id: string) => void }) {
  const [variation, setVariation] = useState<PullupVariation>('strict')
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('')
  const [date, setDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setVariation(entry?.variation ?? 'strict')
    setReps(entry ? String(entry.best_reps) : '')
    setSets(entry?.sets != null ? String(entry.sets) : '')
    setDate(entry?.date ?? today())
    setNotes(entry?.notes ?? '')
    setError(null)
  }, [open, entry])

  const submit = async () => {
    if (reps === '') return setError('Enter your best set, even if it is 0 or 1.')
    const ok = await onSave({ id: entry?.id ?? newId(), date, variation, best_reps: Number(reps), sets: sets === '' ? null : Number(sets), notes: notes.trim() || null })
    if (ok) onClose()
  }

  return (
    <Sheet open={open} title="Log pull-ups" onClose={onClose} onSubmit={submit}>
      <p className="text-[13px] text-ink-soft">Log what you can actually do today. Every stage on the way to strict pull-ups counts.</p>
      <FieldLabel>Variation</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {VARIATIONS.map((v) => (
          <Chip key={v.id} selected={variation === v.id} onClick={() => setVariation(v.id)}>
            {v.label}
          </Chip>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <label>
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Best set</span>
          <input id="pu-reps" inputMode="numeric" value={reps} onChange={(e) => { setReps(e.target.value.replace(/\D/g, '')); setError(null) }} placeholder="3" className={`mt-2 ${small}`} />
        </label>
        <label>
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Sets</span>
          <input id="pu-sets" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value.replace(/\D/g, ''))} placeholder="4" className={`mt-2 ${small}`} />
        </label>
        <label>
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Date</span>
          <input id="pu-date" type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} className={`mt-2 ${small} px-1.5 text-[13px]`} />
        </label>
      </div>
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}
      <FieldLabel>Notes</FieldLabel>
      <input id="pu-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Purple band, 3-second lowers" className={inputClass} />
      <div className="mt-6 flex gap-2">
        {entry && <Remove onConfirm={() => { onDelete(entry.id); onClose() }} />}
        <Button type="submit" variant="primary" className="flex-1">
          Save
        </Button>
      </div>
    </Sheet>
  )
}

export function RaceSheet({
  open, race, onClose, onSave, onDelete,
}: { open: boolean; race: Race | null; onClose: () => void; onSave: (r: Race) => Promise<boolean>; onDelete: (id: string) => void }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [division, setDivision] = useState('')
  const [result, setResult] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(race?.name ?? 'HYROX ')
    setDate(race?.date ?? '')
    setDivision(race?.division ?? '')
    setResult(race?.result ?? '')
    setNotes(race?.notes ?? '')
    setError(null)
  }, [open, race])

  const submit = async () => {
    if (!name.trim()) return setError('Name the race.')
    if (!date) return setError('Add the race date.')
    const ok = await onSave({ id: race?.id ?? newId(), name: name.trim(), date, division: division.trim() || null, result: result.trim() || null, notes: notes.trim() || null })
    if (ok) onClose()
  }

  return (
    <Sheet open={open} title={race ? 'Edit race' : 'Add a race'} onClose={onClose} onSubmit={submit}>
      <input id="race-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="HYROX New York" className={inputClass} />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <label>
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Date</span>
          <input id="race-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`mt-2 ${small}`} />
        </label>
        <label>
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Division</span>
          <input id="race-division" value={division} onChange={(e) => setDivision(e.target.value)} placeholder="Women's Open" className={`mt-2 ${small}`} />
        </label>
      </div>
      <FieldLabel>Result (after the race)</FieldLabel>
      <input id="race-result" value={result} onChange={(e) => setResult(e.target.value)} placeholder="1:32:10" className={inputClass} />
      <FieldLabel>Notes</FieldLabel>
      <textarea id="race-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Sled push was the hardest station." className="w-full rounded-2xl bg-canvas p-3 text-[15px] outline-none ring-1 ring-line" />
      <div className="mt-6 flex gap-2">
        {race && <Remove onConfirm={() => { onDelete(race.id); onClose() }} />}
        <Button type="submit" variant="primary" className="flex-1">
          Save race
        </Button>
      </div>
    </Sheet>
  )
}
