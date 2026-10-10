import { createClient, type Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// Both values are designed to be public. Privacy comes from row-level security in the database.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'PASTE_PROJECT_URL'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_0yU4Zp9wFMBfNJNznNhuWw_5yYP-AdE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return { session, loading }
}

export type Profile = { id: string; display_name: string | null; settings: Record<string, unknown> }

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('id, display_name, settings')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setProfile(data))
  }, [userId])

  const update = async (patch: Partial<Pick<Profile, 'display_name' | 'settings'>>) => {
    if (!userId) return { error: new Error('Not signed in') }
    const { data, error } = await supabase.from('profiles').upsert({ id: userId, ...patch }).select().single()
    if (data) setProfile(data)
    return { error }
  }
  return { profile, update }
}

export const EXPORT_TABLES = [
  'profiles', 'tasks', 'schedule_blocks', 'habits', 'habit_logs', 'routines', 'routine_steps', 'routine_logs',
  'checkins', 'workouts_planned', 'seasons', 'goals', 'milestones', 'goal_habits', 'xp_events', 'achievements_earned',
] as const

export async function exportAll() {
  const out: Record<string, unknown> = { app: 'Level Up', exported_at: new Date().toISOString() }
  for (const t of EXPORT_TABLES) {
    const { data, error } = await supabase.from(t).select('*')
    if (error) throw new Error(`Couldn't read ${t}: ${error.message}`)
    out[t] = data
  }
  return out
}
