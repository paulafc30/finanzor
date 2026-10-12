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
 */
const KEY_PREFIX = 'finanzor.onboardingDone:'

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

    try {
      const done = localStorage.getItem(KEY_PREFIX + user.id) === '1'
      setOpen(!done)
    } catch {
      setOpen(true)
    } finally {
      setHydrated(true)
    }
  }, [user?.id, loading])

  const markCompleted = useCallback(() => {
    setOpen(false)
    try {
      if (user?.id) localStorage.setItem(KEY_PREFIX + user.id, '1')
    } catch {
      // ignorable
    }
  }, [user?.id])

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
