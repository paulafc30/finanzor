import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'

/**
 * Mantiene la cache de TanStack Query y los flags de localStorage
 * sincronizados con la sesión actual de Supabase.
 *
 * Cuando cambia el usuario logado (login con otro email, logout, etc.):
 *   - Limpia toda la cache de queries (queryClient.clear()).
 *   - Borra los flags `finanzor.*` del localStorage para que el nuevo usuario
 *     no herede estados (auto-copy de presupuestos, materialización de
 *     recurrentes, banners descartados, etc.).
 *
 * Esto previene que, al cambiar de cuenta en el mismo navegador, el usuario
 * vea durante un instante datos del anterior, o que flags como
 * "este mes ya se copió el presupuesto" se compartan entre cuentas.
 *
 * Se monta una sola vez en App. NO incluir en cada componente.
 */
export function useAuthCacheSync() {
  const queryClient = useQueryClient()
  const lastUserIdRef = useRef(undefined) // 'undefined' = aún no inicializado

  useEffect(() => {
    function reset() {
      try {
        queryClient.clear()
      } catch {
        // ignorable: la cache ya estaba vacía
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          // Solo limpiamos las claves propias de la app
          const toRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('finanzor.')) toRemove.push(key)
          }
          for (const key of toRemove) localStorage.removeItem(key)
        }
      } catch {
        // ignorable
      }
    }

    // Inicialización: leer la sesión actual (si la hay) y guardar el id
    supabase.auth.getSession().then(({ data }) => {
      lastUserIdRef.current = data.session?.user?.id ?? null
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null
      const oldUserId = lastUserIdRef.current

      // En la primera carga, oldUserId es 'undefined' (aún no inicializado).
      // Solo reset si HUBO un cambio real entre dos sesiones distintas.
      const initialised = oldUserId !== undefined
      const userChanged = initialised && oldUserId !== newUserId

      if (userChanged) {
        reset()
      }

      // Casos explícitos en los que también queremos limpiar:
      // - SIGNED_OUT: por si por alguna razón newUserId quedó igual al anterior
      if (event === 'SIGNED_OUT') {
        reset()
      }

      lastUserIdRef.current = newUserId
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [queryClient])
}
