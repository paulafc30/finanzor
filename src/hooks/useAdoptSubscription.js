import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useCreateRecurring } from './useRecurringExpenses.js'

/**
 * Convierte una suscripción detectada en un recurrente.
 *
 * Importante: si el último cargo cae en el mes en curso, se enlaza al nuevo
 * recurrente (recurring_id). Así `useMaterializeRecurring` sabe que este mes
 * ya está generado y NO duplica el movimiento.
 */
export function useAdoptSubscription() {
  const { user } = useSession()
  const qc = useQueryClient()
  const createRecurring = useCreateRecurring()

  return useMutation({
    mutationFn: async ({ sub, category_id }) => {
      const created = await createRecurring.mutateAsync({
        name: sub.name,
        amount: sub.amount,
        category_id,
        frequency: sub.frequency,
        day_of_month: sub.day_of_month,
        day_of_week: sub.day_of_week,
        type: 'expense',
      })

      const thisMonth = format(new Date(), 'yyyy-MM')
      if (sub.lastTransactionId && sub.lastDate.startsWith(thisMonth)) {
        const { error } = await supabase
          .from('transactions')
          .update({ recurring_id: created.id })
          .eq('id', sub.lastTransactionId)
          .eq('user_id', user.id)
        if (error) throw error
      }
      return created
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['recurring', user?.id] })
    },
  })
}
