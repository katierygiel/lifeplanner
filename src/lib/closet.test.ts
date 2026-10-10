import { describe, expect, it } from 'vitest'
import { collageLayout, weekFullyPlanned } from './closet'
import type { ClosetItem } from './types'

const item = (id: string, category: string): ClosetItem => ({ id, name: id, category, color: null, seasons: [], occasions: [], photo_path: null, favorite: false, notes: null })

describe('closet', () => {
  it('stacks outerwear, top, bottom, with shoes and extras to the side', () => {
    const l = collageLayout([item('sneakers', 'shoes'), item('jeans', 'bottoms'), item('jacket', 'outerwear'), item('tee', 'tops'), item('bag', 'accessories')])
    expect(l.main.map((i) => i.id)).toEqual(['jacket', 'tee', 'jeans'])
    expect(l.side.map((i) => i.id)).toEqual(['sneakers', 'bag'])
  })
  it('knows when a whole week is planned', () => {
    const days = Array.from({ length: 7 }, (_, i) => ({ id: String(i), date: `2026-10-${12 + i}`, outfit_id: 'o', worn: false }))
    expect(weekFullyPlanned(days, '2026-10-12')).toBe(true)
    expect(weekFullyPlanned(days.slice(1), '2026-10-12')).toBe(false)
  })
})
