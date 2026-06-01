import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'

/**
 * Borra todos los datos del usuario actual (movimientos, categorias,
 * presupuestos, gastos/ingresos fijos, metas, aportaciones, feedback)
 * llamando a la funcion RPC `delete_my_account` definida en
 * `supabase/migrations/0007_delete_my_account.sql`.
 *
 * El registro de `auth.users` no se borra: el usuario podria volver a
 * iniciar sesion con el mismo email, pero veria la app vacia (como una
 * cuenta recien creada).
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
      const { error } = await supabase.rpc('delete_my_account')
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
