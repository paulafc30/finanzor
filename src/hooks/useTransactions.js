import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'

/**
 * Lista las transacciones del mes seleccionado.
 *
 * IMPORTANTE: filtra por occurred_on (fecha real del movimiento), nunca por
 * created_at. Si el usuario registra hoy un gasto con fecha del mes anterior,
 * cuenta para el mes anterior.
 */
export function useTransactions() {
  const { user } = useSession()
  const { rangeStart, rangeEnd } = useMonth()

  return useQuery({
    queryKey: ['transactions', user?.id, rangeStart, rangeEnd],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          description,
          occurred_on,
          recurring_id,
          category:categories(id, name, icon, color)
        `)
        .gte('occurred_on', rangeStart)
        .lt('occurred_on', rangeEnd)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Mutación para crear un movimiento.
 * Tras éxito, invalida la lista del mes para refrescar.
 */
export function useCreateTransaction() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input) => {
      const payload = {
        user_id: user.id,
        type: input.type,
        amount: Number(input.amount),
        description: input.description?.trim() || null,
        category_id: input.category_id || null,
        occurred_on: input.occurred_on,
      }
      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['monthly-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['accumulated-balance', user?.id] })
      qc.invalidateQueries({ queryKey: ['previous-month-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['savings-from-expenses', user?.id] })
    },
  })
}

/**
 * Mutación para editar un movimiento.
 * Solo se actualizan los campos presentes en el patch.
 */
export function useUpdateTransaction() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const cleaned = {}
      if (patch.type !== undefined) cleaned.type = patch.type
      if (patch.amount !== undefined) cleaned.amount = Number(patch.amount)
      if (patch.description !== undefined) {
        cleaned.description = patch.description?.trim() || null
      }
      if (patch.category_id !== undefined) {
        cleaned.category_id = patch.category_id || null
      }
      if (patch.occurred_on !== undefined) cleaned.occurred_on = patch.occurred_on

      const { data, error } = await supabase
        .from('transactions')
        .update(cleaned)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['monthly-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['budgets', user?.id] })
      qc.invalidateQueries({ queryKey: ['accumulated-balance', user?.id] })
      qc.invalidateQueries({ queryKey: ['previous-month-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['savings-from-expenses', user?.id] })
    },
  })
}

/**
 * Mutación para borrar un movimiento.
 */
export function useDeleteTransaction() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['monthly-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['accumulated-balance', user?.id] })
      qc.invalidateQueries({ queryKey: ['previous-month-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['savings-from-expenses', user?.id] })
    },
  })
}
