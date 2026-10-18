import { useQuery } from '@tanstack/react-query'
import { format, subMonths } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'

/**
 * Histórico de los últimos `months` meses (por defecto 12), de más reciente
 * a más antiguo. Alimenta la detección de suscripciones y gastos hormiga.
 *
 * La queryKey empieza por ['transactions', userId] para que cualquier
 * alta/importación/borrado que invalide 'transactions' lo refresque.
 */
export function useTransactionHistory(months = 12) {
  const { user } = useSession()

  return useQuery({
    queryKey: ['transactions', user?.id, 'history', months],
    enabled: !!user,
    queryFn: async () => {
      const from = format(subMonths(new Date(), months), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, type, amount, description, occurred_on, recurring_id, category_id,
          category:categories(name)
        `)
        .gte('occurred_on', from)
        .order('occurred_on', { ascending: false })
        .limit(3000)
      if (error) throw error
      return data ?? []
    },
  })
}
