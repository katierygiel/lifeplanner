import { useCallback, useEffect, useState } from 'react'
import { weekFullyPlanned } from './closet'
import { addDays, today } from './dates'
import { resizeImage } from './image'
import { newId, store } from './store'
import type { ClosetItem, Outfit, OutfitDay } from './types'
import { mondayOf } from './useWeek'

export function useCloset(rangeStart = addDays(mondayOf(today()), -28), rangeEnd = addDays(mondayOf(today()), 13)) {
  const [items, setItems] = useState<ClosetItem[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [days, setDays] = useState<OutfitDay[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState<string | null>(null)

  const loadUrls = async (list: ClosetItem[]) => {
    const paths = list.map((i) => i.photo_path).filter((p): p is string => !!p)
    const fresh = await store.photoUrls(paths)
    setUrls((u) => ({ ...u, ...fresh }))
  }

  const reload = useCallback(async () => {
    try {
      const [i, o, d] = await Promise.all([store.closet.list(), store.outfits.list(), store.listOutfitDays(rangeStart, rangeEnd)])
      setItems(i)
      setOutfits(o)
      setDays(d)
      await loadUrls(i)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [rangeStart, rangeEnd])

  useEffect(() => {
    reload()
  }, [reload])

  async function run<T>(fn: () => Promise<T>) {
    try {
      return await fn()
    } catch (e) {
      setError((e as Error).message)
      return null
    }
  }

  return {
    items, outfits, days, urls, loading, error, unlocked, reload,
    clearError: () => setError(null),
    clearUnlocked: () => setUnlocked(null),
    url: (item?: ClosetItem) => (item?.photo_path ? urls[item.photo_path] : undefined),

    async saveItem(item: ClosetItem, photo: File | null) {
      const saved = await run(async () => {
        let path = item.photo_path
        if (photo) {
          const blob = await resizeImage(photo)
          const old = path
          path = await store.uploadPhoto(item.id, blob)
          if (old && old !== path) await store.removePhoto(old).catch(() => {})
        }
        const row = await store.closet.save({ ...item, photo_path: path })
        if (path) setUrls({ ...urls, ...(await store.photoUrls([path])) })
        return row
      })
      if (saved) setItems((x) => [saved, ...x.filter((i) => i.id !== saved.id)])
      return !!saved
    },
    async deleteItem(item: ClosetItem) {
      setItems((x) => x.filter((i) => i.id !== item.id))
      setOutfits((o) => o.map((x) => ({ ...x, item_ids: x.item_ids.filter((id) => id !== item.id) })))
      await run(async () => {
        await store.closet.remove(item.id)
        if (item.photo_path) await store.removePhoto(item.photo_path).catch(() => {})
        for (const o of outfits.filter((x) => x.item_ids.includes(item.id)))
          await store.outfits.save({ ...o, item_ids: o.item_ids.filter((id) => id !== item.id) })
      })
    },
    async toggleFavoriteItem(item: ClosetItem) {
      const next = { ...item, favorite: !item.favorite }
      setItems((x) => x.map((i) => (i.id === item.id ? next : i)))
      await run(() => store.closet.save(next))
    },

    async saveOutfit(o: Outfit) {
      const saved = await run(() => store.outfits.save(o))
      if (saved) setOutfits((x) => [saved, ...x.filter((y) => y.id !== saved.id)])
      return saved
    },
    async deleteOutfit(id: string) {
      setOutfits((x) => x.filter((o) => o.id !== id))
      setDays((d) => d.filter((x) => x.outfit_id !== id))
      await run(() => store.outfits.remove(id))
    },

    // Planning a day earns a little XP once per day; a fully planned week unlocks an achievement.
    async planDay(date: string, outfitId: string | null) {
      const row = await run(() => store.setOutfitDay(date, outfitId))
      if (row === null && outfitId) return false
      const next = [...days.filter((d) => d.date !== date), ...(row ? [row] : [])]
      setDays(next)
      if (row && date >= today()) {
        await run(() => store.addXp({ amount: 5, source_type: 'outfit-plan', source_id: row.id, date: today() }))
        const monday = mondayOf(date)
        if (weekFullyPlanned(next, monday)) {
          const have = new Set((await store.listAchievements().catch(() => [])).map((a) => a.achievement_key))
          if (!have.has('outfit-week')) {
            await run(() => store.addAchievements(['outfit-week']))
            setUnlocked('outfit-week')
          }
        }
      }
      return true
    },
    async setWorn(day: OutfitDay, worn: boolean) {
      setDays((d) => d.map((x) => (x.id === day.id ? { ...x, worn } : x)))
      await run(() => store.setWorn(day.id, worn))
    },
    newItem: (): ClosetItem => ({ id: newId(), name: '', category: 'tops', color: null, seasons: [], occasions: [], photo_path: null, favorite: false, notes: null }),
  }
}
