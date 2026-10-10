import { addDays, fromDay } from './dates'
import type { WorkoutInput } from './types'

export function importPrompt(start: string, days: number) {
  const end = addDays(start, days - 1)
  const nice = (d: string) => fromDay(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `Plan my workouts from ${nice(start)} to ${nice(end)} (${days} days). For each day give a full version, a short version for busy or low-energy days, and a recovery option.

My usual week: 2 lower-body days, 2 upper-body days, 1 run, plus walking and optional Pilates or mobility. I'm working toward 20 pull-ups and training for HYROX.

Reply in exactly this format, one block per day, with no other text:

DATE: ${start}
FULL: Upper body | 45 min · pull-up ladder, rows, presses
SHORT: Upper body express | 20 min · pull-ups and one superset
RECOVERY: Easy walk | 25 min

Use real dates (YYYY-MM-DD). Rest days can be "FULL: Rest day". Keep each line under 120 characters.`
}

export type ParsedDay = Pick<WorkoutInput, 'date' | 'full_title' | 'full_detail' | 'short_title' | 'short_detail' | 'recovery_title' | 'recovery_detail'>

const clean = (s: string) =>
  s
    .replace(/\*\*|__|`/g, '')
    .replace(/^[\s>*\-•]+/, '')
    .trim()

function splitTitle(rest: string): [string | null, string | null] {
  const r = rest.trim()
  if (!r) return [null, null]
  const i = r.indexOf('|')
  if (i >= 0) return [r.slice(0, i).trim() || null, r.slice(i + 1).trim() || null]
  const dash = r.match(/^(.+?)\s+[–—-]\s+(.+)$/)
  if (dash) return [dash[1].trim(), dash[2].trim()]
  return [r, null]
}

// Reads ChatGPT's reply. Forgiving about bold text, bullets, and casing; strict about dates.
export function parseWorkouts(text: string): { days: ParsedDay[]; skipped: number } {
  const days: ParsedDay[] = []
  let cur: ParsedDay | null = null
  let skipped = 0
  for (const raw of text.split(/\r?\n/)) {
    const line = clean(raw)
    if (!line) continue
    const m = line.match(/^(date|full|short|recovery)\s*[:：]\s*(.*)$/i)
    if (!m) {
      skipped++
      continue
    }
    const key = m[1].toLowerCase()
    const rest = m[2]
    if (key === 'date') {
      const d = rest.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (!d) {
        cur = null
        skipped++
        continue
      }
      cur = { date: d[0], full_title: null, full_detail: null, short_title: null, short_detail: null, recovery_title: null, recovery_detail: null }
      days.push(cur)
      continue
    }
    if (!cur) {
      skipped++
      continue
    }
    const [title, detail] = splitTitle(rest)
    if (key === 'full') [cur.full_title, cur.full_detail] = [title, detail]
    if (key === 'short') [cur.short_title, cur.short_detail] = [title, detail]
    if (key === 'recovery') [cur.recovery_title, cur.recovery_detail] = [title, detail]
  }
  // Last one wins if a date repeats.
  const byDate = new Map(days.filter((d) => d.full_title || d.short_title || d.recovery_title).map((d) => [d.date, d]))
  return { days: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)), skipped }
}
