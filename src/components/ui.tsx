import { AnimatePresence, motion } from 'framer-motion'
import { Check, Star } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { TIER_LABEL, type Tier } from '../lib/xp'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

/* ---------- Card ---------- */
type Tone = 'white' | 'lemon' | 'lilac' | 'peri' | 'mint'
const toneClass: Record<Tone, string> = {
  white: 'bg-white shadow-soft',
  lemon: 'bg-lemon-soft',
  lilac: 'bg-lilac-wash',
  peri: 'bg-peri-wash',
  mint: 'bg-mint/60',
}

export function Card({ tone = 'white', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <section className={cx('rounded-card p-4', toneClass[tone], className)}>{children}</section>
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('text-[11px] font-bold uppercase tracking-[0.08em]', className ?? 'text-ink-soft')}>{children}</div>
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-baseline justify-between px-1">
      <h2 className="text-[17px] font-bold">{title}</h2>
      {action}
    </div>
  )
}

/* ---------- Button ---------- */
type Variant = 'primary' | 'secondary' | 'ghost'
const variantClass: Record<Variant, string> = {
  primary: 'bg-peri-deep text-white hover:bg-[#6676E6]',
  secondary: 'bg-white text-ink ring-1 ring-line hover:bg-peri-wash',
  ghost: 'text-ink-soft hover:bg-peri-wash',
}

export function Button({
  variant = 'secondary',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={cx(
        'inline-flex h-11 items-center justify-center gap-2 rounded-btn px-4 text-[15px] font-semibold transition-colors',
        variantClass[variant],
        className,
      )}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  )
}

/* ---------- Chips ---------- */
const tierChip: Record<Tier, string> = {
  must: 'bg-peri-soft text-ink',
  flexible: 'bg-lilac text-ink',
  optional: 'bg-canvas text-ink-soft ring-1 ring-line',
  recovery: 'bg-mint text-mint-ink',
}

export function TierChip({ tier }: { tier: Tier }) {
  return <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold', tierChip[tier])}>{TIER_LABEL[tier]}</span>
}

export function Chip({ selected, onClick, children }: { selected?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors',
        selected ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-peri-wash',
      )}
    >
      {children}
    </motion.button>
  )
}

/* ---------- XP bar ---------- */
export function XPBar({ level, into, needed }: { level: number; into: number; needed: number }) {
  const pct = Math.min(100, Math.round((into / needed) * 100))
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-bold">Level {level}</span>
        <span className="text-ink-soft">
          {into} / {needed} XP
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
        <motion.div
          className="h-full rounded-full bg-peri"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}

/* ---------- Progress ring ---------- */
export function ProgressRing({ value, size = 64, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-lilac)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={v >= 1 ? 'var(--color-lemon-deep)' : 'var(--color-peri)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

/* ---------- Check row ---------- */
export function CheckRow({
  title,
  meta,
  tier,
  xp,
  done,
  onToggle,
  onOpen,
  priority,
}: {
  title: string
  meta?: string
  tier?: Tier
  xp: number
  done: boolean
  onToggle: () => void
  onOpen?: () => void
  priority?: boolean
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className={cx('block truncate text-[15px] font-semibold', done && 'text-ink-faint line-through decoration-2')}>
          {priority && <Star size={13} className="mr-1 inline -translate-y-px fill-lemon-deep text-lemon-ink" />}
          {title}
        </span>
        {(meta || tier) && (
          <span className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-soft">
            {tier && <TierChip tier={tier} />}
            {meta}
          </span>
        )}
      </span>
      <span className={cx('text-[12px] font-bold', done ? 'text-lemon-ink' : 'text-ink-faint')}>+{xp} XP</span>
    </>
  )
  return (
    <div className="relative flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-peri-wash/60">
      <motion.button
        type="button"
        onClick={onToggle}
        aria-label={done ? `Mark ${title} not done` : `Mark ${title} done`}
        animate={{ scale: done ? [1, 1.25, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className={cx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
          done ? 'bg-lemon-deep text-ink' : 'ring-2 ring-peri-soft hover:ring-peri',
        )}
      >
        {done && <Check size={16} strokeWidth={3} />}
      </motion.button>
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {body}
        </button>
      ) : (
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {body}
        </button>
      )}
      <AnimatePresence>
        {done && (
          <motion.span
            key="pop"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -26 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute right-2 top-1 text-[13px] font-extrabold text-lemon-ink"
          >
            +{xp}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, body, stage }: { icon: ReactNode; title: string; body: string; stage: string }) {
  return (
    <Card className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac text-ink">{icon}</div>
      <h3 className="text-[17px] font-bold">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-ink-soft">{body}</p>
      <span className="mt-4 rounded-full bg-lemon-soft px-3 py-1 text-[12px] font-semibold text-lemon-ink">{stage}</span>
    </Card>
  )
}

export { cx }
