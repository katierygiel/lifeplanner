import { Dumbbell, Shirt, Sparkles } from 'lucide-react'
import { Card, EmptyState, Eyebrow, XPBar, cx } from '../components/ui'
import { levelFromXp } from '../lib/xp'

function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="px-1 pb-2 pt-2">
      <div className="text-[13px] font-semibold text-ink-soft">{eyebrow}</div>
      <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">{title}</h1>
    </header>
  )
}

export function Week() {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
  const load = [0.7, 0.9, 0.5, 0.8, 0.95, 0.4, 0.2] // preview only

  return (
    <div className="space-y-3">
      <PageHeader eyebrow={`Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} title="My Week" />
      <Card>
        <Eyebrow>How full is this week</Eyebrow>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString()
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end overflow-hidden rounded-xl bg-peri-wash">
                  <div
                    className={cx('w-full rounded-xl', load[i] > 0.85 ? 'bg-lilac-deep' : 'bg-peri-soft')}
                    style={{ height: `${load[i] * 100}%` }}
                  />
                </div>
                <span className={cx('text-[11px] font-bold', isToday ? 'text-peri-deep' : 'text-ink-soft')}>
                  {d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                </span>
                <span
                  className={cx(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold',
                    isToday ? 'bg-ink text-white' : 'text-ink',
                  )}
                >
                  {d.getDate()}
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-[12px] text-ink-soft">Taller bars mean busier days. Purple means the day is close to full.</p>
      </Card>
      <EmptyState
        icon={<Sparkles size={24} />}
        title="Plan the week you actually have"
        body="Add work hours, field shifts, and commitments, then fit tasks and workouts around them."
        stage="Coming in stage 9"
      />
    </div>
  )
}

export function Goals() {
  const lvl = levelFromXp(470)
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Seasons, goals, and wins" title="My Goals" />
      <Card tone="lilac">
        <XPBar level={lvl.level} into={lvl.into} needed={lvl.needed} />
      </Card>
      <EmptyState
        icon={<Sparkles size={24} />}
        title="Start your first season"
        body="Name it, set a few goals, and watch small daily actions add up to something bigger."
        stage="Coming in stage 10"
      />
    </div>
  )
}

export function Fitness() {
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Strength, running, Pilates, HYROX" title="Fitness" />
      <EmptyState
        icon={<Dumbbell size={24} />}
        title="Your training home"
        body="Templates, logs, pull-up progress, and runs. For now, plan each day's workout from Home."
        stage="Coming in Phase 2"
      />
    </div>
  )
}

export function Closet() {
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Clothes, outfits, and plans" title="My Closet" />
      <EmptyState
        icon={<Shirt size={24} />}
        title="Build your digital closet"
        body="Photograph your clothes, build outfits from real pieces, and plan what to wear each day."
        stage="Coming in Phase 3"
      />
    </div>
  )
}
