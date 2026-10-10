import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { addDays, today } from '../lib/dates'
import { CATEGORIES, suggestedSeason, THEMES } from '../lib/seasons'
import { newId } from '../lib/store'
import type { Goal, Habit, Milestone, Season, SeasonTheme } from '../lib/types'
import { FieldLabel, Sheet, inputClass } from './Sheet'
import { Button, Chip, cx } from './ui'

const dateInput = 'h-11 w-full rounded-btn bg-canvas px-3 text-[15px] font-semibold outline-none ring-1 ring-line focus:ring-2 focus:ring-peri'

function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [confirm, setConfirm] = useState(false)
  return confirm ? (
    <Button type="button" className="bg-[#FBE7EE] text-[#9C3558] ring-0" onClick={onConfirm}>
      {label}
    </Button>
  ) : (
    <Button type="button" variant="ghost" aria-label={label} onClick={() => setConfirm(true)}>
      <Trash2 size={18} />
    </Button>
  )
}

/* ---------- Season ---------- */
type SeasonProps = {
  open: boolean
  season: Season | null
  onClose: () => void
  onSave: (s: Season) => Promise<boolean>
  onDelete: (id: string) => void
}

export function SeasonSheet({ open, season, onClose, onSave, onDelete }: SeasonProps) {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState<SeasonTheme>('peri')
  const [start, setStart] = useState(today())
  const [end, setEnd] = useState(addDays(today(), 55))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const sug = suggestedSeason(today())
    setName(season?.name ?? sug.name)
    setTheme((season?.theme as SeasonTheme) ?? 'peri')
    setStart(season?.start_date ?? sug.start_date)
    setEnd(season?.end_date ?? sug.end_date)
    setNotes(season?.notes ?? '')
    setError(null)
  }, [open, season])

  const lengths = [4, 6, 8, 12]
  const submit = async () => {
    if (!name.trim()) return setError('Give your season a name.')
    if (end < start) return setError('The end date needs to be after the start date.')
    const ok = await onSave({
      id: season?.id ?? newId(),
      name: name.trim(),
      theme,
      start_date: start,
      end_date: end,
      notes: notes.trim() || null,
      reflection: season?.reflection ?? null,
    })
    if (ok) onClose()
  }

  return (
    <Sheet open={open} title={season ? 'Edit season' : 'New season'} onClose={onClose} onSubmit={submit}>
      <input id="season-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Fall Reset" className={inputClass} />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      <FieldLabel>Color</FieldLabel>
      <div className="flex gap-2">
        {(Object.keys(THEMES) as SeasonTheme[]).map((k) => (
          <button
            type="button"
            key={k}
            aria-label={THEMES[k].label}
            aria-pressed={theme === k}
            onClick={() => setTheme(k)}
            className={cx('h-11 flex-1 rounded-2xl', THEMES[k].soft, theme === k ? 'ring-2 ring-ink ring-offset-2' : '')}
          />
        ))}
      </div>

      <FieldLabel>Dates</FieldLabel>
      <div className="flex items-center gap-2">
        <input id="season-start" type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} className={dateInput} />
        <span className="text-ink-soft">to</span>
        <input id="season-end" type="date" value={end} min={start} onChange={(e) => e.target.value && setEnd(e.target.value)} className={dateInput} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {lengths.map((w) => (
          <Chip key={w} selected={end === addDays(start, w * 7 - 1)} onClick={() => setEnd(addDays(start, w * 7 - 1))}>
            {w} weeks
          </Chip>
        ))}
      </div>

      <FieldLabel>Why this season (optional)</FieldLabel>
      <textarea
        id="season-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="Get back into a rhythm before the holidays."
        className="w-full rounded-2xl bg-canvas p-3 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
      />

      <div className="mt-6 flex gap-2">
        {season && (
          <DeleteButton
            label="Delete season"
            onConfirm={() => {
              onDelete(season.id)
              onClose()
            }}
          />
        )}
        <Button type="submit" variant="primary" className="flex-1">
          {season ? 'Save' : 'Start season'}
        </Button>
      </div>
    </Sheet>
  )
}

/* ---------- Goal ---------- */
type GoalProps = {
  open: boolean
  goal: Goal | null
  seasonId: string | null
  habits: Habit[]
  nextOrder: number
  onClose: () => void
  onSave: (g: Goal) => Promise<boolean>
  onDelete: (id: string) => void
}

