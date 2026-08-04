import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'

/**
 * Devuelve totales (ingresos, gastos, balance) del mes anterior al
 * seleccionado actualmente. Usado en Dashboard para mostrar comparativas.
 *
 * Filtra por occurred_on igual que el resto.
 */
export function usePreviousMonthSummary() {
  const { user } = useSession()
  const { month } = useMonth()

  const prevStart = format(
    new Date(month.getFullYear(), month.getMonth() - 1, 1),
    'yyyy-MM-dd',
  )
  const prevEnd = format(
    new Date(month.getFullYear(), month.getMonth(), 1),
    'yyyy-MM-dd',
  )

  return useQuery({
    queryKey: ['previous-month-summary', user?.id, prevStart],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .gte('occurred_on', prevStart)
        .lt('occurred_on', prevEnd)

      if (error) throw error

      let income = 0
      let expense = 0
      for (const t of data ?? []) {
        if (t.type === 'income') income += Number(t.amount)
        else expense += Number(t.amount)
      }
      return { income, expense, balance: income - expense }
    },
  })
}
