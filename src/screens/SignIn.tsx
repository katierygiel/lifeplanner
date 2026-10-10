import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { Button, cx } from '../components/ui'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

function friendly(msg: string) {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return "That email and password don't match. Try again or reset your password."
  if (m.includes('email not confirmed')) return 'Confirm your email first. Check your inbox for the link, then sign in here.'
  if (m.includes('already registered')) return 'That email already has an account. Sign in instead.'
  if (m.includes('password should be')) return 'Use a password with at least 6 characters.'
  if (m.includes('fetch')) return "Couldn't reach the server. Check your connection and try again."
  return msg
}

export default function SignIn() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (!email.includes('@')) return setError('Enter your email address.')
    if (password.length < 6) return setError('Use a password with at least 6 characters.')
    setBusy(true)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(friendly(error.message))
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setError(friendly(error.message))
      else if (!data.session) {
        setNotice('Account created. Check your email for a confirmation link, then come back here and sign in.')
        setMode('signin')
      }
    }
    setBusy(false)
  }

  const reset = async () => {
    setError(null)
    if (!email.includes('@')) return setError('Enter your email above first.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) setError(friendly(error.message))
    else setNotice('Password reset email sent.')
  }

  return (
    <div className="flex min-h-full items-center justify-center px-5 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="./favicon.svg" alt="" className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-[30px] font-extrabold tracking-tight">Level Up</h1>
          <p className="mt-1 text-[14px] text-ink-soft">Show up, not perfectly. Progress still counts.</p>
        </div>

        <div className="mb-4 flex rounded-full bg-white p-1 shadow-soft">
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setError(null)
              }}
              className={cx('relative flex-1 rounded-full py-2 text-[14px] font-semibold', mode === m ? 'text-ink' : 'text-ink-soft')}
            >
              {mode === m && <motion.span layoutId="auth-pill" className="absolute inset-0 rounded-full bg-peri-wash" />}
              <span className="relative">{m === 'signin' ? 'Sign in' : 'Create account'}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-card bg-white p-5 shadow-soft" noValidate>
          <label className="block">
            <span className="text-[13px] font-semibold text-ink-soft">Email</span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="you@example.com"
              className="mt-1 h-12 w-full rounded-btn bg-canvas px-4 text-[16px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-ink-soft">Password</span>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1 h-12 w-full rounded-btn bg-canvas px-4 text-[16px] outline-none ring-1 ring-line focus:ring-2 focus:ring-peri"
            />
          </label>
          {error && <p className="text-[13px] font-semibold text-[#B4456A]">{error}</p>}
          {notice && <p className="rounded-xl bg-lemon-soft px-3 py-2 text-[13px] font-semibold text-lemon-ink">{notice}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
          {mode === 'signin' && (
            <button type="button" onClick={reset} className="w-full pt-1 text-center text-[13px] font-semibold text-peri-deep">
              Forgot password?
            </button>
          )}
        </form>
      </motion.div>
    </div>
  )
}
