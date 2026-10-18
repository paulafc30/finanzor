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
 *   - allTotal: todo el histórico menos los vaciados de la hucha (lo que marca
 *     la hucha; ver useEmptyPiggy)
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
      // Neto de la categoría Ahorro: gastos − ingresos (en céntimos).
      const net = (rows) =>
        (rows ?? []).reduce((acc, r) => {
          const c = toCents(r.amount)
          return acc + (r.type === 'income' ? -c : c)
        }, 0)

      // 1) Total del mes seleccionado
      const { data: monthRows, error: e1 } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('category_id', ahorroId)
        .gte('occurred_on', rangeStart)
        .lt('occurred_on', rangeEnd)
      if (e1) throw e1
      const monthTotal = fromCents(net(monthRows))

      // 2) Total histórico (todos los meses)
      const { data: allRows, error: e2 } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('category_id', ahorroId)
      if (e2) throw e2
      // 3) Vaciados de la hucha ("dar por gastado", sin tocar el saldo).
      //    Si la migración 0017 aún no está aplicada, se ignoran.
      const { data: wRows, error: e3 } = await supabase
        .from('piggy_withdrawals')
        .select('amount')
      if (e3 && !['PGRST205', '42P01'].includes(e3.code)) throw e3
      const withdrawnC = (wRows ?? []).reduce((acc, w) => acc + toCents(w.amount), 0)

      const allTotal = Math.max(0, fromCents(net(allRows) - withdrawnC))


      return { monthTotal, allTotal }
    },
  })
}
