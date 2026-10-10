import { Check, Dumbbell, Moon, Plus, Shirt } from 'lucide-react'
import { useEffect, useState } from 'react'
import { addDays, today } from '../lib/dates'
import { store } from '../lib/store'
import type { ClosetItem, WorkoutPlan } from '../lib/types'
import { useCloset } from '../lib/useCloset'
import { Collage, OutfitSheet, PlanDaySheet } from './ClosetParts'
import { Card, Eyebrow, cx } from './ui'

// Today's outfit on Home, plus a night-before card in the evening.
export default function OutfitToday({ onOpenCloset }: { onOpenCloset: () => void }) {
  const t0 = today()
  const t1 = addDays(t0, 1)
  const c = useCloset(t0, t1)
  const [planFor, setPlanFor] = useState<string | null>(null)
  const [build, setBuild] = useState<string | null>(null)
  const [tomorrowWorkout, setTomorrowWorkout] = useState<WorkoutPlan | null>(null)
  const evening = new Date().getHours() >= 17

  useEffect(() => {
    if (evening) store.listWorkouts(t1, t1).then((w) => setTomorrowWorkout(w[0] ?? null)).catch(() => {})
  }, [evening, t1])

  if (c.loading || c.error) return null
  const itemsFor = (id?: string) => {
    const o = c.outfits.find((x) => x.id === id)
    return o ? o.item_ids.map((i) => c.items.find((x) => x.id === i)).filter((x): x is ClosetItem => !!x) : []
  }
  const todayDay = c.days.find((d) => d.date === t0)
  const tomorrowDay = c.days.find((d) => d.date === t1)
  const todayOutfit = c.outfits.find((o) => o.id === todayDay?.outfit_id)
  const tomorrowOutfit = c.outfits.find((o) => o.id === tomorrowDay?.outfit_id)

  if (!c.items.length)
    return (
      <button onClick={onOpenCloset} className="flex w-full items-center gap-3 rounded-card bg-white p-4 text-left shadow-soft">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lilac">
          <Shirt size={18} />
        </span>
        <span>
          <span className="block text-[14px] font-bold">Outfit of the day</span>
          <span className="block text-[12px] text-ink-soft">Add a few clothes in My Closet to start planning outfits.</span>
        </span>
      </button>
    )

  return (
    <>
      <Card className="flex items-center gap-3">
        <button onClick={() => setPlanFor(t0)} className="shrink-0">
          {todayOutfit ? (
            <Collage items={itemsFor(todayOutfit.id)} urlFor={c.url} className="h-24 w-[72px] bg-canvas p-1" />
          ) : (
            <span className="flex h-24 w-[72px] items-center justify-center rounded-2xl border-2 border-dashed border-line text-ink-faint">
              <Plus size={20} />
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <Eyebrow>Outfit of the day</Eyebrow>
          <p className="mt-0.5 truncate text-[15px] font-bold">{todayOutfit ? todayOutfit.name || todayOutfit.occasion || 'Planned' : 'Nothing planned'}</p>
          {todayDay ? (
            <button
              onClick={() => c.setWorn(todayDay, !todayDay.worn)}
              className={cx('mt-2 flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-bold', todayDay.worn ? 'bg-lemon text-lemon-ink' : 'bg-canvas text-ink-soft')}
            >
              {todayDay.worn && <Check size={13} strokeWidth={3} />} {todayDay.worn ? 'Wore it' : 'Mark as worn'}
            </button>
          ) : (
            <button onClick={() => setPlanFor(t0)} className="mt-1 text-[13px] font-bold text-peri-deep">
              Pick today's outfit
            </button>
          )}
        </div>
      </Card>

      {evening && (
        <Card tone="lilac">
          <div className="flex items-center gap-2">
            <Moon size={16} className="text-ink-soft" />
            <Eyebrow>Getting ready for tomorrow</Eyebrow>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={() => setPlanFor(t1)} className="shrink-0">
              {tomorrowOutfit ? (
                <Collage items={itemsFor(tomorrowOutfit.id)} urlFor={c.url} className="h-20 w-[60px] bg-white p-1" />
              ) : (
                <span className="flex h-20 w-[60px] items-center justify-center rounded-2xl border-2 border-dashed border-lilac-deep/50 text-ink-soft">
                  <Plus size={18} />
                </span>
              )}
            </button>
            <ul className="min-w-0 flex-1 space-y-1.5 text-[13px]">
              <li className="flex items-center gap-2">
                <Shirt size={14} className="shrink-0 text-ink-soft" />
                {tomorrowOutfit ? <span className="truncate">Outfit: <b>{tomorrowOutfit.name || tomorrowOutfit.occasion || 'planned'}</b></span> : <button onClick={() => setPlanFor(t1)} className="font-bold text-peri-deep">Plan tomorrow's outfit</button>}
              </li>
              {tomorrowWorkout && (
                <li className="flex items-center gap-2">
                  <Dumbbell size={14} className="shrink-0 text-ink-soft" />
                  <span className="truncate">Pack gym clothes: <b>{tomorrowWorkout.full_title}</b></span>
                </li>
              )}
            </ul>
          </div>
        </Card>
      )}

      <PlanDaySheet
        open={!!planFor}
        label={planFor === t0 ? 'today' : 'tomorrow'}
        outfits={c.outfits}
        items={c.items}
        urlFor={c.url}
        currentId={c.days.find((d) => d.date === planFor)?.outfit_id ?? null}
        onClose={() => setPlanFor(null)}
        onPick={(id) => planFor && c.planDay(planFor, id)}
        onBuild={() => {
          setBuild(planFor)
          setPlanFor(null)
        }}
      />
      <OutfitSheet
        open={!!build}
        outfit={null}
        items={c.items}
        urlFor={c.url}
        onClose={() => setBuild(null)}
        onSave={async (o) => {
          const saved = await c.saveOutfit(o)
          if (saved && build) await c.planDay(build, saved.id)
          return saved
        }}
        onDelete={c.deleteOutfit}
      />
    </>
  )
}
