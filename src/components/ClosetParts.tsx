import { Camera, Heart, Shirt, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, collageLayout, COLORS, OCCASIONS, SEASONS } from '../lib/closet'
import { newId } from '../lib/store'
import type { ClosetItem, Outfit } from '../lib/types'
import { FieldLabel, Sheet, inputClass } from './Sheet'
import { Button, Chip, cx } from './ui'

type UrlFor = (item?: ClosetItem) => string | undefined

/* ---------- Photo tile ---------- */
export function ItemPhoto({ item, url, className }: { item: ClosetItem; url?: string; className?: string }) {
  const hex = COLORS.find((c) => c.name === item.color)?.hex
  return (
    <div className={cx('relative flex items-center justify-center overflow-hidden bg-white', className)}>
      {url ? (
        <img src={url} alt={item.name} className="h-full w-full object-contain" loading="lazy" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-canvas">
          <Shirt size={26} className="text-ink-faint" />
          {hex && <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: hex }} />}
        </div>
      )}
    </div>
  )
}

/* ---------- Collage ---------- */
export function Collage({ items, urlFor, className }: { items: ClosetItem[]; urlFor: UrlFor; className?: string }) {
  const { main, side } = collageLayout(items)
  if (!items.length)
    return (
      <div className={cx('flex items-center justify-center rounded-2xl bg-canvas text-[12px] font-semibold text-ink-faint', className)}>
        Pick pieces below
      </div>
    )
  return (
    <div className={cx('flex gap-1.5 rounded-2xl bg-white p-1.5', className)}>
      <div className={cx('flex flex-col gap-1.5', side.length ? 'w-2/3' : 'w-full')}>
        {main.map((i) => (
          <ItemPhoto key={i.id} item={i} url={urlFor(i)} className="min-h-0 flex-1 rounded-xl" />
        ))}
        {!main.length && <div className="flex-1 rounded-xl bg-canvas" />}
      </div>
      {side.length > 0 && (
        <div className="flex w-1/3 flex-col gap-1.5">
          {side.map((i) => (
            <ItemPhoto key={i.id} item={i} url={urlFor(i)} className="min-h-0 flex-1 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Clothing item editor ---------- */
export function ItemSheet({
  open, item, isNew, url, onClose, onSave, onDelete,
}: {
  open: boolean
  item: ClosetItem | null
  isNew: boolean
  url?: string
  onClose: () => void
  onSave: (item: ClosetItem, photo: File | null) => Promise<boolean>
  onDelete: (item: ClosetItem) => void
}) {
  const [draft, setDraft] = useState<ClosetItem | null>(item)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | undefined>(url)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setDraft(item)
    setPhoto(null)
    setPreview(url)
    setError(null)
    setConfirm(false)
  }, [open, item, url])

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
  }, [preview])

  if (!draft) return null
  const set = (p: Partial<ClosetItem>) => setDraft((d) => (d ? { ...d, ...p } : d))
  const toggle = (key: 'seasons' | 'occasions', v: string) => set({ [key]: draft[key].includes(v) ? draft[key].filter((x) => x !== v) : [...draft[key], v] })

  const submit = async () => {
    if (!draft.name.trim()) return setError('Name it, like "White linen shirt".')
    setBusy(true)
    const ok = await onSave({ ...draft, name: draft.name.trim(), notes: draft.notes?.trim() || null }, photo)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Sheet open={open} title={isNew ? 'Add clothing' : 'Edit clothing'} onClose={onClose} onSubmit={submit}>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative mx-auto flex aspect-square w-48 items-center justify-center overflow-hidden rounded-3xl bg-canvas ring-1 ring-line"
      >
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-ink-soft">
            <Camera size={28} />
            <span className="text-[13px] font-bold">Add a photo</span>
          </span>
        )}
        {preview && <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold shadow-soft">Change</span>}
      </button>
      <input
        ref={fileRef}
        id="item-photo"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setPhoto(f)
          setPreview(URL.createObjectURL(f))
        }}
      />
      <p className="mt-2 text-center text-[11px] text-ink-faint">Tip: in Photos, press and hold your clothing to copy a clean cutout, save it, then add it here.</p>

      <FieldLabel>Name</FieldLabel>
      <input id="item-name" value={draft.name} onChange={(e) => { set({ name: e.target.value }); setError(null) }} placeholder="White linen shirt" className={inputClass} />
      {error && <p className="mt-1.5 text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      <FieldLabel>Category</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip key={c.id} selected={draft.category === c.id} onClick={() => set({ category: c.id })}>
            {c.label}
          </Chip>
        ))}
      </div>

      <FieldLabel>Color</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button
            type="button"
            key={c.name}
            aria-label={c.name}
            aria-pressed={draft.color === c.name}
            onClick={() => set({ color: draft.color === c.name ? null : c.name })}
            className={cx('h-9 w-9 rounded-full ring-1 ring-black/10', draft.color === c.name && 'ring-2 ring-ink ring-offset-2')}
            style={{ background: c.hex }}
          />
        ))}
      </div>

      <FieldLabel>Seasons</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {SEASONS.map((s) => (
          <Chip key={s} selected={draft.seasons.includes(s)} onClick={() => toggle('seasons', s)}>
            {s}
          </Chip>
        ))}
      </div>

      <FieldLabel>Good for</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {OCCASIONS.map((o) => (
          <Chip key={o} selected={draft.occasions.includes(o)} onClick={() => toggle('occasions', o)}>
            {o}
          </Chip>
        ))}
      </div>

      <FieldLabel>Notes</FieldLabel>
      <input id="item-notes" value={draft.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} placeholder="Runs small, hang dry" className={inputClass} />

      <div className="mt-6 flex gap-2">
        {!isNew &&
          (confirm ? (
            <Button type="button" className="bg-[#FBE7EE] text-[#9C3558] ring-0" onClick={() => { onDelete(draft); onClose() }}>
              Delete
            </Button>
          ) : (
            <Button type="button" variant="ghost" aria-label="Delete item" onClick={() => setConfirm(true)}>
              <Trash2 size={18} />
            </Button>
          ))}
        <Button type="button" aria-pressed={draft.favorite} aria-label="Favorite" onClick={() => set({ favorite: !draft.favorite })}>
          <Heart size={18} className={draft.favorite ? 'fill-[#E58AA8] text-[#E58AA8]' : ''} />
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={busy}>
          {busy ? 'Saving…' : isNew ? 'Add to closet' : 'Save'}
        </Button>
      </div>
    </Sheet>
  )
}

