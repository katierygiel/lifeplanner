import { ArrowLeft, Download, LogOut, Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, Eyebrow } from '../components/ui'
import { exportAll, supabase, type Profile } from '../lib/supabase'

type Props = {
  email: string | undefined
  profile: Profile | null
  onSaveName: (name: string) => Promise<{ error: unknown }>
  onSaveSettings: (patch: Record<string, unknown>) => Promise<{ error: unknown }>
  onBack: () => void
  onOpenStyle: () => void
}

export default function Settings({ email, profile, onSaveName, onSaveSettings, onBack, onOpenStyle }: Props) {
  const [name, setName] = useState(profile?.display_name ?? '')
  const [status, setStatus] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [notes, setNotes] = useState((profile?.settings?.training_notes as string) ?? '')
  useEffect(() => setNotes((profile?.settings?.training_notes as string) ?? ''), [profile?.settings?.training_notes])

  const saveNotes = async () => {
    const { error } = await onSaveSettings({ training_notes: notes.trim() })
    setStatus(error ? "Couldn't save your training notes. Try again." : 'Saved')
    setTimeout(() => setStatus(null), 2000)
  }

  useEffect(() => setName(profile?.display_name ?? ''), [profile?.display_name])

  const saveName = async () => {
    const { error } = await onSaveName(name.trim())
    setStatus(error ? "Couldn't save your name. Try again." : 'Saved')
    setTimeout(() => setStatus(null), 2000)
  }

  const doExport = async () => {
    setExporting(true)
    setStatus(null)
    try {
      const data = await exportAll()
      const stamp = new Date().toISOString().slice(0, 10)
      const file = new File([JSON.stringify(data, null, 2)], `level-up-backup-${stamp}.json`, { type: 'application/json' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Level Up backup' })
      } else {
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
      }
      setStatus('Backup ready')
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus((e as Error).message)
    }
    setExporting(false)
  }

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2 px-1 pt-2">
        <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[28px] font-extrabold tracking-tight">Settings</h1>
      </header>

      <Card>
        <Eyebrow>Your name</Eyebrow>
        <p className="mt-1 text-[13px] text-ink-soft">Used in your greeting on Home.</p>
        <div className="mt-3 flex gap-2">
          <input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Katie"
            className="h-11 min-w-0 flex-1 rounded-btn bg-canvas px-4 text-[16px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
          />
          <Button variant="primary" onClick={saveName}>
            Save
          </Button>
        </div>
      </Card>

      <Card>
        <Eyebrow>About my training</Eyebrow>
        <p className="mt-1 text-[13px] text-ink-soft">Added to your ChatGPT workout request so plans fit your goals.</p>
        <textarea
          id="training-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="2 lower-body days, 2 upper-body, 1 run, plus walks. Working toward 20 pull-ups."
          className="mt-3 w-full rounded-2xl bg-canvas p-3 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
        />
        <Button variant="primary" className="mt-2 w-full" onClick={saveNotes}>
          Save training notes
        </Button>
      </Card>

      <Card>
        <Eyebrow>Your data</Eyebrow>
        <p className="mt-1 text-[13px] text-ink-soft">Download everything you've saved as one backup file.</p>
        <Button className="mt-3 w-full" onClick={doExport} disabled={exporting}>
          <Download size={18} /> {exporting ? 'Preparing…' : 'Export backup'}
        </Button>
      </Card>

      <Card>
        <Eyebrow>Account</Eyebrow>
        <p className="mt-1 text-[14px] font-semibold">{email}</p>
        <div className="mt-3 flex flex-col gap-2">
          <Button onClick={onOpenStyle}>
            <Palette size={18} /> Style guide
          </Button>
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
            <LogOut size={18} /> Sign out
          </Button>
        </div>
      </Card>

      {status && <p className="text-center text-[13px] font-semibold text-ink-soft">{status}</p>}
    </div>
  )
}
