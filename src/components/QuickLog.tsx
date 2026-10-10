import { useFitness } from '../lib/useFitness'
import WorkoutLogSheet, { type LogPreset } from './WorkoutLogSheet'

// Loads fitness data only when opened, so Home stays fast.
export default function QuickLog({ preset, onClose }: { preset: LogPreset; onClose: () => void }) {
  const f = useFitness()
  if (f.loading) return null
  return <WorkoutLogSheet open log={null} preset={preset} logs={f.logs} templates={f.templates} onClose={onClose} onSave={f.saveLog} onDelete={f.deleteLog} />
}
