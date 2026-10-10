// All dates in the app are local calendar days as 'YYYY-MM-DD' (never UTC, which can be a day off at night).
export function toDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, n: number): string {
  const d = fromDay(s)
  d.setDate(d.getDate() + n)
  return toDay(d)
}

export const today = () => toDay(new Date())

export function dayLabel(s: string, base = today()): string {
  if (s === base) return 'Today'
  if (s === addDays(base, 1)) return 'Tomorrow'
  if (s === addDays(base, -1)) return 'Yesterday'
  return fromDay(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
