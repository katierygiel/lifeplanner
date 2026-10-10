import { Bell, CalendarPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { today } from '../lib/dates'
import { buildIcs, REMINDERS } from '../lib/reminders'
import { Button, Card, Eyebrow, cx } from './ui'

type Saved = Record<string, { on: boolean; time: string }>
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const describe = (days: number[]) => (days.length === 7 ? 'Every day' : days.map((d) => DAYS[d]).join(', '))

// Reminders go into the iPhone Calendar app, which alerts reliably even when Level Up is closed.
export default function RemindersCard({ saved, onSave }: { saved?: Saved; onSave: (s: Saved) => Promise<{ error: unknown }> }) {
  const [state, setState] = useState<Saved>({})
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    setState(Object.fromEntries(REMINDERS.map((r) => [r.id, saved?.[r.id] ?? { on: ['outfit', 'gym-bag', 'weekly'].includes(r.id), time: r.time }])))
  }, [saved])

  const chosen = REMINDERS.filter((r) => state[r.id]?.on).map((r) => ({ ...r, time: state[r.id].time }))

  const addToCalendar = async () => {
    setMsg(null)
    if (!chosen.length) return setMsg('Pick at least one reminder.')
    await onSave(state)
    const ics = buildIcs(chosen, today(), window.location.origin)
    const file = new File([ics], 'level-up-reminders.ics', { type: 'text/calendar' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Level Up reminders' })
      } else {
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      }
      setMsg('Open the file and tap "Add All" to add them to your calendar.')
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setMsg("Couldn't create the calendar file. Try again.")
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-ink-soft" />
        <Eyebrow>Reminders</Eyebrow>
      </div>
      <p className="mt-1 text-[13px] text-ink-soft">Pick the nudges you want. They're added to your iPhone calendar with an alert, so they show up even when the app is closed.</p>
      <ul className="mt-3 space-y-1.5">
        {REMINDERS.map((r) => {
          const s = state[r.id]
          if (!s) return null
          return (
            <li key={r.id} className={cx('flex items-center gap-2 rounded-2xl px-3 py-2', s.on ? 'bg-peri-wash' : 'bg-canvas')}>
              <button
                aria-pressed={s.on}
                onClick={() => setState((x) => ({ ...x, [r.id]: { ...s, on: !s.on } }))}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <span className={cx('h-5 w-5 shrink-0 rounded-md', s.on ? 'bg-peri-deep' : 'ring-2 ring-line')} />
                <span className="min-w-0">
                  <span className={cx('block truncate text-[14px] font-semibold', !s.on && 'text-ink-soft')}>{r.title}</span>
                  <span className="block text-[11px] text-ink-faint">{describe(r.days)}</span>
                </span>
              </button>
              <input
                aria-label={`${r.title} time`}
                type="time"
                value={s.time}
                onChange={(e) => setState((x) => ({ ...x, [r.id]: { ...s, time: e.target.value } }))}
                className="h-9 w-[104px] shrink-0 rounded-lg bg-white px-1.5 text-[13px] outline-none ring-1 ring-line"
              />
            </li>
          )
        })}
      </ul>
      <Button variant="primary" className="mt-3 w-full" onClick={addToCalendar}>
        <CalendarPlus size={18} /> Add {chosen.length || ''} to my calendar
      </Button>
      {msg && <p className="mt-2 text-[12px] font-semibold text-ink-soft">{msg}</p>}
      <p className="mt-2 text-[11px] text-ink-faint">To change them later, delete the old ones in your Calendar app and add them again from here.</p>
    </Card>
  )
}
