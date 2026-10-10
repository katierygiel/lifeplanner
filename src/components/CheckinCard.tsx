import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { DAY_MODES } from '../lib/plan'
import { checkinSuggestion } from '../lib/routines'
import type { Checkin, DayMode } from '../lib/types'
import { Button, Card, Chip, Eyebrow, cx } from './ui'

type Key = 'energy' | 'mood' | 'motivation' | 'soreness'
const SCALES: { key: Key; label: string; low: string; high: string }[] = [
  { key: 'energy', label: 'Energy', low: 'Drained', high: 'Charged' },
  { key: 'mood', label: 'Mood', low: 'Low', high: 'Great' },
  { key: 'motivation', label: 'Motivation', low: 'Meh', high: 'Ready' },
  { key: 'soreness', label: 'Soreness', low: 'None', high: 'Very' },
]

type Props = {
  checkin: Checkin
  onSave: (fields: Partial<Omit<Checkin, 'date'>>) => void
}

export default function CheckinCard({ checkin, onSave }: Props) {
  const answered = checkin.energy != null
  const [open, setOpen] = useState(!answered)
  const suggestion = checkinSuggestion(checkin, checkin.day_mode)
  const modeLabel = DAY_MODES.find((m) => m.id === checkin.day_mode)?.label

  return (
    <Card>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 text-left" aria-expanded={open}>
        <span>
          <Eyebrow>Today's check-in</Eyebrow>
          {open || !answered ? (
            <span className="mt-1 block text-[16px] font-bold">How are you feeling today?</span>
          ) : (
            <span className="mt-1 block text-[14px] font-semibold text-ink">
              {SCALES.filter((s) => checkin[s.key] != null)
                .map((s) => `${s.label} ${checkin[s.key]}`)
                .join(' · ')}
              <span className="text-ink-soft"> · {modeLabel}</span>
            </span>
          )}
        </span>
        <ChevronDown size={20} className={cx('mt-1 shrink-0 text-ink-faint transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-3">
              {SCALES.map((s) => (
                <div key={s.key}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] font-bold">{s.label}</span>
                    <span className="text-[11px] text-ink-faint">
                      {s.low} → {s.high}
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={s.label}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const on = checkin[s.key] === n
                      return (
                        <motion.button
                          key={n}
                          whileTap={{ scale: 0.92 }}
                          role="radio"
                          aria-checked={on}
                          aria-label={`${s.label} ${n}`}
                          onClick={() => onSave({ [s.key]: on ? null : n })}
                          className={cx(
                            'h-9 rounded-xl text-[13px] font-bold transition-colors',
                            on
                              ? s.key === 'soreness'
                                ? 'bg-lilac-deep text-white'
                                : 'bg-peri-deep text-white'
                              : (checkin[s.key] ?? 0) >= n
                                ? 'bg-peri-soft text-ink'
                                : 'bg-canvas text-ink-soft',
                          )}
                        >
                          {n}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-[13px] font-bold">Today's plan</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_MODES.map((m) => (
                <Chip key={m.id} selected={checkin.day_mode === m.id} onClick={() => onSave({ day_mode: m.id as DayMode })}>
                  {m.label}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-ink-soft">{DAY_MODES.find((m) => m.id === checkin.day_mode)?.note}</p>

            {answered && (
              <Button className="mt-3 w-full" onClick={() => setOpen(false)}>
                Done
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {suggestion && (
        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-lemon-soft p-3">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-lemon-ink" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold">{suggestion.text}</p>
            <button onClick={() => onSave({ day_mode: suggestion.mode })} className="mt-1.5 text-[13px] font-bold text-peri-deep">
              Switch to {DAY_MODES.find((m) => m.id === suggestion.mode)?.label}
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
