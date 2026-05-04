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
        .select('id, amount, contributed_on, created_at')
        .eq('goal_id', goalId)
        .order('contributed_on', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

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

      const { data, error } = await supabase
        .from('goal_contributions')
        .insert({
          user_id: user.id,
          goal_id,
          amount: value,
          contributed_on,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['goal-contributions', user?.id, vars.goal_id] })
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
  })
}

export function useDeleteContribution() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id /* , goal_id */ }) => {
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
    },
  })
}
