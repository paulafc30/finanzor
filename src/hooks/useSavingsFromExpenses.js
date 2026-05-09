import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'
import { useCategories } from './useCategories.js'

/**
 * Calcula cuánto ha "ahorrado" el usuario tomando los gastos categorizados
 * como "Ahorro". Devuelve:
 *   - monthTotal: suma de gastos cat. Ahorro del mes seleccionado
 *   - allTotal: suma total histórica
 *
 * Se usa la categoría con name='Ahorro' del usuario (puede tener color/icono
 * personalizado si la renombró, pero el nombre tiene que ser "Ahorro" para
 * que esto cuente).
 */
export function useSavingsFromExpenses() {
  const { user } = useSession()
  const { rangeStart, rangeEnd } = useMonth()
  const { data: categories = [] } = useCategories()

  const ahorroId = categories.find((c) => c.name === 'Ahorro')?.id

  return useQuery({
    queryKey: ['savings-from-expenses', user?.id, ahorroId, rangeStart],
    enabled: !!user && !!ahorroId,
    queryFn: async () => {
      // 1) Total del mes seleccionado
      const { data: monthRows, error: e1 } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .eq('category_id', ahorroId)
        .gte('occurred_on', rangeStart)
        .lt('occurred_on', rangeEnd)
      if (e1) throw e1

      const monthTotal = (monthRows ?? []).reduce(
        (acc, t) => acc + Number(t.amount),
        0,
      )

      // 2) Total histórico (todos los meses)
      const { data: allRows, error: e2 } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .eq('category_id', ahorroId)
      if (e2) throw e2

      const allTotal = (allRows ?? []).reduce(
        (acc, t) => acc + Number(t.amount),
        0,
      )

      return { monthTotal, allTotal }
    },
  })
}
