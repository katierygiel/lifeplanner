import { Dumbbell, Shirt, Sparkles } from 'lucide-react'
import { EmptyState } from '../components/ui'

function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="px-1 pb-2 pt-2">
      <div className="text-[13px] font-semibold text-ink-soft">{eyebrow}</div>
      <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">{title}</h1>
    </header>
  )
}

export function Goals() {
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Seasons, goals, and wins" title="My Goals" />
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
