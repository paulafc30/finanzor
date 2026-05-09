import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'

/**
 * Inserta en batch una lista de movimientos en la BD del usuario.
 * Espera items con la forma: { type, amount, description, category_id, occurred_on }
 *
 * onSuccess invalida queries de transactions y monthly-summary.
 */
export function useBulkImportTransactions() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (items) => {
      if (!user) throw new Error('Sesión inválida')
      if (!items || items.length === 0) {
        return { inserted: 0 }
      }

      const rows = items.map((it) => ({
        user_id: user.id,
        type: it.type,
        amount: Number(it.amount),
        description: it.description?.trim() || null,
        category_id: it.category_id || null,
        occurred_on: it.occurred_on,
      }))

      // Validación previa
      for (const r of rows) {
        if (!['income', 'expense'].includes(r.type)) {
          throw new Error('Tipo inválido en alguna fila')
        }
        if (!Number.isFinite(r.amount) || r.amount <= 0) {
          throw new Error('Importe inválido en alguna fila')
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(r.occurred_on)) {
          throw new Error('Fecha inválida en alguna fila')
        }
      }

      const { error } = await supabase.from('transactions').insert(rows)
      if (error) throw error

      return { inserted: rows.length }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['monthly-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['previous-month-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['accumulated-balance', user?.id] })
      qc.invalidateQueries({ queryKey: ['budgets', user?.id] })
      qc.invalidateQueries({ queryKey: ['savings-from-expenses', user?.id] })
    },
  })
}
