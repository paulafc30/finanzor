import { useEffect, useState, useCallback } from 'react'
import {
  isPushSupported,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
  identifyUser,
} from '../lib/onesignal.js'
import { useSession } from './useSession.js'

/**
 * Hook para gestionar las notificaciones push del usuario.
 *
 * Devuelve:
 *  - supported: bool — si el navegador soporta Web Push
 *  - configured: bool — si VITE_ONESIGNAL_APP_ID está configurada
 *  - subscribed: bool — si el usuario está suscrito ahora
 *  - loading: bool — durante la consulta inicial o un toggle
 *  - error: string|null
 *  - subscribe() / unsubscribe(): toggles
 */
export function useNotifications() {
  const { user } = useSession()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const supported = isPushSupported()
  const configured = Boolean(import.meta.env.VITE_ONESIGNAL_APP_ID)

  // Estado inicial: comprobar si ya estaba suscrito
  useEffect(() => {
    let active = true
    if (!supported || !configured) {
      setLoading(false)
      return
    }
    isSubscribed()
      .then((v) => {
        if (active) setSubscribed(v)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [supported, configured])

  // Cuando cambia el user (login), etiquetarlo en OneSignal
  useEffect(() => {
    if (!supported || !configured || !user?.id) return
    identifyUser({ userId: user.id, email: user.email })
  }, [supported, configured, user?.id, user?.email])

  const subscribe = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const ok = await subscribeToPush()
      setSubscribed(!!ok)
    } catch (err) {
      setError(err.message ?? 'No se pudo activar las notificaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      await unsubscribeFromPush()
      setSubscribed(false)
    } catch (err) {
      setError(err.message ?? 'No se pudo desactivar')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    supported,
    configured,
    subscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
  }
}
