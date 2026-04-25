import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useSession } from '../hooks/useSession.js'

export default function Login() {
  const { user, loading } = useSession()
  const location = useLocation()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (loading) return null
  if (user) {
    const to = location.state?.from?.pathname ?? '/'
    return <Navigate to={to} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const fn =
        mode === 'signin'
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password })
      const { error } = await fn
      if (error) throw error
    } catch (err) {
      setError(err.message ?? 'Algo no fue bien')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm rounded-2xl bg-bg-elevated p-6 shadow-xl">
        <h1 className="mb-1 text-2xl font-semibold text-white">Finanzor</h1>
        <p className="mb-6 text-sm text-white/60">
          {mode === 'signin' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/5 focus:ring-accent"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/5 focus:ring-accent"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent py-2.5 font-medium text-white hover:bg-accent-muted disabled:opacity-50"
          >
            {busy ? '…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2 text-xs text-white/40">
          <span className="h-px flex-1 bg-white/10" /> o <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full rounded-lg bg-white py-2.5 font-medium text-gray-900 hover:bg-white/90"
        >
          Continuar con Google
        </button>

        <button
          type="button"
          onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
          className="mt-4 w-full text-center text-sm text-white/60 hover:text-white"
        >
          {mode === 'signin'
            ? '¿No tienes cuenta? Crear una'
            : '¿Ya tienes cuenta? Iniciar sesión'}
        </button>
      </div>
    </div>
  )
}
