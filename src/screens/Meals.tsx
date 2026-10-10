import { ArrowLeft, Check, ChevronLeft, ChevronRight, Heart, Plus, Snowflake, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { FieldLabel, Sheet, inputClass } from '../components/Sheet'
import { Button, Card, Chip, SectionTitle, cx } from '../components/ui'
import { addDays, dayLabel, today } from '../lib/dates'
import { newId, store } from '../lib/store'
import type { GroceryItem, Meal, MealKind, MealPlanEntry, MealSlot } from '../lib/types'
import { mondayOf } from '../lib/useWeek'

const SLOTS: MealSlot[] = ['lunch', 'dinner']
const KINDS: MealKind[] = ['breakfast', 'lunch', 'dinner', 'snack']
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export default function Meals({ onBack }: { onBack: () => void }) {
  const t0 = today()
  const [weekStart, setWeekStart] = useState(mondayOf(t0))
  const [meals, setMeals] = useState<Meal[]>([])
  const [plan, setPlan] = useState<MealPlanEntry[]>([])
  const [groceries, setGroceries] = useState<GroceryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pick, setPick] = useState<{ date: string; slot: MealSlot } | null>(null)
  const [mealSheet, setMealSheet] = useState<{ open: boolean; meal: Meal | null }>({ open: false, meal: null })
  const [newItem, setNewItem] = useState('')

  const run = async <T,>(fn: () => Promise<T>) => {
    try {
      return await fn()
    } catch (e) {
      setError((e as Error).message)
      return null
    }
  }

  const load = useCallback(async () => {
    await run(async () => {
      const [m, p, g] = await Promise.all([store.meals.list(), store.listMealPlan(weekStart, addDays(weekStart, 6)), store.groceries.list()])
      setMeals(m)
      setPlan(p)
      setGroceries(g)
    })
  }, [weekStart])

  useEffect(() => {
    load()
  }, [load])

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const entry = (date: string, slot: MealSlot) => plan.find((p) => p.date === date && p.slot === slot)
  const nameOf = (e?: MealPlanEntry) => (e ? meals.find((m) => m.id === e.meal_id)?.name ?? e.label ?? '' : '')

  const setSlot = async (date: string, slot: MealSlot, meal_id: string | null, label: string | null) => {
    const row = await run(() => store.setMealPlan({ date, slot, meal_id, label, prepped: false }))
    setPlan((p) => [...p.filter((x) => !(x.date === date && x.slot === slot)), ...(row ? [row] : [])])
  }
  const togglePrepped = async (e: MealPlanEntry) => {
    const next = { ...e, prepped: !e.prepped }
    setPlan((p) => p.map((x) => (x.id === e.id ? next : x)))
    await run(() => store.setMealPlan({ date: e.date, slot: e.slot, meal_id: e.meal_id, label: e.label, prepped: next.prepped }))
  }
  const saveMeal = async (m: Meal) => {
    const row = await run(() => store.meals.save(m))
    if (row) setMeals((x) => [row, ...x.filter((y) => y.id !== row.id)])
    return row
  }
  const addGrocery = async () => {
    const name = newItem.trim()
    if (!name) return
    setNewItem('')
    const row = await run(() => store.groceries.save({ id: newId(), name, category: null, checked: false }))
    if (row) setGroceries((g) => [row, ...g])
  }
  const toggleGrocery = async (g: GroceryItem) => {
    const next = { ...g, checked: !g.checked }
    setGroceries((x) => x.map((y) => (y.id === g.id ? next : y)))
    await run(() => store.groceries.save(next))
  }
  const clearChecked = async () => {
    const done = groceries.filter((g) => g.checked)
    setGroceries((x) => x.filter((g) => !g.checked))
    for (const g of done) await run(() => store.groceries.remove(g.id))
  }

  const sortedMeals = [...meals].sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name))
  const backups = sortedMeals.filter((m) => m.is_backup)
  const notSetUp = error && /relation|does not exist|schema cache/i.test(error)

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2 px-1 pt-2">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="text-[13px] font-semibold text-ink-soft">Lunches, dinners, and groceries</div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Meals</h1>
        </div>
      </header>

      {error && (
        <Card tone="lilac" className="flex items-start gap-3">
          <p className="flex-1 text-[13px] font-semibold">{error}{notSetUp ? ' Run the Phase 4 setup file in Supabase to turn on meals.' : ''}</p>
          <button onClick={() => setError(null)} className="text-[13px] font-bold text-peri-deep">OK</button>
        </Card>
      )}

      <div className="flex items-center justify-between px-1">
        <button aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft">
          <ChevronLeft size={18} />
        </button>
        <span className="text-[14px] font-bold">{weekStart === mondayOf(t0) ? 'This week' : weekStart === addDays(mondayOf(t0), 7) ? 'Next week' : `Week of ${dayLabel(weekStart)}`}</span>
        <button aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft">
          <ChevronRight size={18} />
        </button>
      </div>

      <Card className="px-2 py-1">
        {days.map((d) => (
          <div key={d} className={cx('border-b border-line px-2 py-2.5 last:border-0', d === t0 && 'rounded-xl bg-peri-wash/60')}>
            <div className={cx('text-[12px] font-bold', d === t0 ? 'text-peri-deep' : 'text-ink-soft')}>{dayLabel(d)}</div>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {SLOTS.map((slot) => {
                const e = entry(d, slot)
                return (
                  <div key={slot} className="flex min-w-0 items-center gap-1.5">
                    <button onClick={() => setPick({ date: d, slot })} className={cx('min-w-0 flex-1 rounded-xl px-2.5 py-2 text-left', e ? 'bg-lemon-soft' : 'bg-canvas')}>
                      <span className="block text-[10px] font-bold uppercase tracking-[0.06em] text-ink-faint">{slot}</span>
                      <span className={cx('block truncate text-[13px] font-semibold', !e && 'text-ink-faint')}>{e ? nameOf(e) : 'Add'}</span>
                    </button>
                    {e && slot === 'lunch' && (
                      <button onClick={() => togglePrepped(e)} aria-pressed={e.prepped} aria-label="Prepped" title="Prepped" className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', e.prepped ? 'bg-lemon-deep' : 'ring-2 ring-line')}>
                        {e.prepped && <Check size={14} strokeWidth={3} />}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </Card>
      <p className="px-1 text-[12px] text-ink-faint">Tap the circle next to a lunch once it's prepped or packed.</p>

      <SectionTitle
        title="Grocery list"
        action={groceries.some((g) => g.checked) ? <button onClick={clearChecked} className="text-[13px] font-bold text-peri-deep">Clear checked</button> : undefined}
      />
      <Card className="px-2 py-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addGrocery()
          }}
          className="flex gap-2 px-1 pb-1"
        >
          <input id="grocery-new" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add an item" className="h-11 min-w-0 flex-1 rounded-btn bg-canvas px-4 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri" />
          <Button type="submit" aria-label="Add item">
            <Plus size={18} />
          </Button>
        </form>
        {groceries.length === 0 && <p className="px-2 py-2 text-[13px] text-ink-faint">Nothing on the list yet.</p>}
        {[...groceries].sort((a, b) => Number(a.checked) - Number(b.checked)).map((g) => (
          <button key={g.id} onClick={() => toggleGrocery(g)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-canvas">
            <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-lg', g.checked ? 'bg-lemon-deep' : 'ring-2 ring-peri-soft')}>{g.checked && <Check size={14} strokeWidth={3} />}</span>
            <span className={cx('text-[15px] font-semibold', g.checked && 'text-ink-faint line-through')}>{g.name}</span>
          </button>
        ))}
      </Card>

      <SectionTitle
        title="My meals"
        action={
          <button onClick={() => setMealSheet({ open: true, meal: null })} className="flex items-center gap-1 text-[13px] font-bold text-peri-deep">
            <Plus size={16} /> Meal
          </button>
        }
      />
      {meals.length === 0 ? (
        <button onClick={() => setMealSheet({ open: true, meal: null })} className="w-full rounded-card border-2 border-dashed border-line px-4 py-4 text-left text-[13px] text-ink-soft">
          Save meals you make often, plus freezer and pantry backups for busy days.
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedMeals.map((m) => (
            <button key={m.id} onClick={() => setMealSheet({ open: true, meal: m })} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold shadow-soft">
              {m.favorite && <Heart size={12} className="fill-[#E58AA8] text-[#E58AA8]" />}
              {m.is_backup && <Snowflake size={12} className="text-peri-deep" />}
              {m.name}
            </button>
          ))}
        </div>
      )}
      {backups.length > 0 && <p className="px-1 text-[12px] text-ink-faint">Snowflake = freezer or pantry backup for when plans fall through.</p>}
      <div className="h-6" />

      <PickSheet
        open={!!pick}
        title={pick ? `${cap(pick.slot)} · ${dayLabel(pick.date)}` : ''}
        meals={sortedMeals}
        current={pick ? entry(pick.date, pick.slot) : undefined}
        onClose={() => setPick(null)}
        onPick={async (mealId, label) => {
          if (pick) await setSlot(pick.date, pick.slot, mealId, label)
          setPick(null)
        }}
      />
      <MealSheet
        open={mealSheet.open}
        meal={mealSheet.meal}
        onClose={() => setMealSheet((s) => ({ ...s, open: false }))}
        onSave={async (m) => !!(await saveMeal(m))}
        onDelete={async (id) => {
          setMeals((x) => x.filter((m) => m.id !== id))
          await run(() => store.meals.remove(id))
        }}
      />
    </div>
  )
}

function PickSheet({
  open, title, meals, current, onClose, onPick,
}: { open: boolean; title: string; meals: Meal[]; current?: MealPlanEntry; onClose: () => void; onPick: (mealId: string | null, label: string | null) => void }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    if (open) setLabel(current && !current.meal_id ? current.label ?? '' : '')
  }, [open, current])
  return (
    <Sheet open={open} title={title} onClose={onClose} onSubmit={() => label.trim() && onPick(null, label.trim())}>
      <div className="flex gap-2">
        <input id="meal-oneoff" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Family dinner, eating out…" className={inputClass} />
        <Button type="submit" variant="primary" aria-label="Use this">
          <Check size={18} />
        </Button>
      </div>
      {meals.length > 0 && (
        <>
          <FieldLabel>My meals</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {meals.map((m) => (
              <Chip key={m.id} selected={current?.meal_id === m.id} onClick={() => onPick(m.id, null)}>
                {m.name}
                {m.is_backup ? ' · backup' : ''}
              </Chip>
            ))}
          </div>
        </>
      )}
      {current && (
        <Button type="button" className="mt-5 w-full" onClick={() => onPick(null, null)}>
          <X size={16} /> Clear
        </Button>
      )}
    </Sheet>
  )
}

function MealSheet({ open, meal, onClose, onSave, onDelete }: { open: boolean; meal: Meal | null; onClose: () => void; onSave: (m: Meal) => Promise<boolean>; onDelete: (id: string) => void }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<MealKind>('lunch')
  const [notes, setNotes] = useState('')
  const [backup, setBackup] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    if (!open) return
    setName(meal?.name ?? '')
    setKind(meal?.kind ?? 'lunch')
    setNotes(meal?.notes ?? '')
    setBackup(meal?.is_backup ?? false)
    setFavorite(meal?.favorite ?? false)
    setError(null)
    setConfirm(false)
  }, [open, meal])
  const submit = async () => {
    if (!name.trim()) return setError('Name the meal.')
    if (await onSave({ id: meal?.id ?? newId(), name: name.trim(), kind, notes: notes.trim() || null, is_backup: backup, favorite })) onClose()
  }
  return (
    <Sheet open={open} title={meal ? 'Edit meal' : 'Save a meal'} onClose={onClose} onSubmit={submit}>
      <input id="meal-name" value={name} onChange={(e) => { setName(e.target.value); setError(null) }} placeholder="Chicken burrito bowl" className={inputClass} />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}
      <FieldLabel>Usually for</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>
            {cap(k)}
          </Chip>
        ))}
      </div>
      <FieldLabel>Notes</FieldLabel>
      <input id="meal-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Makes 4 lunches · good protein" className={inputClass} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip selected={backup} onClick={() => setBackup((b) => !b)}>
          Freezer or pantry backup
        </Chip>
        <Chip selected={favorite} onClick={() => setFavorite((f) => !f)}>
          Favorite
        </Chip>
      </div>
      <div className="mt-6 flex gap-2">
        {meal &&
          (confirm ? (
            <Button type="button" className="bg-[#FBE7EE] text-[#9C3558] ring-0" onClick={() => { onDelete(meal.id); onClose() }}>
              Delete
            </Button>
          ) : (
            <Button type="button" variant="ghost" aria-label="Delete meal" onClick={() => setConfirm(true)}>
              <Trash2 size={18} />
            </Button>
          ))}
        <Button type="submit" variant="primary" className="flex-1">
          Save meal
        </Button>
      </div>
    </Sheet>
  )
}