export function GoalSheet({ open, goal, seasonId, habits, nextOrder, onClose, onSave, onDelete }: GoalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [target, setTarget] = useState('')
  const [description, setDescription] = useState('')
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [newMilestone, setNewMilestone] = useState('')
  const [habitIds, setHabitIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(goal?.title ?? '')
    setCategory(goal?.category ?? null)
    setTarget(goal?.target_date ?? '')
    setDescription(goal?.description ?? '')
    setMilestones(goal ? [...goal.milestones].sort((a, b) => a.sort_order - b.sort_order) : [])
    setHabitIds(goal?.habit_ids ?? [])
    setNewMilestone('')
    setError(null)
  }, [open, goal])

  const addMilestone = () => {
    if (!newMilestone.trim()) return
    setMilestones((m) => [...m, { id: newId(), title: newMilestone.trim(), due_date: null, done_at: null, sort_order: m.length }])
    setNewMilestone('')
  }

  const submit = async () => {
    if (!title.trim()) return setError('Give your goal a name.')
    const pending = newMilestone.trim()
    const all = pending ? [...milestones, { id: newId(), title: pending, due_date: null, done_at: null, sort_order: milestones.length }] : milestones
    const ok = await onSave({
      id: goal?.id ?? newId(),
      season_id: goal?.season_id ?? seasonId,
      title: title.trim(),
      description: description.trim() || null,
      category,
      target_date: target || null,
      notes: goal?.notes ?? null,
      completed_at: goal?.completed_at ?? null,
      sort_order: goal?.sort_order ?? nextOrder,
      milestones: all.filter((m) => m.title.trim()).map((m, i) => ({ ...m, sort_order: i })),
      habit_ids: habitIds,
    })
    if (ok) onClose()
  }

  return (
    <Sheet open={open} title={goal ? 'Edit goal' : 'New goal'} onClose={onClose} onSubmit={submit}>
      <input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Do 10 strict pull-ups" className={inputClass} />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      <FieldLabel>Category</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip key={c} selected={category === c} onClick={() => setCategory(category === c ? null : c)}>
            {c}
          </Chip>
        ))}
      </div>

      <FieldLabel>Milestones</FieldLabel>
      <p className="-mt-1 mb-2 text-[12px] text-ink-soft">Small steps you can check off. Each one earns 15 XP.</p>
      <ul className="space-y-1.5">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-center gap-1 rounded-2xl bg-canvas px-2 py-1">
            <input
              id={`ms-${m.id}`}
              value={m.title}
              onChange={(e) => setMilestones((x) => x.map((y) => (y.id === m.id ? { ...y, title: e.target.value } : y)))}
              className={cx('h-9 min-w-0 flex-1 bg-transparent px-2 text-[14px] font-semibold outline-none', m.done_at && 'text-ink-faint line-through')}
            />
            <button type="button" aria-label="Remove milestone" onClick={() => setMilestones((x) => x.filter((y) => y.id !== m.id))} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-white">
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          id="new-milestone"
          value={newMilestone}
          onChange={(e) => setNewMilestone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addMilestone()
            }
          }}
          placeholder="5 negatives in a row"
          className="h-11 min-w-0 flex-1 rounded-btn bg-white px-4 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
        />
        <Button type="button" onClick={addMilestone} aria-label="Add milestone">
          <Plus size={18} />
        </Button>
      </div>

      {habits.length > 0 && (
        <>
          <FieldLabel>Habits that build this</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {habits.map((h) => (
              <Chip key={h.id} selected={habitIds.includes(h.id)} onClick={() => setHabitIds((ids) => (ids.includes(h.id) ? ids.filter((x) => x !== h.id) : [...ids, h.id]))}>
                {h.title}
              </Chip>
            ))}
          </div>
        </>
      )}

      <FieldLabel>Target date (optional)</FieldLabel>
      <input id="goal-target" type="date" value={target} onChange={(e) => setTarget(e.target.value)} className={dateInput} />

      <FieldLabel>Notes (optional)</FieldLabel>
      <textarea
        id="goal-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Why this matters to me"
        className="w-full rounded-2xl bg-canvas p-3 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
      />

      <div className="mt-6 flex gap-2">
        {goal && (
          <DeleteButton
            label="Delete goal"
            onConfirm={() => {
              onDelete(goal.id)
              onClose()
            }}
          />
        )}
        <Button type="submit" variant="primary" className="flex-1">
          {goal ? 'Save' : 'Add goal'}
        </Button>
      </div>
    </Sheet>
  )
}
