import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useSession } from './useSession.js'
import Onboarding from '../components/onboarding/Onboarding.jsx'

/**
 * Provider del onboarding (tutorial de bienvenida).
 *
 * Encapsula:
 *  - Decisión automática de mostrarlo la primera vez que entra un usuario.
 *  - Persistencia por user.id en localStorage (cada cuenta lo ve una vez).
 *  - Función `replay()` para que el usuario lo abra de nuevo desde Ajustes.
 *  - Lista TEMPORAL de emails que ven el tutorial CADA vez que inician
 *    sesión (útil para enseñar la app a alguien sin tener que pulsar
 *    "Ver tutorial" cada vez).
 */
const KEY_PREFIX = 'finanzor.onboardingDone:'

// === MODO DEMO: emails que verán el tutorial CADA login ===
// Útil para que personas que están aprendiendo la app no tengan que pulsar
// "Ver tutorial" manualmente. Quitar de aquí cuando ya no haga falta.
const FORCE_ONBOARDING_EMAILS = [
  'paulacmtk72@gmail.com', // cuenta de demo / madre
]

function isForcedEmail(email) {
  if (!email) return false
  return FORCE_ONBOARDING_EMAILS.includes(email.toLowerCase())
}

const OnboardingContext = createContext({ replay: () => {} })

export function OnboardingProvider({ children }) {
  const { user, loading } = useSession()
  const [open, setOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user?.id) {
      setOpen(false)
      setHydrated(true)
      return
    }

    // Modo demo: siempre se muestra, ignorando localStorage
    if (isForcedEmail(user.email)) {
      setOpen(true)
      setHydrated(true)
      return
    }

    try {
      const done = localStorage.getItem(KEY_PREFIX + user.id) === '1'
      setOpen(!done)
    } catch {
      setOpen(true)
    } finally {
      setHydrated(true)
    }
  }, [user?.id, user?.email, loading])

  const markCompleted = useCallback(() => {
    setOpen(false)
    // Si es cuenta forzada, NO guardamos el flag — así la próxima vez vuelve a aparecer.
    if (isForcedEmail(user?.email)) return
    try {
      if (user?.id) localStorage.setItem(KEY_PREFIX + user.id, '1')
    } catch {
      // ignorable
    }
  }, [user?.id, user?.email])

  const replay = useCallback(() => {
    setOpen(true)
  }, [])

  return (
    <OnboardingContext.Provider value={{ replay }}>
      {children}
      {hydrated && <Onboarding open={open} onComplete={markCompleted} />}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  return useContext(OnboardingContext)
}
