import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Moon, Pencil, RotateCcw, Sun, SunMedium } from 'lucide-react'
import { useState } from 'react'
import { routineProgress } from '../lib/routines'
import type { Routine, RoutineLog } from '../lib/types'
import { describeDays } from './Sheet'
import { ProgressRing, cx } from './ui'

const ICON = { morning: Sun, day: SunMedium, evening: Moon, weekly: RotateCcw }

type Props = {
  routine: Routine
  log: RoutineLog | undefined
  defaultVersion: 'full' | 'busy'
  onToggleStep: (stepId: string, version: 'full' | 'busy') => void
  onEdit: () => void
}

export default function RoutineCard({ routine, log, defaultVersion, onToggleStep, onEdit }: Props) {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState<'full' | 'busy'>(log?.version ?? defaultVersion)
  const p = routineProgress(routine, log, version)
  const done = new Set(log?.completed_steps ?? [])
  const Icon = ICON[routine.time_of_day]
  const hasBusy = routine.steps.some((s) => !s.in_busy_version)

  return (
    <div className={cx('rounded-card transition-colors', p.complete ? 'bg-lemon-soft' : 'bg-white shadow-soft')}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
        <ProgressRing value={p.total ? p.doneCount / p.total : 0} size={44} stroke={5}>
          {p.complete ? <Check size={18} strokeWidth={3} className="text-lemon-ink" /> : <Icon size={17} className="text-ink-soft" />}
        </ProgressRing>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold">{routine.title}</span>
          <span className="block text-[12px] text-ink-soft">
            {p.complete ? `Done · +${routine.xp} XP` : `${p.doneCount} of ${p.total} steps`}
            {version === 'busy' && hasBusy ? ' · busy version' : ''}
          </span>
        </span>
        <ChevronDown size={20} className={cx('shrink-0 text-ink-faint transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              {hasBusy && (
                <div className="mb-2 flex rounded-full bg-canvas p-1">
                  {(['full', 'busy'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVersion(v)}
                      className={cx('relative flex-1 rounded-full py-1.5 text-[12px] font-bold', version === v ? 'text-ink' : 'text-ink-soft')}
                    >
                      {version === v && <motion.span layoutId={`ver-${routine.id}`} className="absolute inset-0 rounded-full bg-white shadow-soft" />}
                      <span className="relative">{v === 'full' ? 'Full' : 'Busy day'}</span>
                    </button>
                  ))}
                </div>
              )}
              <ul>
                {p.steps.map((s) => {
                  const on = done.has(s.id)
                  return (
                    <li key={s.id}>
                      <button onClick={() => onToggleStep(s.id, version)} className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-peri-wash/50">
                        <motion.span
                          animate={{ scale: on ? [1, 1.2, 1] : 1 }}
                          className={cx(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
                            on ? 'bg-lemon-deep text-ink' : 'ring-2 ring-peri-soft',
                          )}
                        >
                          {on && <Check size={14} strokeWidth={3} />}
                        </motion.span>
                        <span className={cx('flex-1 text-[14px] font-semibold', on && 'text-ink-faint line-through')}>{s.title}</span>
                        {s.optional && <span className="text-[11px] font-semibold text-ink-faint">optional</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-ink-faint">{describeDays(routine.days)}</span>
                <button onClick={onEdit} className="flex items-center gap-1 text-[12px] font-bold text-peri-deep">
                  <Pencil size={13} /> Edit routine
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
