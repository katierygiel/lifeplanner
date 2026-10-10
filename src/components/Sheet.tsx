import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { cx } from './ui'

export function Sheet({
  open,
  title,
  onClose,
  onSubmit,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  onSubmit: () => void
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
          <motion.form
            noValidate
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              onSubmit()
            }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white px-5 pt-3 md:rounded-[28px]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line md:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[19px] font-extrabold">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-canvas">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">{children}</div>
}

export const inputClass =
  'h-12 w-full rounded-btn bg-canvas px-4 text-[16px] font-semibold outline-none ring-1 ring-line focus:ring-2 focus:ring-peri'

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function DayPicker({ value, onChange }: { value: number[]; onChange: (d: number[]) => void }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LETTERS.map((l, i) => {
          const on = value.includes(i)
          return (
            <button
              type="button"
              key={i}
              aria-pressed={on}
              aria-label={DAY_NAMES[i]}
              onClick={() => onChange(on ? value.filter((d) => d !== i) : [...value, i].sort())}
              className={cx('h-10 rounded-xl text-[14px] font-bold transition-colors', on ? 'bg-peri-deep text-white' : 'bg-canvas text-ink-soft')}
            >
              {l}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex gap-3 text-[12px] font-semibold text-peri-deep">
        <button type="button" onClick={() => onChange([0, 1, 2, 3, 4, 5, 6])}>
          Every day
        </button>
        <button type="button" onClick={() => onChange([1, 2, 3, 4])}>
          Mon–Thu
        </button>
        <button type="button" onClick={() => onChange([1, 2, 3, 4, 5])}>
          Weekdays
        </button>
        <button type="button" onClick={() => onChange([0, 6])}>
          Weekends
        </button>
      </div>
    </div>
  )
}

export function describeDays(days: number[]) {
  const s = [...days].sort().join(',')
  if (s === '0,1,2,3,4,5,6') return 'Every day'
  if (s === '1,2,3,4,5') return 'Weekdays'
  if (s === '1,2,3,4') return 'Mon–Thu'
  if (s === '0,6') return 'Weekends'
  return days
    .slice()
    .sort()
    .map((d) => DAY_NAMES[d].slice(0, 3))
    .join(', ')
}
