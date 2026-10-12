import type { ExerciseEntry, SetEntry } from './types'

// "3 x 8 20 lbs", "3x8 17.5lbs", "2x 10 @ 40", "3 sets of 8", "x10" — sets, reps, then an optional weight.
const SET_GROUP =
  /(?:(\d+)\s*(?:x|×|\*|sets?\s*(?:of|x)?)\s*(\d+)(?:\s*reps?)?|(\d+)\s*reps?)(?:\s*(?:@|at)?\s*(\d+(?:\.\d+)?)\s*(lbs?|pounds?|#|kg|kgs)?)?/gi

const WORKOUT_WORDS = /\b(body|upper|lower|push|pull|legs?|glutes?|arms?|back|chest|shoulders?|core|full|day|workout|lift|strength|hyrox|circuit|session)\b/i

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Splits a long name like "seated row machine? like it was a machine…" into a short name and a note.
function splitName(raw: string): { name: string; note?: string } {
  const t = raw.replace(/[\s:–—-]+$/, '').trim()
  const cut = t.match(/^(.{2,40}?)(?:\?|,|\s[-–—]\s|\(|;|\s(?:like|but|felt|note)\s)(.*)$/i)
  if (cut && (t.length > 28 || /[?(]/.test(t))) {
    const note = cut[2].replace(/[)]/g, '').trim()
    return { name: cut[1].trim(), note: note || undefined }
  }
  return { name: t }
}

export type ParsedNotes = { title: string | null; exercises: ExerciseEntry[]; leftovers: string[] }

export function parseWorkoutNotes(text: string): ParsedNotes {
  const exercises: ExerciseEntry[] = []
  const leftovers: string[] = []
  let title: string | null = null

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^[\s•*\-–—\d.)]+(?=[a-z])/i, '').trim()
    if (!line) continue
    const matches = [...line.matchAll(SET_GROUP)].filter((m) => m[0].trim())
    if (!matches.length) {
      // A short first line with no numbers reads as the workout's name ("Upper body").
      if (!exercises.length && !title && line.length <= 40 && !/\d/.test(line) && WORKOUT_WORDS.test(line)) title = cap(line.replace(/[:\s]+$/, ''))
      else leftovers.push(line)
      continue
    }
    const first = matches[0].index ?? 0
    const { name, note } = splitName(line.slice(0, first))
    if (!name) {
      leftovers.push(line)
      continue
    }
    const sets: SetEntry[] = []
    let lastWeight: number | null = null
    for (const m of matches) {
      const count = m[3] ? 1 : Number(m[1])
      const reps = Number(m[3] ?? m[2])
      let weight = m[4] != null ? Number(m[4]) : null
      if (weight != null && /kg/i.test(m[5] ?? '')) weight = Math.round(weight * 2.2046 * 2) / 2
      if (weight == null) weight = lastWeight
      lastWeight = weight
      for (let i = 0; i < Math.min(count, 20); i++) sets.push({ reps, weight })
    }
    const tail = line.slice((matches[matches.length - 1].index ?? 0) + matches[matches.length - 1][0].length).trim()
    const notes = [note, tail.replace(/^[,;.\s-]+/, '')].filter(Boolean).join(' · ') || undefined
    exercises.push({ name: cap(name), sets, ...(notes ? { notes } : {}) })
  }
  return { title, exercises, leftovers }
}
