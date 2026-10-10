import { fromDay } from './dates'
import type { BlockKind, ScheduleBlock, Task } from './types'

export const minutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hr = h % 12 || 12
  return m ? `${hr}:${String(m).padStart(2, '0')}${suffix}` : `${hr}${suffix}`
}

export const formatRange = (b: Pick<ScheduleBlock, 'start_time' | 'end_time'>) => `${formatTime(b.start_time)}–${formatTime(b.end_time)}`

// Every block that happens on `date`: one-offs on that date, plus weekly repeats that aren't skipped.
export function blocksOn(blocks: ScheduleBlock[], date: string): ScheduleBlock[] {
  const dow = fromDay(date).getDay()
  return blocks
    .filter((b) => {
      if (b.date) return b.date === date
      if (b.weekday !== dow) return false
      if (b.repeat_from && date < b.repeat_from) return false
      if (b.repeat_until && date > b.repeat_until) return false
      return !b.skipped_dates.includes(date)
    })
    .sort((a, b) => minutes(a.start_time) - minutes(b.start_time))
}

// Hours committed: scheduled blocks (overlaps merged) plus planned task time.
export function dayLoad(blocks: ScheduleBlock[], tasks: Task[]) {
  const spans = blocks.map((b) => [minutes(b.start_time), Math.max(minutes(b.end_time), minutes(b.start_time))]).sort((a, b) => a[0] - b[0])
  let blockMin = 0
  let curStart = -1
  let curEnd = -1
  for (const [s, e] of spans) {
    if (s > curEnd) {
      if (curEnd > curStart) blockMin += curEnd - curStart
      curStart = s
      curEnd = e
    } else curEnd = Math.max(curEnd, e)
  }
  if (curEnd > curStart) blockMin += curEnd - curStart
  const taskMin = tasks.reduce((s, t) => s + (t.duration_min ?? 0), 0)
  const hours = (blockMin + taskMin) / 60
  // About 10 committed hours is a full day once sleep, meals, and getting ready are counted.
  const level = hours >= 10 ? 'full' : hours >= 7 ? 'busy' : hours >= 3 ? 'steady' : 'light'
  return { hours, ratio: Math.min(1, hours / 12), level } as const
}

export const PRESETS: { kind: BlockKind; label: string; title: string; start: string; end: string }[] = [
  { kind: 'work', label: 'Work', title: 'Work', start: '10:00', end: '17:00' },
  { kind: 'field', label: 'Field', title: 'Field shift', start: '18:00', end: '21:00' },
  { kind: 'gym', label: 'Gym', title: 'Gym', start: '07:00', end: '09:00' },
  { kind: 'friends', label: 'Friends', title: 'Friends', start: '19:00', end: '21:00' },
  { kind: 'family', label: 'Family', title: 'Family', start: '18:00', end: '20:00' },
  { kind: 'event', label: 'Nails', title: 'Nails', start: '12:00', end: '13:00' },
  { kind: 'commute', label: 'Commute', title: 'Commute', start: '09:15', end: '10:00' },
  { kind: 'other', label: 'Other', title: '', start: '12:00', end: '13:00' },
]

export const KIND_STYLE: Record<BlockKind, { bg: string; dot: string }> = {
  work: { bg: 'bg-peri-wash', dot: 'bg-peri-deep' },
  field: { bg: 'bg-mint/60', dot: 'bg-mint-ink' },
  gym: { bg: 'bg-lilac-wash', dot: 'bg-lilac-deep' },
  friends: { bg: 'bg-lemon-soft', dot: 'bg-lemon-deep' },
  family: { bg: 'bg-lemon-soft', dot: 'bg-lemon-ink' },
  event: { bg: 'bg-lilac-wash', dot: 'bg-peri' },
  commute: { bg: 'bg-canvas', dot: 'bg-ink-faint' },
  other: { bg: 'bg-canvas', dot: 'bg-ink-soft' },
}
