import { describe, expect, it } from 'vitest'
import { buildIcs, REMINDERS } from './reminders'

describe('calendar reminders', () => {
  const ics = buildIcs([REMINDERS.find((r) => r.id === 'weekly')!, { ...REMINDERS[0], time: '20:45' }], '2026-10-14', 'https://example.app', new Date('2026-10-14T12:00:00Z'))
  it('repeats on the right days with an alert', () => {
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=SU')
    expect(ics).toContain('TRIGGER:PT0M')
    expect(ics).toContain('BEGIN:VCALENDAR')
  })
  it('starts on the first matching day at local time', () => {
    expect(ics).toContain('DTSTART:20261018T180000') // first Sunday after Wed Oct 14
    expect(ics).toContain('DTSTART:20261014T204500')
  })
  it('escapes commas and uses CRLF', () => {
    expect(ics).toContain('Look back\\, reflect\\, and set up')
    expect(ics.includes('\r\n')).toBe(true)
  })
})
