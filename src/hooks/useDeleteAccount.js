import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'

/**
 * Borra la cuenta del usuario actual de verdad: llama a la Edge Function
 * `delete-account` (supabase/functions/delete-account/index.ts), que borra
 * su fila de `auth.users` usando la service_role key (solo puede vivir en
 * el servidor, nunca en el frontend).
 *
 * Todas las tablas de dominio (movimientos, categorias, presupuestos,
 * gastos/ingresos fijos, metas, aportaciones) tienen
 * `references auth.users(id) on delete cascade`, asi que se borran solas
 * en cuanto se borra el usuario — no hace falta la RPC `delete_my_account`
 * como paso previo.
 *
 * El usuario NO puede volver a iniciar sesion con el mismo email/Google
 * despues de esto: la cuenta ha desaparecido de verdad.
 *
 * Despues de borrar:
 *   - Limpia la cache de React Query.
 *   - Limpia las flags de localStorage que usamos para evitar repetir
 *     copias automaticas de presupuestos o el onboarding.
 *   - Cierra sesion via supabase.auth.signOut(), lo que redirige a /login
 *     gracias a RequireAuth.
 */
export function useDeleteAccount() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      })
      if (error) throw error
    },
    onSuccess: async () => {
      // 1) Vaciar cache: si quedara algo, en el render siguiente no debe
      //    pintarse nada del usuario que acabamos de borrar.
      qc.clear()

      // 2) Limpiar flags de localStorage especificas de la app.
      try {
        for (const k of Object.keys(window.localStorage)) {
          if (k.startsWith('finanzor.')) {
            window.localStorage.removeItem(k)
          }
        }
      } catch {
        /* ignore */
      }

      // 3) Cerrar sesion. RequireAuth redirige a /login automaticamente.
      await supabase.auth.signOut()
    },
  })
}
