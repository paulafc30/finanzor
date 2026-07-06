import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { UserPlus, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useSession } from '../hooks/useSession.js'
import { translateAuthError } from '../lib/authErrors.js'

/**
 * Pantalla de login / signup.
 *
 * UX: si el login falla (email no registrado o contraseña incorrecta —
 * Supabase no distingue por seguridad), mostramos un botón para "Crear
 * cuenta con este email" que cambia al modo signup manteniendo los
 * campos rellenos. Si el email ya existía, signup devolverá "User already
 * registered" y mostraremos el mensaje correspondiente.
 */
export default function Login() {
  const { user, loading } = useSession()
  const location = useLocation()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [signinFailed, setSigninFailed] = useState(false)

  if (loading) return null
  if (user) {
    const to = location.state?.from?.pathname ?? '/'
    return <Navigate to={to} replace />
  }

  function clearMessages() {
    setError(null)
    setInfo(null)
    setSigninFailed(false)
  }

  function switchMode(newMode) {
    setMode(newMode)
    clearMessages()
    // Mantenemos email y password rellenos al cambiar de modo
  }

  async function handleSubmit(e) {
    e.preventDefault()
    clearMessages()
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setSigninFailed(true)
          throw error
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Si el email requiere confirmación, data.user existe pero session es null
        if (data?.user && !data.session) {
          setInfo(
            'Te hemos enviado un correo para confirmar tu cuenta. Revisa tu bandeja de entrada (y la carpeta de spam).',
          )
        }
      }
    } catch (err) {
      setError(translateAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    clearMessages()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(translateAuthError(error))
  }

  function offerSignup() {
    setMode('signup')
    setSigninFailed(false)
    setError(null)
    setInfo('Rellena la contraseña que quieras para crear tu cuenta con este email.')
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
            onChange={(e) => {
              setEmail(e.target.value)
              clearMessages()
            }}
            className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/5 focus:ring-accent"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearMessages()
            }}
            className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/5 focus:ring-accent"
          />

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-danger/10 p-2.5 text-xs text-white ring-1 ring-danger/20">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />
              <p className="flex-1">{error}</p>
            </div>
          )}

          {info && !error && (
            <div className="flex items-start gap-2 rounded-lg bg-success/10 p-2.5 text-xs text-white ring-1 ring-success/20">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
              <p className="flex-1">{info}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent py-2.5 font-medium text-white hover:bg-accent-muted disabled:opacity-50"
          >
            {busy ? '…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>

          {/* Si el signin falla, sugerimos crear cuenta con el mismo email */}
          {signinFailed && mode === 'signin' && email && (
            <button
              type="button"
              onClick={offerSignup}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-bg-card py-2.5 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-bg-card/70"
            >
              <UserPlus size={15} />
              Crear cuenta con este email
            </button>
          )}
        </form>

        <div className="my-4 flex items-center gap-2 text-xs text-white/40">
          <span className="h-px flex-1 bg-white/10" /> o <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 font-medium text-gray-900 hover:bg-white/90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        <button
          type="button"
          onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-4 w-full text-center text-sm text-white/60 hover:text-white"
        >
          {mode === 'signin'
            ? '¿No tienes cuenta? Crear una'
            : '¿Ya tienes cuenta? Iniciar sesión'}
        </button>

        <p className="mt-6 text-center text-[11px] text-white/25">
          Hecho con ♥ por <span className="font-semibold tracking-wide">Ferava</span>
        </p>
      </div>
    </div>
  )
}
