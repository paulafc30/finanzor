import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'

/**
 * Lista las aportaciones de una meta, ordenadas por fecha desc.
 */
export function useGoalContributions(goalId) {
  const { user } = useSession()

  return useQuery({
    queryKey: ['goal-contributions', user?.id, goalId],
    enabled: !!user && !!goalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_contributions')
        .select('id, amount, contributed_on, created_at, transaction_id')
        .eq('goal_id', goalId)
        .order('contributed_on', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Crea una aportación a una meta de ahorro.
 *
 * IMPORTANTE: cada aporte se refleja también como un movimiento en
 * `transactions` (tipo expense, categoría "Ahorro") con descripción
 * `"Ahorro: <nombre de la meta>"`. Así Movimientos y estadísticas
 * registran el dinero que se sale de la cuenta hacia ahorro. El
 * `transaction_id` queda enlazado en la contribución para poder
 * borrarlos en cascada al eliminar el aporte.
 *
 * Si no encontramos la categoría "Ahorro" (el usuario la renombró)
 * caemos al fallback de crear el aporte sin movimiento asociado en
 * vez de fallar.
 */
export function useCreateContribution() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ goal_id, amount, contributed_on }) => {
      const value = Number(amount)
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('El importe debe ser mayor que 0')
      }
      if (!contributed_on) throw new Error('Fecha obligatoria')

      // 1) Leer en paralelo: nombre de la meta + id de la categoría "Ahorro"
      const [{ data: goal }, { data: cat }] = await Promise.all([
        supabase.from('goals').select('id, name').eq('id', goal_id).single(),
        supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', 'Ahorro')
          .maybeSingle(),
      ])

      // 2) Crear el movimiento (si la categoría existe; si no, fallback)
      let transactionId = null
      if (cat?.id) {
        const goalName = goal?.name ?? 'Meta'
        const { data: tx, error: txErr } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'expense',
            amount: value,
            description: `Ahorro: ${goalName}`,
            category_id: cat.id,
            occurred_on: contributed_on,
          })
          .select('id')
          .single()
        if (txErr) throw txErr
        transactionId = tx.id
      }

      // 3) Crear la contribución (con o sin transaction_id)
      const { data, error } = await supabase
        .from('goal_contributions')
        .insert({
          user_id: user.id,
          goal_id,
          amount: value,
          contributed_on,
          transaction_id: transactionId,
        })
        .select()
        .single()

      if (error) {
        // Si falla la contribución pero ya creamos la transacción,
        // intentamos revertirla para no dejar movimientos huérfanos.
        if (transactionId) {
          await supabase.from('transactions').delete().eq('id', transactionId)
        }
        throw error
      }
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ['goal-contributions', user?.id, vars.goal_id],
      })
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['savings-from-expenses', user?.id] })
      qc.invalidateQueries({ queryKey: ['monthly-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['accumulated-balance', user?.id] })
      qc.invalidateQueries({ queryKey: ['expense-comparison', user?.id] })
      qc.invalidateQueries({ queryKey: ['budgets', user?.id] })
      qc.invalidateQueries({ queryKey: ['carry-forward', user?.id] })
    },
  })
}

/**
 * Elimina una aportación. Si la aportación tiene movimiento asociado
 * (`transaction_id`), también lo borra para mantener consistencia entre
 * Ahorro y Movimientos.
 */
export function useDeleteContribution() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id /* , goal_id */ }) => {
      // 1) Leer la contribución para conocer su transaction_id
      const { data: contrib, error: readErr } = await supabase
        .from('goal_contributions')
        .select('transaction_id')
        .eq('id', id)
        .single()
      if (readErr) throw readErr

      // 2) Borrar el movimiento asociado (si existe)
      if (contrib?.transaction_id) {
        const { error: txErr } = await supabase
          .from('transactions')
          .delete()
          .eq('id', contrib.transaction_id)
        if (txErr) throw txErr
      }

      // 3) Borrar la contribución
      const { error } = await supabase
        .from('goal_contributions')
        .delete()
        .eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goal-contributions', user?.id] })
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['savings-from-expenses', user?.id] })
      qc.invalidateQueries({ queryKey: ['monthly-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['accumulated-balance', user?.id] })
      qc.invalidateQueries({ queryKey: ['expense-comparison', user?.id] })
      qc.invalidateQueries({ queryKey: ['budgets', user?.id] })
      qc.invalidateQueries({ queryKey: ['carry-forward', user?.id] })
    },
  })
}
