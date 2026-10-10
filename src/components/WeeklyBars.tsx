import { useState } from 'react'

export type Bar = { key: string; label: string; value: number; detail: string }

// One series, one hue: bars rounded at the top, anchored to the baseline. Tap or hover a bar for its value.
export default function WeeklyBars({ title, bars, unit }: { title: string; bars: Bar[]; unit: string }) {
  const [active, setActive] = useState<number | null>(null)
  const W = 320, H = 132, padB = 22, padT = 22
  const max = Math.max(1, ...bars.map((b) => b.value))
  const slot = W / bars.length
  const bw = Math.min(26, slot - 10)
  const y = (v: number) => H - padB - ((H - padB - padT) * v) / max
  const shown = active ?? bars.length - 1
  const s = bars[shown]
  return (
    <figure>
      <figcaption className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold">{title}</span>
        {s && (
          <span className="text-[12px] text-ink-soft">
            {s.detail}: <b className="tabular-nums text-ink">{s.value}</b> {s.value === 1 ? unit.replace(/s$/, "") : unit}
          </span>
        )}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={`${title}: ${bars.map((b) => `${b.detail} ${b.value}`).join(', ')}`} onMouseLeave={() => setActive(null)}>
        <line x1="0" x2={W} y1={y(max)} y2={y(max)} stroke="var(--color-line)" strokeDasharray="3 4" />
        <text x={W} y={y(max) - 5} textAnchor="end" fontSize="10" fill="var(--color-ink-faint)">
          {max}
        </text>
        <line x1="0" x2={W} y1={H - padB} y2={H - padB} stroke="var(--color-line)" />
        {bars.map((b, i) => {
          const x = i * slot + (slot - bw) / 2
          const top = y(b.value)
          const h = H - padB - top
          const on = i === shown
          return (
            <g key={b.key} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} style={{ cursor: 'pointer' }}>
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              {h > 0 && <path d={`M${x},${H - padB} V${top + 4} Q${x},${top} ${x + 4},${top} H${x + bw - 4} Q${x + bw},${top} ${x + bw},${top + 4} V${H - padB} Z`} fill={on ? 'var(--color-peri-deep)' : 'var(--color-peri-soft)'} />}
              <text x={i * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize="10" fontWeight={on ? 700 : 500} fill={on ? 'var(--color-ink)' : 'var(--color-ink-faint)'}>
                {b.label}
              </text>
            </g>
          )
        })}
      </svg>
      <table className="sr-only">
        <tbody>
          {bars.map((b) => (
            <tr key={b.key}>
              <td>{b.detail}</td>
              <td>{b.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
