import { addDays, fromDay } from './dates'

export type ReminderDef = { id: string; title: string; note: string; time: string; days: number[] }

const EVERY = [0, 1, 2, 3, 4, 5, 6]
export const REMINDERS: ReminderDef[] = [
  { id: 'outfit', title: "Plan tomorrow's outfit", note: 'Two minutes now, an easier morning tomorrow.', time: '20:30', days: EVERY },
  { id: 'gym-bag', title: 'Pack your gym bag', note: "Future you will be glad it's ready.", time: '21:00', days: [0, 1, 2, 3, 4] },
  { id: 'schedule', title: "Look at tomorrow's schedule", note: 'A quick peek so nothing sneaks up on you.', time: '21:00', days: EVERY },
  { id: 'lunch', title: "Prep tomorrow's lunch", note: 'Pack it tonight, grab it tomorrow.', time: '20:00', days: [0, 1, 2, 3] },
  { id: 'evening', title: 'Evening reset', note: 'Even the short version counts.', time: '21:30', days: EVERY },
  { id: 'weekly', title: 'Weekly reset', note: 'Look back, reflect, and set up next week in Level Up.', time: '18:00', days: [0] },
  { id: 'season', title: 'Check in on your season goals', note: "See how far you've come.", time: '18:30', days: [0] },
]

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

// Builds a calendar file. Each reminder repeats weekly on its days with an alert at the time itself.
export function buildIcs(items: (ReminderDef & { time: string })[], start: string, appUrl: string, stamp = new Date()) {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Level Up//Reminders//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Level Up']
  for (const r of items) {
    // First occurrence: the first matching weekday on or after `start`.
    let d = start
    for (let i = 0; i < 7 && !r.days.includes(fromDay(d).getDay()); i++) d = addDays(d, 1)
    const [h, m] = r.time.split(':')
    const dt = `${d.replace(/-/g, '')}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`
    lines.push(
      'BEGIN:VEVENT',
      `UID:levelup-${r.id}-${start}@levelup`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dt}`,
      'DURATION:PT10M',
      `RRULE:FREQ=WEEKLY;BYDAY=${r.days.map((x) => BYDAY[x]).join(',')}`,
      `SUMMARY:${esc(r.title)}`,
      `DESCRIPTION:${esc(`${r.note}\n${appUrl}`)}`,
      `URL:${appUrl}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(r.title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
