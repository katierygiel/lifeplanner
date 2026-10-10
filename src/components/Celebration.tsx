import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Award, Sparkles } from 'lucide-react'
import { defFor } from '../lib/achievements'
import type { Celebration as C } from '../lib/useToday'
import { Button } from './ui'

const BURST = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2
  return { x: Math.cos(angle) * 120, y: Math.sin(angle) * 120, color: ['#FFE066', '#9AA8FF', '#E6D9FF', '#CDEFE0'][i % 4], size: 8 + (i % 3) * 4 }
})

export default function Celebration({ item, remaining, onDone }: { item: C | undefined; remaining: number; onDone: () => void }) {
  const reduce = useReducedMotion()
  const def = item?.kind === 'achievement' ? defFor(item.key) : undefined
  const title = item?.kind === 'level' ? `Level ${item.level}` : def?.title ?? 'Achievement'
  const sub =
    item?.kind === 'level'
      ? 'You leveled up. Every check-off got you here.'
      : item?.key.startsWith('comeback')
        ? 'Welcome back. Picking it back up is the whole point.'
        : 'Achievement unlocked'

  return (
    <AnimatePresence mode="wait">
      {item && (
        <motion.div
          key={item.key}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="absolute inset-0 bg-ink/35" onClick={onDone} />
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative w-full max-w-xs rounded-[28px] bg-white px-6 pb-6 pt-10 text-center"
          >
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
              {!reduce &&
                BURST.map((b, i) => (
                  <motion.span
                    key={i}
                    className="absolute rounded-full"
                    style={{ width: b.size, height: b.size, background: b.color }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                    animate={{ x: b.x, y: b.y, opacity: 0, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
                  />
                ))}
              <motion.div
                initial={{ rotate: -20, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-lemon"
              >
                {item.kind === 'level' ? <Sparkles size={36} className="text-lemon-ink" /> : <Award size={36} className="text-lemon-ink" />}
              </motion.div>
            </div>
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">{sub}</div>
            <h2 className="mt-1 text-[24px] font-extrabold leading-tight tracking-tight [text-wrap:balance]">{title}</h2>
            {def && item.kind === 'achievement' && !item.key.startsWith('comeback') && <p className="mt-1 text-[13px] text-ink-soft">{def.hint}</p>}
            <Button variant="primary" className="mt-6 w-full" onClick={onDone}>
              {remaining > 1 ? `Nice · ${remaining - 1} more` : 'Nice'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
