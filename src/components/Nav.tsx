import { motion } from 'framer-motion'
import { CalendarDays, Dumbbell, House, Shirt, Sparkles, type LucideIcon } from 'lucide-react'
import { cx } from './ui'

export type TabId = 'home' | 'week' | 'goals' | 'fitness' | 'closet'

export const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'week', label: 'My Week', icon: CalendarDays },
  { id: 'goals', label: 'My Goals', icon: Sparkles },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'closet', label: 'My Closet', icon: Shirt },
]

type Props = { active: string; onSelect: (id: TabId) => void }

export function BottomNav({ active, onSelect }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg justify-around px-2 pt-1.5 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const on = active === id
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onSelect(id)}
                aria-current={on ? 'page' : undefined}
                className="relative flex w-full flex-col items-center gap-0.5 py-1.5"
              >
                {on && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute top-0.5 h-8 w-14 rounded-full bg-peri-wash"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={22} strokeWidth={on ? 2.4 : 1.8} className={cx('relative', on ? 'text-peri-deep' : 'text-ink-faint')} />
                <span className={cx('relative text-[10.5px] font-semibold', on ? 'text-ink' : 'text-ink-faint')}>{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function SideNav({ active, onSelect }: Props) {
  return (
    <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white/70 px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <img src="./favicon.svg" alt="" className="h-8 w-8" />
        <span className="text-[17px] font-extrabold">Level Up</span>
      </div>
      <ul className="space-y-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const on = active === id
          return (
            <li key={id}>
              <button
                onClick={() => onSelect(id)}
                aria-current={on ? 'page' : undefined}
                className={cx(
                  'flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-[15px] font-semibold transition-colors',
                  on ? 'bg-peri-wash text-ink' : 'text-ink-soft hover:bg-canvas',
                )}
              >
                <Icon size={20} strokeWidth={on ? 2.4 : 1.8} className={on ? 'text-peri-deep' : ''} />
                {label}
              </button>
            </li>
          )
        })}
      </ul>
      <button
        onClick={() => onSelect('style' as TabId)}
        className={cx(
          'mt-auto rounded-btn px-3 py-2.5 text-left text-[13px] font-semibold',
          active === 'style' ? 'bg-lemon-soft text-lemon-ink' : 'text-ink-faint hover:bg-canvas',
        )}
      >
        Style guide
      </button>
    </nav>
  )
}
