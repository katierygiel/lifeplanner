import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CheckRow, Chip, Eyebrow, ProgressRing, TierChip, XPBar } from '../components/ui'

const SWATCHES = [
  { name: 'Ink', hex: '#3A3768', use: 'Text' },
  { name: 'Periwinkle', hex: '#9AA8FF', use: 'Progress, accents' },
  { name: 'Periwinkle deep', hex: '#7484F2', use: 'Buttons, active tab' },
  { name: 'Periwinkle soft', hex: '#C9D3FF', use: 'Chips, selected' },
  { name: 'Lilac', hex: '#E6D9FF', use: 'XP, goals' },
  { name: 'Lemon', hex: '#FFF2A8', use: 'Highlights, wins' },
  { name: 'Lemon deep', hex: '#FFE066', use: 'Completed checks' },
  { name: 'Mint', hex: '#CDEFE0', use: 'Recovery' },
  { name: 'Canvas', hex: '#F7F5FF', use: 'Background' },
]

export default function StyleGuide({ onBack }: { onBack: () => void }) {
  const [checked, setChecked] = useState(false)
  const [chip, setChip] = useState(0)
  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2 px-1 pt-2">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white md:hidden">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[28px] font-extrabold tracking-tight">Style guide</h1>
      </header>

      <Card>
        <Eyebrow>Colors</Eyebrow>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {SWATCHES.map((s) => (
            <div key={s.name}>
              <div className="h-14 rounded-2xl ring-1 ring-black/5" style={{ background: s.hex }} />
              <div className="mt-1.5 text-[12px] font-bold leading-tight">{s.name}</div>
              <div className="text-[11px] text-ink-soft">{s.use}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Eyebrow>Type · Plus Jakarta Sans</Eyebrow>
        <div className="mt-3 space-y-1.5">
          <div className="text-[28px] font-extrabold leading-tight tracking-tight">Page title 28</div>
          <div className="text-[17px] font-bold">Section title 17</div>
          <div className="text-[15px] font-semibold">Item title 15</div>
          <div className="text-[14px] text-ink-soft">Body and supporting text 14</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">Eyebrow label 11</div>
        </div>
      </Card>

      <Card>
        <Eyebrow>Buttons and chips</Eyebrow>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary">Start check-in</Button>
          <Button>Move to Friday</Button>
          <Button variant="ghost">Skip for now</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Full plan', 'Shorter day', 'Essentials'].map((l, i) => (
            <Chip key={l} selected={chip === i} onClick={() => setChip(i)}>
              {l}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <TierChip tier="must" />
          <TierChip tier="flexible" />
          <TierChip tier="optional" />
          <TierChip tier="recovery" />
        </div>
      </Card>

      <Card>
        <Eyebrow>Progress</Eyebrow>
        <div className="mt-3 flex items-center gap-4">
          <ProgressRing value={0.6}>
            <span className="text-[13px] font-extrabold">60%</span>
          </ProgressRing>
          <ProgressRing value={1}>
            <span className="text-[13px] font-extrabold">Done</span>
          </ProgressRing>
          <div className="flex-1">
            <XPBar level={4} into={120} needed={250} />
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-canvas px-1">
          <CheckRow title="Tap me to check off" meta="Shows the XP pop" tier="must" xp={20} done={checked} onToggle={() => setChecked((c) => !c)} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card tone="lemon"><Eyebrow className="text-lemon-ink">Lemon card</Eyebrow><p className="mt-1 text-[13px]">Today's priority, wins</p></Card>
        <Card tone="lilac"><Eyebrow>Lilac card</Eyebrow><p className="mt-1 text-[13px]">XP, goals, seasons</p></Card>
        <Card tone="peri"><Eyebrow>Periwinkle card</Eyebrow><p className="mt-1 text-[13px]">Workouts, plans</p></Card>
        <Card tone="mint"><Eyebrow className="text-mint-ink">Mint card</Eyebrow><p className="mt-1 text-[13px]">Recovery, rest</p></Card>
      </div>
      <div className="h-4" />
    </div>
  )
}
