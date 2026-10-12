import { ClipboardPaste, Copy, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { today } from '../lib/dates'
import { hasDistance, hasSets, KINDS, lastTime, pace } from '../lib/fitness'
import { parseWorkoutNotes } from '../lib/notesParser'
import { newId } from '../lib/store'
import type { ExerciseEntry, WorkoutKind, WorkoutLog, WorkoutTemplate } from '../lib/types'
import { FieldLabel, Sheet, inputClass } from './Sheet'
import { Button, Chip, cx } from './ui'

export type LogPreset = Partial<Pick<WorkoutLog, 'title' | 'kind' | 'version' | 'plan_id' | 'date'>> & { paste?: boolean }

type Props = {
  open: boolean
  log: WorkoutLog | null
  preset?: LogPreset
  logs: WorkoutLog[]
  templates: WorkoutTemplate[]
  onClose: () => void
  onSave: (log: WorkoutLog, asTemplate: boolean) => Promise<boolean>
  onDelete: (id: string) => void
}

function summarizeSets(sets: { reps: number | null; weight: number | null }[]) {
  const groups: { n: number; reps: number | null; weight: number | null }[] = []
  for (const s of sets) {
    const g = groups[groups.length - 1]
    if (g && g.reps === s.reps && g.weight === s.weight) g.n++
    else groups.push({ n: 1, ...s })
  }
  return groups.map((g) => `${g.n}×${g.reps ?? '?'}${g.weight != null ? ` @ ${g.weight} lb` : ''}`).join(', ')
}

const num = (v: string) => (v.trim() === '' ? null : Number(v))
const blankExercise = (): ExerciseEntry => ({ name: '', sets: [{ reps: null, weight: null }] })

export default function WorkoutLogSheet({ open, log, preset, logs, templates, onClose, onSave, onDelete }: Props) {
  const [kind, setKind] = useState<WorkoutKind>('strength')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())
  const [version, setVersion] = useState<WorkoutLog['version']>(null)
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [effort, setEffort] = useState<number | null>(null)
  const [exercises, setExercises] = useState<ExerciseEntry[]>([])
  const [notes, setNotes] = useState('')
  const [asTemplate, setAsTemplate] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    const src = log ?? preset ?? {}
    const k = (src.kind as WorkoutKind) ?? 'strength'
    setKind(k)
    setTitle(src.title ?? '')
    setDate(src.date ?? today())
    setVersion(src.version ?? null)
    setDuration(log?.duration_min != null ? String(log.duration_min) : '')
    setDistance(log?.distance_km != null ? String(log.distance_km) : '')
    setEffort(log?.effort ?? null)
    setExercises(log?.exercises?.length ? log.exercises : hasSets(k) ? [blankExercise()] : [])
    setNotes(log?.notes ?? '')
    setAsTemplate(false)
    setPasteOpen(!!preset?.paste && !log)
    setPasteText('')
    setError(null)
    setConfirm(false)
  }, [open, log, preset])

  const pasted = useMemo(() => parseWorkoutNotes(pasteText), [pasteText])
  const previous = useMemo(() => (title.trim() ? lastTime(logs.filter((l) => l.id !== log?.id), title) : undefined), [logs, title, log])
  const titles = useMemo(() => [...new Set([...templates.map((t) => t.title), ...logs.map((l) => l.title)])].slice(0, 30), [templates, logs])

  const copyFrom = (src: { exercises: ExerciseEntry[]; kind: WorkoutKind; duration_min?: number | null }) => {
    setKind(src.kind)
    setExercises(src.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) })))
    if (src.duration_min && !duration) setDuration(String(src.duration_min))
  }

  const setEx = (i: number, p: Partial<ExerciseEntry>) => setExercises((x) => x.map((e, j) => (j === i ? { ...e, ...p } : e)))
  const setSet = (i: number, si: number, field: 'reps' | 'weight', v: string) =>
    setExercises((x) => x.map((e, j) => (j === i ? { ...e, sets: e.sets.map((s, k) => (k === si ? { ...s, [field]: num(v) } : s)) } : e)))

  const submit = async () => {
    if (!title.trim()) return setError('Name the workout, like "Upper body" or "Easy run".')
    const ok = await onSave(
      {
        id: log?.id ?? newId(),
        date,
        kind,
        title: title.trim(),
        version,
        plan_id: log?.plan_id ?? preset?.plan_id ?? null,
        duration_min: num(duration),
        distance_km: hasDistance(kind) ? num(distance) : null,
        exercises: exercises
          .filter((e) => e.name.trim())
          .map((e) => ({ ...e, name: e.name.trim(), sets: e.sets.filter((s) => s.reps != null || s.weight != null) })),
        effort,
        notes: notes.trim() || null,
      },
      asTemplate,
    )
    if (ok) onClose()
  }

  const p = hasDistance(kind) ? pace(num(duration), num(distance)) : null

  return (
    <Sheet open={open} title={log ? 'Edit workout' : 'Log a workout'} onClose={onClose} onSubmit={submit}>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <Chip
            key={k.id}
            selected={kind === k.id}
            onClick={() => {
              setKind(k.id)
              if (hasSets(k.id) && !exercises.length) setExercises([blankExercise()])
            }}
          >
            {k.label}
          </Chip>
        ))}
      </div>

      <FieldLabel>Name</FieldLabel>
      <input id="log-title" list="log-titles" value={title} onChange={(e) => { setTitle(e.target.value); setError(null) }} placeholder="Upper body" className={inputClass} />
      <datalist id="log-titles">
        {titles.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      {(previous || templates.length > 0) && !log && (
        <div className="mt-2 flex flex-wrap gap-2">
          {previous && (
            <button type="button" onClick={() => copyFrom(previous)} className="flex items-center gap-1.5 rounded-full bg-lemon-soft px-3 py-1.5 text-[12px] font-bold text-lemon-ink">
              <Copy size={13} /> Copy last time ({new Date(previous.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
            </button>
          )}
          {templates
            .filter((t) => t.title.trim().toLowerCase() !== title.trim().toLowerCase())
            .slice(0, 6)
            .map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  setTitle(t.title)
                  copyFrom(t)
                }}
                className="rounded-full bg-peri-wash px-3 py-1.5 text-[12px] font-bold text-ink"
              >
                {t.title}
              </button>
            ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Date</span>
          <input id="log-date" type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} className="mt-2 h-11 w-full rounded-btn bg-canvas px-3 text-[15px] font-semibold outline-none ring-1 ring-line" />
        </label>
        <label className="block">
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Minutes</span>
          <input id="log-duration" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value.replace(/[^\d.]/g, ''))} placeholder="45" className="mt-2 h-11 w-full rounded-btn bg-canvas px-3 text-[15px] font-semibold outline-none ring-1 ring-line" />
        </label>
        {hasDistance(kind) && (
          <label className="col-span-2 block">
            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Distance (km)</span>
            <div className="mt-2 flex items-center gap-3">
              <input id="log-distance" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value.replace(/[^\d.]/g, ''))} placeholder="5" className="h-11 w-full rounded-btn bg-canvas px-3 text-[15px] font-semibold outline-none ring-1 ring-line" />
              {p && <span className="shrink-0 text-[13px] font-bold text-ink-soft">{p}</span>}
            </div>
          </label>
        )}
      </div>

      <FieldLabel>Version</FieldLabel>
      <div className="flex gap-2">
        {(['full', 'short', 'recovery'] as const).map((v) => (
          <Chip key={v} selected={version === v} onClick={() => setVersion(version === v ? null : v)}>
            {v[0].toUpperCase() + v.slice(1)}
          </Chip>
        ))}
      </div>

      {hasSets(kind) && (
        <>
          <div className="mb-2 mt-5 flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Exercises</span>
            <button type="button" onClick={() => setPasteOpen((o) => !o)} className="flex items-center gap-1 text-[12px] font-bold text-peri-deep">
              <ClipboardPaste size={14} /> {pasteOpen ? 'Hide paste' : 'Paste from Notes'}
            </button>
          </div>
          {pasteOpen && (
            <div className="mb-3 rounded-2xl bg-peri-wash p-3">
              <textarea
                id="log-paste"
                autoFocus
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={5}
                placeholder={'rope tri pull down 3 x 8 20 lbs\nface pulls 3 x 10 20 lbs\nshoulder press 3x8 17.5lbs'}
                className="w-full rounded-xl bg-white p-3 text-[14px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
              />
              {pasted.exercises.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {pasted.exercises.map((e, i) => (
                    <li key={i} className="text-[12px]">
                      <b>{e.name}</b> <span className="text-ink-soft">· {summarizeSets(e.sets)}</span>
                      {e.notes && <span className="block text-[11px] italic text-ink-faint">{e.notes}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[12px] text-ink-soft">One exercise per line, like "face pulls 3 x 10 20 lbs". Mixed sets work too: "1 x 10 30 lbs 2x10 40lbs".</p>
              )}
              {pasted.leftovers.length > 0 && <p className="mt-2 text-[11px] text-ink-faint">Saved to notes: {pasted.leftovers.join(' · ')}</p>}
              <Button
                type="button"
                variant="primary"
                className="mt-2 h-10 w-full text-[14px]"
                disabled={!pasted.exercises.length}
                onClick={() => {
                  setExercises((x) => [...x.filter((e) => e.name.trim()), ...pasted.exercises])
                  if (!title.trim() && pasted.title) setTitle(pasted.title)
                  if (pasted.leftovers.length) setNotes((n) => [n.trim(), ...pasted.leftovers].filter(Boolean).join('\n'))
                  setPasteText('')
                  setPasteOpen(false)
                }}
              >
                {pasted.exercises.length ? `Add ${pasted.exercises.length} exercises` : 'Add exercises'}
              </Button>
            </div>
          )}
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div key={i} className="rounded-2xl bg-canvas p-3">
                <div className="flex items-center gap-2">
                  <input
                    id={`ex-${i}`}
                    value={ex.name}
                    onChange={(e) => setEx(i, { name: e.target.value })}
                    placeholder="Exercise"
                    className="h-9 min-w-0 flex-1 rounded-lg bg-white px-2.5 text-[14px] font-bold outline-none ring-1 ring-line"
                  />
                  <button type="button" aria-label="Remove exercise" onClick={() => setExercises((x) => x.filter((_, j) => j !== i))} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-white">
                    <X size={16} />
                  </button>
                </div>
                {ex.notes != null && (
                  <input
                    aria-label={`${ex.name || 'Exercise'} note`}
                    value={ex.notes}
                    onChange={(e) => setEx(i, { notes: e.target.value })}
                    className="mt-1.5 h-8 w-full rounded-lg bg-white/70 px-2.5 text-[12px] italic text-ink-soft outline-none ring-1 ring-line"
                  />
                )}
                <div className="mt-2 grid grid-cols-[28px_1fr_1fr_28px] items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>Weight (lb)</span>
                  <span />
                  {ex.sets.map((s, si) => (
                    <div key={si} className="contents">
                      <span className="text-center text-[13px] text-ink-soft">{si + 1}</span>
                      <input aria-label={`Set ${si + 1} reps`} inputMode="numeric" value={s.reps ?? ''} onChange={(e) => setSet(i, si, 'reps', e.target.value.replace(/[^\d]/g, ''))} className="h-9 min-w-0 rounded-lg bg-white px-2 text-[15px] font-semibold normal-case tracking-normal text-ink outline-none ring-1 ring-line" />
                      <input aria-label={`Set ${si + 1} weight`} inputMode="decimal" value={s.weight ?? ''} onChange={(e) => setSet(i, si, 'weight', e.target.value.replace(/[^\d.]/g, ''))} className="h-9 min-w-0 rounded-lg bg-white px-2 text-[15px] font-semibold normal-case tracking-normal text-ink outline-none ring-1 ring-line" />
                      <button type="button" aria-label={`Remove set ${si + 1}`} onClick={() => setEx(i, { sets: ex.sets.filter((_, k) => k !== si) })} className="flex h-8 w-7 items-center justify-center text-ink-faint">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setEx(i, { sets: [...ex.sets, { ...(ex.sets[ex.sets.length - 1] ?? { reps: null, weight: null }) }] })}
                  className="mt-2 text-[12px] font-bold text-peri-deep"
                >
                  + Add set
                </button>
              </div>
            ))}
          </div>
          <Button type="button" className="mt-2 w-full" onClick={() => setExercises((x) => [...x, blankExercise()])}>
            <Plus size={16} /> Add exercise
          </Button>
        </>
      )}

      <FieldLabel>How did it feel</FieldLabel>
      <div className="grid grid-cols-5 gap-1.5">
        {['Easy', 'Light', 'Solid', 'Hard', 'Max'].map((l, i) => (
          <button
            type="button"
            key={l}
            aria-pressed={effort === i + 1}
            onClick={() => setEffort(effort === i + 1 ? null : i + 1)}
            className={cx('h-10 rounded-xl text-[12px] font-bold', effort === i + 1 ? 'bg-peri-deep text-white' : 'bg-canvas text-ink-soft')}
          >
            {l}
          </button>
        ))}
      </div>

      <FieldLabel>Notes</FieldLabel>
      <textarea id="log-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Felt strong on rows. Left knee a little tight." className="w-full rounded-2xl bg-canvas p-3 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri" />

      {hasSets(kind) && (
        <label className="mt-4 flex items-center gap-2 text-[14px] font-semibold">
          <input id="log-as-template" type="checkbox" checked={asTemplate} onChange={(e) => setAsTemplate(e.target.checked)} className="h-5 w-5 accent-[#7484F2]" />
          Save as a template for next time
        </label>
      )}

      <div className="mt-6 flex gap-2">
        {log &&
          (confirm ? (
            <Button
              type="button"
              className="bg-[#FBE7EE] text-[#9C3558] ring-0"
              onClick={() => {
                onDelete(log.id)
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
          {log ? 'Save' : 'Save workout'}
        </Button>
      </div>
    </Sheet>
  )
}
