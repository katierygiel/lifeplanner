import { Activity, ClipboardPaste, Dumbbell, Flag, Footprints, Medal, PersonStanding, Plus, Trophy, Waves, X, Zap, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PullupSheet, RaceSheet } from '../components/FitnessSheets'
import { Card, Eyebrow, SectionTitle, cx } from '../components/ui'
import WorkoutLogSheet, { type LogPreset } from '../components/WorkoutLogSheet'
import { addDays, dayLabel, fromDay, today } from '../lib/dates'
import { kindLabel, KINDS, pace, pullupStatus, runPRs, strengthPRs, VARIATIONS, weekTotals } from '../lib/fitness'
import type { PullupLog, Race, WorkoutKind, WorkoutLog } from '../lib/types'
import { useFitness } from '../lib/useFitness'
import { mondayOf } from '../lib/useWeek'

const ICON: Record<WorkoutKind, LucideIcon> = {
  strength: Dumbbell, run: Zap, walk: Footprints, pilates: PersonStanding, mobility: Waves, hyrox: Flag, other: Activity,
}
const fmt = (d: string) => fromDay(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function Fitness() {
  const f = useFitness()
  const t0 = today()
  const weekStart = mondayOf(t0)
  const [logSheet, setLogSheet] = useState<{ open: boolean; log: WorkoutLog | null; preset?: LogPreset }>({ open: false, log: null })
  const [puSheet, setPuSheet] = useState<{ open: boolean; entry: PullupLog | null }>({ open: false, entry: null })
  const [raceSheet, setRaceSheet] = useState<{ open: boolean; race: Race | null }>({ open: false, race: null })
  const [showAll, setShowAll] = useState(false)

  const week = weekTotals(f.logs, weekStart)
  const pu = pullupStatus(f.pullups)
  const prs = useMemo(() => strengthPRs(f.logs), [f.logs])
  const runs = useMemo(() => runPRs(f.logs), [f.logs])
  const nextRace = [...f.races].filter((r) => r.date >= t0).sort((a, b) => a.date.localeCompare(b.date))[0]
  const pastRaces = f.races.filter((r) => r.date < t0)
  const daysTo = (d: string) => Math.round((fromDay(d).getTime() - fromDay(t0).getTime()) / 86400000)
  const history = showAll ? f.logs : f.logs.slice(0, 8)
  const recentPU = f.pullups.slice(0, 8)
  const maxPU = Math.max(1, ...recentPU.map((p) => p.best_reps))

  return (
    <div className="space-y-3">
      <header className="flex items-end justify-between px-1 pb-2 pt-2">
        <div>
          <div className="text-[13px] font-semibold text-ink-soft">Strength, runs, Pilates, HYROX</div>
          <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">Fitness</h1>
        </div>
        <button onClick={() => setLogSheet({ open: true, log: null })} className="flex h-10 items-center gap-1 rounded-full bg-peri-deep px-4 text-[13px] font-bold text-white">
          <Plus size={16} /> Log
        </button>
      </header>

      {f.error && (
        <Card tone="lilac" className="flex items-start gap-3">
          <p className="flex-1 text-[13px] font-semibold">
            {f.error}
            {/relation|does not exist|schema cache/i.test(f.error) ? ' The fitness tables may not be set up yet. Run the Phase 2–3 setup file in Supabase.' : ''}
          </p>
          <button onClick={f.clearError} className="text-[13px] font-bold text-peri-deep">OK</button>
        </Card>
      )}

      {/* This week */}
      <Card tone="peri">
        <Eyebrow>This week</Eyebrow>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Big value={week.sessions} label={week.sessions === 1 ? 'workout' : 'workouts'} />
          <Big value={week.minutes} label="minutes" />
          <Big value={week.km} label="km" />
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => {
            const n = f.logs.filter((l) => l.date === d).length
            return (
              <div key={d} className="flex flex-1 flex-col items-center gap-1">
                <span className={cx('h-2.5 w-full rounded-full', n ? 'bg-peri-deep' : 'bg-white/80')} />
                <span className={cx('text-[10px] font-bold', d === t0 ? 'text-peri-deep' : 'text-ink-faint')}>
                  {fromDay(d).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                </span>
              </div>
            )
          })}
        </div>
        {week.sessions > 0 && (
          <p className="mt-2 text-[12px] font-semibold text-ink-soft">
            {KINDS.filter((k) => week.byKind[k.id])
              .map((k) => `${week.byKind[k.id]} ${k.label.toLowerCase()}`)
              .join(' · ')}
          </p>
        )}
      </Card>

      <button
        onClick={() => setLogSheet({ open: true, log: null, preset: { kind: 'strength', paste: true } })}
        className="flex w-full items-center gap-3 rounded-card bg-lemon-soft p-4 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lemon">
          <ClipboardPaste size={18} className="text-lemon-ink" />
        </span>
        <span>
          <span className="block text-[15px] font-bold">Paste from Notes</span>
          <span className="block text-[12px] text-ink-soft">Paste your workout the way you write it and it fills in exercises, sets, and weights.</span>
        </span>
      </button>

      {/* Quick log */}
      <div className="grid grid-cols-3 gap-2">
        {KINDS.filter((k) => k.id !== 'other').map((k) => {
          const Icon = ICON[k.id]
          return (
            <button key={k.id} onClick={() => setLogSheet({ open: true, log: null, preset: { kind: k.id } })} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white py-3 shadow-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-peri-wash text-peri-deep">
                <Icon size={18} />
              </span>
              <span className="text-[12px] font-bold">{k.label}</span>
            </button>
          )
        })}
      </div>

      {/* Pull-ups */}
      <SectionTitle
        title="Road to 20 pull-ups"
        action={
          <button onClick={() => setPuSheet({ open: true, entry: null })} className="flex items-center gap-1 text-[13px] font-bold text-peri-deep">
            <Plus size={16} /> Log
          </button>
        }
      />
      <Card>
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold">Best strict set</span>
          <span className="text-[13px] font-semibold text-ink-soft">
            <b className="text-[22px] font-extrabold text-ink">{pu.bestStrict}</b> / {pu.goal}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-canvas">
          <div className="h-full rounded-full bg-lemon-deep" style={{ width: `${Math.max(pu.ratio * 100, pu.bestStrict ? 3 : 0)}%` }} />
        </div>
        <div className="mt-3 flex gap-1">
          {VARIATIONS.filter((v) => v.id !== 'assisted').map((v) => {
            const reached = f.pullups.some((p) => (VARIATIONS.find((x) => x.id === p.variation)?.level ?? 0) >= v.level)
            return (
              <span key={v.id} className={cx('flex-1 rounded-lg px-1 py-1.5 text-center text-[10.5px] font-bold leading-tight', reached ? 'bg-lilac text-ink' : 'bg-canvas text-ink-faint')}>
                {v.label.replace(' pull-ups', '').replace('-assisted', '')}
              </span>
            )
          })}
        </div>
        {recentPU.length === 0 ? (
          <p className="mt-3 text-[13px] text-ink-soft">Log negatives, band, or strict sets as you go. You'll see your progress build here.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {recentPU.map((p) => (
              <li key={p.id}>
                <button onClick={() => setPuSheet({ open: true, entry: p })} className="flex w-full items-center gap-2 text-left">
                  <span className="w-12 shrink-0 text-[11px] font-semibold text-ink-faint">{fmt(p.date)}</span>
                  <span className="h-5 flex-1 overflow-hidden rounded-md bg-canvas">
                    <span className={cx('block h-full rounded-md', p.variation === 'strict' ? 'bg-peri-deep' : 'bg-peri-soft')} style={{ width: `${(p.best_reps / maxPU) * 100}%` }} />
                  </span>
                  <span className="w-28 shrink-0 text-right text-[11px] font-semibold text-ink-soft">
                    <b className="text-ink">{p.best_reps}</b> {VARIATIONS.find((v) => v.id === p.variation)?.label.toLowerCase()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Races */}
      <SectionTitle
        title="HYROX and races"
        action={
          <button onClick={() => setRaceSheet({ open: true, race: null })} className="flex items-center gap-1 text-[13px] font-bold text-peri-deep">
            <Plus size={16} /> Race
          </button>
        }
      />
      {nextRace ? (
        <button onClick={() => setRaceSheet({ open: true, race: nextRace })} className="flex w-full items-center gap-3 rounded-card bg-lemon-soft p-4 text-left">
          <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-lemon">
            <span className="text-[17px] font-extrabold leading-none">{daysTo(nextRace.date)}</span>
            <span className="text-[9px] font-bold uppercase">days</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-bold">{nextRace.name}</span>
            <span className="block text-[12px] text-ink-soft">
              {fromDay(nextRace.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {nextRace.division ? ` · ${nextRace.division}` : ''}
            </span>
          </span>
        </button>
      ) : (
        <button onClick={() => setRaceSheet({ open: true, race: null })} className="w-full rounded-card border-2 border-dashed border-line px-4 py-4 text-left text-[13px] text-ink-soft">
          Add your next HYROX or race to count down to it.
        </button>
      )}
      {pastRaces.map((r) => (
        <button key={r.id} onClick={() => setRaceSheet({ open: true, race: r })} className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-soft">
          <Medal size={18} className="shrink-0 text-lemon-ink" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-bold">{r.name}</span>
            <span className="block text-[12px] text-ink-soft">{fmt(r.date)}{r.result ? ` · ${r.result}` : ' · add your result'}</span>
          </span>
        </button>
      ))}

      {/* Records */}
      {(prs.length > 0 || runs.longest) && (
        <>
          <SectionTitle title="Personal records" />
          <Card className="px-2 py-2">
            {runs.longest && <Record icon={Trophy} label="Longest run" value={`${Number(runs.longest.distance_km)} km`} date={runs.longest.date} />}
            {runs.fastest && <Record icon={Zap} label="Fastest pace" value={pace(runs.fastest.duration_min, Number(runs.fastest.distance_km)) ?? ''} date={runs.fastest.date} />}
            {prs.slice(0, 8).map((p) => (
              <Record key={p.name} icon={Dumbbell} label={p.name} value={`${p.weight} lb × ${p.reps}`} date={p.date} />
            ))}
          </Card>
        </>
      )}

      {/* Templates */}
      {f.templates.length > 0 && (
        <>
          <SectionTitle title="Templates" />
          <div className="flex flex-wrap gap-2">
            {[...f.templates]
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((t) => (
                <span key={t.id} className="flex items-center rounded-full bg-white shadow-soft">
                  <button onClick={() => setLogSheet({ open: true, log: null, preset: { title: t.title, kind: t.kind } })} className="py-2 pl-3.5 pr-1 text-[13px] font-semibold">
                    {t.title} <span className="text-ink-faint">· {t.exercises.length}</span>
                  </button>
                  <button aria-label={`Delete template ${t.title}`} onClick={() => f.deleteTemplate(t.id)} className="flex h-8 w-8 items-center justify-center text-ink-faint">
                    <X size={14} />
                  </button>
                </span>
              ))}
          </div>
        </>
      )}

      {/* History */}
      <SectionTitle title="History" />
      {f.logs.length === 0 ? (
        <Card className="text-center">
          <p className="text-[15px] font-bold">No workouts logged yet</p>
          <p className="mt-1 text-[13px] text-ink-soft">Tap a type above, or finish today's workout on Home and tap "Log details".</p>
        </Card>
      ) : (
        <Card className="px-2 py-2">
          {history.map((l) => {
            const Icon = ICON[l.kind]
            const bits = [
              l.duration_min ? `${l.duration_min} min` : null,
              l.distance_km ? `${Number(l.distance_km)} km` : null,
              pace(l.duration_min, l.distance_km ? Number(l.distance_km) : null),
              l.exercises.length ? `${l.exercises.length} exercises` : null,
              l.version && l.version !== 'full' ? `${l.version} version` : null,
            ].filter(Boolean)
            return (
              <button key={l.id} onClick={() => setLogSheet({ open: true, log: l })} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-canvas">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-peri-wash text-peri-deep">
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold">{l.title}</span>
                  <span className="block truncate text-[12px] text-ink-soft">{bits.join(' · ') || kindLabel(l.kind)}</span>
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-ink-faint">{dayLabel(l.date)}</span>
              </button>
            )
          })}
          {f.logs.length > 8 && (
            <button onClick={() => setShowAll((s) => !s)} className="w-full py-2 text-[12px] font-bold text-peri-deep">
              {showAll ? 'Show less' : `Show all ${f.logs.length}`}
            </button>
          )}
        </Card>
      )}
      <div className="h-6" />

      <WorkoutLogSheet
        open={logSheet.open}
        log={logSheet.log}
        preset={logSheet.preset}
        logs={f.logs}
        templates={f.templates}
        onClose={() => setLogSheet((s) => ({ ...s, open: false }))}
        onSave={f.saveLog}
        onDelete={f.deleteLog}
      />
      <PullupSheet open={puSheet.open} entry={puSheet.entry} onClose={() => setPuSheet((s) => ({ ...s, open: false }))} onSave={f.savePullup} onDelete={f.deletePullup} />
      <RaceSheet open={raceSheet.open} race={raceSheet.race} onClose={() => setRaceSheet((s) => ({ ...s, open: false }))} onSave={f.saveRace} onDelete={f.deleteRace} />
    </div>
  )
}

function Big({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/80 px-3 py-2.5">
      <div className="text-[24px] font-extrabold tabular-nums leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-bold text-ink-soft">{label}</div>
    </div>
  )
}

function Record({ icon: Icon, label, value, date }: { icon: LucideIcon; label: string; value: string; date: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Icon size={16} className="shrink-0 text-lemon-ink" />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{label}</span>
      <span className="text-[14px] font-extrabold tabular-nums">{value}</span>
      <span className="w-12 shrink-0 text-right text-[11px] text-ink-faint">{fmt(date)}</span>
    </div>
  )
}