/* ---------- Outfit builder ---------- */
export function OutfitSheet({
  open, outfit, items, urlFor, onClose, onSave, onDelete,
}: {
  open: boolean
  outfit: Outfit | null
  items: ClosetItem[]
  urlFor: UrlFor
  onClose: () => void
  onSave: (o: Outfit) => Promise<Outfit | null>
  onDelete: (id: string) => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const [name, setName] = useState('')
  const [occasion, setOccasion] = useState<string | null>(null)
  const [favorite, setFavorite] = useState(false)
  const [notes, setNotes] = useState('')
  const [cat, setCat] = useState<string>('tops')
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setPicked(outfit?.item_ids ?? [])
    setName(outfit?.name ?? '')
    setOccasion(outfit?.occasion ?? null)
    setFavorite(outfit?.favorite ?? false)
    setNotes(outfit?.notes ?? '')
    setError(null)
    setConfirm(false)
    setCat(CATEGORIES.find((c) => items.some((i) => i.category === c.id))?.id ?? 'tops')
  }, [open, outfit, items])

  const pickedItems = useMemo(() => picked.map((id) => items.find((i) => i.id === id)).filter((i): i is ClosetItem => !!i), [picked, items])
  const inCat = items.filter((i) => i.category === cat)
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, items.filter((i) => i.category === c.id).length]))

  const submit = async () => {
    if (!picked.length) return setError('Pick at least one piece.')
    const saved = await onSave({ id: outfit?.id ?? newId(), name: name.trim() || null, occasion, item_ids: picked, favorite, notes: notes.trim() || null })
    if (saved) onClose()
  }

  return (
    <Sheet open={open} title={outfit ? 'Edit outfit' : 'Build an outfit'} onClose={onClose} onSubmit={submit}>
      <Collage items={pickedItems} urlFor={urlFor} className="mx-auto aspect-[3/4] w-56 ring-1 ring-line" />
      {error && <p className="mt-2 text-center text-[13px] font-semibold text-[#B4456A]">{error}</p>}

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {CATEGORIES.filter((c) => counts[c.id]).map((c) => (
          <Chip key={c.id} selected={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label} <span className="opacity-60">{counts[c.id]}</span>
          </Chip>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {inCat.map((i) => {
          const on = picked.includes(i.id)
          return (
            <button
              type="button"
              key={i.id}
              aria-pressed={on}
              aria-label={i.name}
              onClick={() => {
                setPicked((p) => (on ? p.filter((x) => x !== i.id) : [...p, i.id]))
                setError(null)
              }}
              className={cx('overflow-hidden rounded-2xl text-left ring-1 transition', on ? 'ring-[3px] ring-peri-deep' : 'ring-line')}
            >
              <ItemPhoto item={i} url={urlFor(i)} className="aspect-square" />
              <span className="block truncate px-2 py-1 text-[11px] font-semibold">{i.name}</span>
            </button>
          )
        })}
      </div>

      <FieldLabel>Name (optional)</FieldLabel>
      <input id="outfit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Office Monday" className={inputClass} />
      <FieldLabel>Occasion</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {OCCASIONS.map((o) => (
          <Chip key={o} selected={occasion === o} onClick={() => setOccasion(occasion === o ? null : o)}>
            {o}
          </Chip>
        ))}
      </div>
      <FieldLabel>Notes</FieldLabel>
      <input id="outfit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Swap to loafers if it rains" className={inputClass} />

      <div className="mt-6 flex gap-2">
        {outfit &&
          (confirm ? (
            <Button type="button" className="bg-[#FBE7EE] text-[#9C3558] ring-0" onClick={() => { onDelete(outfit.id); onClose() }}>
              Delete
            </Button>
          ) : (
            <Button type="button" variant="ghost" aria-label="Delete outfit" onClick={() => setConfirm(true)}>
              <Trash2 size={18} />
            </Button>
          ))}
        <Button type="button" aria-pressed={favorite} aria-label="Favorite" onClick={() => setFavorite((f) => !f)}>
          <Heart size={18} className={favorite ? 'fill-[#E58AA8] text-[#E58AA8]' : ''} />
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {outfit ? 'Save outfit' : 'Save outfit'}
        </Button>
      </div>
    </Sheet>
  )
}

/* ---------- Pick an outfit for a day ---------- */
export function PlanDaySheet({
  open, label, outfits, items, urlFor, currentId, onClose, onPick, onBuild,
}: {
  open: boolean
  label: string
  outfits: Outfit[]
  items: ClosetItem[]
  urlFor: UrlFor
  currentId: string | null
  onClose: () => void
  onPick: (outfitId: string | null) => void
  onBuild: () => void
}) {
  const sorted = [...outfits].sort((a, b) => Number(b.favorite) - Number(a.favorite))
  return (
    <Sheet open={open} title={`Outfit for ${label}`} onClose={onClose} onSubmit={onClose}>
      {sorted.length === 0 ? (
        <p className="text-[13px] text-ink-soft">No saved outfits yet. Build one from your closet first.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {sorted.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => { onPick(o.id); onClose() }}
              className={cx('overflow-hidden rounded-2xl bg-canvas p-1.5 text-left ring-1', currentId === o.id ? 'ring-[3px] ring-peri-deep' : 'ring-line')}
            >
              <Collage items={o.item_ids.map((id) => items.find((i) => i.id === id)).filter((i): i is ClosetItem => !!i)} urlFor={urlFor} className="aspect-[3/4]" />
              <span className="mt-1 block truncate px-1 text-[12px] font-bold">{o.name || o.occasion || 'Outfit'}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-5 flex gap-2">
        {currentId && (
          <Button type="button" onClick={() => { onPick(null); onClose() }}>
            Clear day
          </Button>
        )}
        <Button type="button" variant="primary" className="flex-1" onClick={onBuild}>
          Build a new outfit
        </Button>
      </div>
    </Sheet>
  )
}
