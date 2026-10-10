import type { ClosetItem, OutfitDay } from './types'
import { addDays } from './dates'

export const CATEGORIES = [
  { id: 'tops', label: 'Tops', slot: 'top' },
  { id: 'bottoms', label: 'Pants and jeans', slot: 'bottom' },
  { id: 'shorts-skirts', label: 'Shorts and skirts', slot: 'bottom' },
  { id: 'dresses', label: 'Dresses and jumpsuits', slot: 'dress' },
  { id: 'outerwear', label: 'Jackets and outerwear', slot: 'outer' },
  { id: 'shoes', label: 'Shoes', slot: 'shoes' },
  { id: 'accessories', label: 'Accessories', slot: 'extra' },
  { id: 'workout', label: 'Workout clothes', slot: 'top' },
  { id: 'work-field', label: 'Work and field', slot: 'top' },
] as const

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? 'Other'
const SLOT_ORDER = ['outer', 'top', 'dress', 'bottom', 'shoes', 'extra']
export const slotOf = (cat: string) => CATEGORIES.find((c) => c.id === cat)?.slot ?? 'extra'

export const OCCASIONS = ['Office', 'Field and soccer', 'Casual', 'Going out', 'Gym', 'Running and HYROX', 'Travel and weekends', 'Special occasion']
export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter']
export const COLORS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#1f1f24' }, { name: 'White', hex: '#ffffff' }, { name: 'Gray', hex: '#a3a3ad' }, { name: 'Navy', hex: '#26335c' },
  { name: 'Blue', hex: '#6f93db' }, { name: 'Green', hex: '#6fae86' }, { name: 'Beige', hex: '#dcc8a8' }, { name: 'Brown', hex: '#8a6248' },
  { name: 'Pink', hex: '#efa9c0' }, { name: 'Red', hex: '#d0545e' }, { name: 'Yellow', hex: '#f5d461' }, { name: 'Purple', hex: '#a98bd9' },
]

// Main column top to bottom (outer, top or dress, bottom), side column for shoes and extras.
export function collageLayout(items: ClosetItem[]) {
  const sorted = [...items].sort((a, b) => SLOT_ORDER.indexOf(slotOf(a.category)) - SLOT_ORDER.indexOf(slotOf(b.category)))
  const main = sorted.filter((i) => ['outer', 'top', 'dress', 'bottom'].includes(slotOf(i.category)))
  const side = sorted.filter((i) => ['shoes', 'extra'].includes(slotOf(i.category)))
  return { main, side }
}

// True when every day Monday–Sunday of the week has an outfit planned.
export function weekFullyPlanned(days: OutfitDay[], monday: string) {
  const planned = new Set(days.map((d) => d.date))
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).every((d) => planned.has(d))
}

export const photoPath = (userId: string, itemId: string) => `${userId}/${itemId}-${Date.now().toString(36)}.jpg`
