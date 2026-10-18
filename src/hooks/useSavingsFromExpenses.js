import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'
import { useCategories } from './useCategories.js'
import { toCents, fromCents } from '../lib/forecast.js'

/**
 * Calcula cuánto ha "ahorrado" el usuario tomando los gastos categorizados
 * como "Ahorro". Devuelve:
 *   - monthTotal: gastos − ingresos de cat. Ahorro del mes seleccionado
 *   - allTotal: lo mismo en todo el histórico (lo que marca la hucha)
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
      // Neto = gastos − ingresos de la categoría Ahorro. Los ingresos en
      // Ahorro son las "Hucha vaciada" (ver useEmptyPiggy). En céntimos.
      const net = (rows) =>
        fromCents(
          (rows ?? []).reduce((acc, r) => {
            const c = toCents(r.amount)
            return acc + (r.type === 'income' ? -c : c)
          }, 0),
        )

      // 1) Total del mes seleccionado
      const { data: monthRows, error: e1 } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('category_id', ahorroId)
        .gte('occurred_on', rangeStart)
        .lt('occurred_on', rangeEnd)
      if (e1) throw e1
      const monthTotal = net(monthRows)

      // 2) Total histórico (todos los meses)
      const { data: allRows, error: e2 } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('category_id', ahorroId)
      if (e2) throw e2
      const allTotal = net(allRows)

      return { monthTotal, allTotal }
    },
  })
}
