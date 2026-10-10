import { motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Heart, Plus, Shirt } from 'lucide-react'
import { useMemo, useState } from 'react'
import Celebration from '../components/Celebration'
import { Collage, ItemPhoto, ItemSheet, OutfitSheet, PlanDaySheet } from '../components/ClosetParts'
import { Button, Card, Chip, SectionTitle, cx } from '../components/ui'
import { CATEGORIES, OCCASIONS } from '../lib/closet'
import { addDays, dayLabel, fromDay, today } from '../lib/dates'
import type { ClosetItem, Outfit } from '../lib/types'
import { useCloset } from '../lib/useCloset'
import { mondayOf } from '../lib/useWeek'

type Tab = 'closet' | 'outfits' | 'calendar'

export default function Closet() {
  const c = useCloset()
  const t0 = today()
  const [tab, setTab] = useState<Tab>('closet')
  const [cat, setCat] = useState<string | null>(null)
  const [occ, setOcc] = useState<string | null>(null)
  const [itemSheet, setItemSheet] = useState<{ open: boolean; item: ClosetItem | null; isNew: boolean }>({ open: false, item: null, isNew: false })
  const [outfitSheet, setOutfitSheet] = useState<{ open: boolean; outfit: Outfit | null; forDate?: string }>({ open: false, outfit: null })
  const [planFor, setPlanFor] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState(mondayOf(t0))

  const itemsFor = (o: Outfit) => o.item_ids.map((id) => c.items.find((i) => i.id === id)).filter((i): i is ClosetItem => !!i)
  const shownItems = useMemo(() => c.items.filter((i) => !cat || (cat === 'fav' ? i.favorite : i.category === cat)), [c.items, cat])
  const shownOutfits = useMemo(() => c.outfits.filter((o) => !occ || (occ === 'fav' ? o.favorite : o.occasion === occ)), [c.outfits, occ])
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const worn = [...c.days].filter((d) => d.worn).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const notSetUp = c.error && /relation|does not exist|schema cache|bucket/i.test(c.error)

  return (
    <div className="space-y-3">
      <header className="flex items-end justify-between px-1 pb-1 pt-2">
        <div>
          <div className="text-[13px] font-semibold text-ink-soft">Clothes, outfits, and plans</div>
          <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">My Closet</h1>
        </div>
        <button
          onClick={() => (tab === 'closet' ? setItemSheet({ open: true, item: c.newItem(), isNew: true }) : setOutfitSheet({ open: true, outfit: null }))}
          className="flex h-10 items-center gap-1 rounded-full bg-peri-deep px-4 text-[13px] font-bold text-white"
        >
          <Plus size={16} /> {tab === 'closet' ? 'Clothing' : 'Outfit'}
        </button>
      </header>

      {c.error && (
        <Card tone="lilac" className="flex items-start gap-3">
          <p className="flex-1 text-[13px] font-semibold">
            {c.error}
            {notSetUp ? ' The closet may not be set up yet. Run the Phase 2–3 setup file in Supabase.' : ''}
          </p>
          <button onClick={c.clearError} className="text-[13px] font-bold text-peri-deep">OK</button>
        </Card>
      )}

      <div className="flex rounded-full bg-white p-1 shadow-soft">
        {(['closet', 'outfits', 'calendar'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx('relative flex-1 rounded-full py-2 text-[14px] font-bold capitalize', tab === t ? 'text-ink' : 'text-ink-soft')}>
            {tab === t && <motion.span layoutId="closet-tab" className="absolute inset-0 rounded-full bg-peri-wash" />}
            <span className="relative">{t === 'closet' ? `Closet · ${c.items.length}` : t === 'outfits' ? `Outfits · ${c.outfits.length}` : 'Calendar'}</span>
          </button>
        ))}
      </div>

      {/* ---------- Closet ---------- */}
      {tab === 'closet' && (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
            <Chip selected={!cat} onClick={() => setCat(null)}>All</Chip>
            <Chip selected={cat === 'fav'} onClick={() => setCat('fav')}>Favorites</Chip>
            {CATEGORIES.filter((x) => c.items.some((i) => i.category === x.id)).map((x) => (
              <Chip key={x.id} selected={cat === x.id} onClick={() => setCat(x.id)}>
                {x.label}
              </Chip>
            ))}
          </div>
          {!c.loading && c.items.length === 0 ? (
            <Card className="flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac">
                <Shirt size={24} />
              </div>
              <p className="text-[17px] font-bold">Start your digital closet</p>
              <p className="mt-1.5 max-w-xs text-[14px] text-ink-soft">Snap your favorite pieces first. A plain wall or bed works great as a background.</p>
              <Button variant="primary" className="mt-4" onClick={() => setItemSheet({ open: true, item: c.newItem(), isNew: true })}>
                <Plus size={18} /> Add clothing
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {shownItems.map((i) => (
                <button key={i.id} onClick={() => setItemSheet({ open: true, item: i, isNew: false })} className="overflow-hidden rounded-card bg-white text-left shadow-soft">
                  <ItemPhoto item={i} url={c.url(i)} className="aspect-square" />
                  <span className="flex items-center gap-1 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{i.name}</span>
                    {i.favorite && <Heart size={13} className="shrink-0 fill-[#E58AA8] text-[#E58AA8]" />}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------- Outfits ---------- */}
      {tab === 'outfits' && (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
            <Chip selected={!occ} onClick={() => setOcc(null)}>All</Chip>
            <Chip selected={occ === 'fav'} onClick={() => setOcc('fav')}>Favorites</Chip>
            {OCCASIONS.filter((o) => c.outfits.some((x) => x.occasion === o)).map((o) => (
              <Chip key={o} selected={occ === o} onClick={() => setOcc(o)}>
                {o}
              </Chip>
            ))}
          </div>
          {c.outfits.length === 0 ? (
            <Card className="px-6 py-8 text-center">
              <p className="text-[17px] font-bold">Build your first outfit</p>
              <p className="mt-1.5 text-[14px] text-ink-soft">{c.items.length ? 'Combine real pieces from your closet into a look you can reuse.' : 'Add a few pieces to your closet first.'}</p>
              <Button variant="primary" className="mt-4" onClick={() => (c.items.length ? setOutfitSheet({ open: true, outfit: null }) : setTab('closet'))}>
                {c.items.length ? 'Build an outfit' : 'Go to closet'}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {shownOutfits.map((o) => (
                <button key={o.id} onClick={() => setOutfitSheet({ open: true, outfit: o })} className="overflow-hidden rounded-card bg-white p-2 text-left shadow-soft">
                  <Collage items={itemsFor(o)} urlFor={c.url} className="aspect-[3/4] bg-canvas" />
                  <span className="flex items-center gap-1 px-1 pt-2">
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{o.name || o.occasion || 'Outfit'}</span>
                    {o.favorite && <Heart size={13} className="shrink-0 fill-[#E58AA8] text-[#E58AA8]" />}
                  </span>
                  {o.name && o.occasion && <span className="block truncate px-1 text-[11px] text-ink-soft">{o.occasion}</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------- Calendar ---------- */}
      {tab === 'calendar' && (
        <>
          <div className="flex items-center justify-between px-1">
            <button aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft">
              <ChevronLeft size={18} />
            </button>
            <span className="text-[14px] font-bold">
              {weekStart === mondayOf(t0) ? 'This week' : `Week of ${fromDay(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </span>
            <button aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft">
              <ChevronRight size={18} />
            </button>
          </div>
          <p className="px-1 text-[12px] text-ink-soft">
            {week.filter((d) => c.days.some((x) => x.date === d)).length} of 7 days planned. Plan the whole week to unlock an achievement.
          </p>
          <div className="space-y-2">
            {week.map((d) => {
              const day = c.days.find((x) => x.date === d)
              const o = day ? c.outfits.find((x) => x.id === day.outfit_id) : undefined
              return (
                <div key={d} className={cx('flex items-center gap-3 rounded-card p-2.5', d === t0 ? 'bg-peri-wash' : 'bg-white shadow-soft')}>
                  <button onClick={() => setPlanFor(d)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    {o ? (
                      <Collage items={itemsFor(o)} urlFor={c.url} className="h-20 w-16 shrink-0 bg-canvas p-1" />
                    ) : (
                      <span className="flex h-20 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-line text-ink-faint">
                        <Plus size={18} />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className={cx('block text-[12px] font-bold', d === t0 ? 'text-peri-deep' : 'text-ink-soft')}>{dayLabel(d)}</span>
                      <span className="block truncate text-[15px] font-bold">{o ? o.name || o.occasion || 'Outfit' : 'Plan an outfit'}</span>
                    </span>
                  </button>
                  {day && d <= t0 && (
                    <button
                      onClick={() => c.setWorn(day, !day.worn)}
                      aria-pressed={day.worn}
                      className={cx('flex h-9 items-center gap-1 rounded-full px-3 text-[12px] font-bold', day.worn ? 'bg-lemon text-lemon-ink' : 'bg-canvas text-ink-soft')}
                    >
                      {day.worn && <Check size={14} strokeWidth={3} />} {day.worn ? 'Worn' : 'Wore it?'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {worn.length > 0 && (
            <>
              <SectionTitle title="Recently worn" />
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                {worn.map((w) => {
                  const o = c.outfits.find((x) => x.id === w.outfit_id)
                  if (!o) return null
                  return (
                    <button key={w.id} onClick={() => setOutfitSheet({ open: true, outfit: o })} className="w-24 shrink-0 text-left">
                      <Collage items={itemsFor(o)} urlFor={c.url} className="aspect-[3/4] bg-white p-1 shadow-soft" />
                      <span className="mt-1 block text-[11px] font-semibold text-ink-soft">{dayLabel(w.date)}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
      <div className="h-6" />

      <ItemSheet
        open={itemSheet.open}
        item={itemSheet.item}
        isNew={itemSheet.isNew}
        url={c.url(itemSheet.item ?? undefined)}
        onClose={() => setItemSheet((s) => ({ ...s, open: false }))}
        onSave={c.saveItem}
        onDelete={c.deleteItem}
      />
      <OutfitSheet
        open={outfitSheet.open}
        outfit={outfitSheet.outfit}
        items={c.items}
        urlFor={c.url}
        onClose={() => setOutfitSheet((s) => ({ ...s, open: false }))}
        onSave={async (o) => {
          const saved = await c.saveOutfit(o)
          if (saved && outfitSheet.forDate) await c.planDay(outfitSheet.forDate, saved.id)
          return saved
        }}
        onDelete={c.deleteOutfit}
      />
      <PlanDaySheet
        open={!!planFor}
        label={planFor ? dayLabel(planFor) : ''}
        outfits={c.outfits}
        items={c.items}
        urlFor={c.url}
        currentId={c.days.find((d) => d.date === planFor)?.outfit_id ?? null}
        onClose={() => setPlanFor(null)}
        onPick={(id) => planFor && c.planDay(planFor, id)}
        onBuild={() => {
          const d = planFor
          setPlanFor(null)
          setOutfitSheet({ open: true, outfit: null, forDate: d ?? undefined })
        }}
      />
      <Celebration item={c.unlocked ? { kind: 'achievement', key: c.unlocked } : undefined} remaining={1} onDone={c.clearUnlocked} />
    </div>
  )
}
