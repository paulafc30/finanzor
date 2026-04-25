import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * Hook que devuelve la sesión actual de Supabase.
 * - loading: true mientras se resuelve la sesión inicial
 * - session: el objeto sesión o null
 * - user: shortcut a session?.user
 *
 * Reacciona automáticamente a login/logout via onAuthStateChange.
 */
export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { session, user: session?.user ?? null, loading }
}
