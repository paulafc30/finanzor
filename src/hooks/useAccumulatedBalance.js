import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'

/**
 * Calcula el saldo acumulado hasta el último día del periodo seleccionado
 * (mes o año, según `viewMode` del MonthSwitcher).
 *
 * Definición: suma de todos los `income` − todos los `expense` con
 * `occurred_on < rangeEnd`, sin filtrar por categoría ni tipo de origen.
 *
 * Esto hace que el "Saldo" sea **un punto temporal congelado**:
 *  - Si navegas a un mes pasado, ves cuánto tenías al cerrar ese mes.
 *    No se actualiza al pasar el tiempo, solo si añades/borras/editas un
 *    movimiento cuya fecha caiga en ese mes o anteriores.
 *  - Si el mes seleccionado contiene hoy, es efectivamente el saldo de
 *    hoy + lo que ya esté materializado de futuros (recurrentes).
 *  - Si el mes seleccionado es futuro, es el saldo proyectado a fin de
 *    ese mes contando los recurrentes ya generados.
 *
 * Cualquier vista que dependa de "saldo a día de hoy" debe calcularlo
 * por su cuenta filtrando por la fecha actual, no por este hook.
 */
export function useAccumulatedBalance() {
  const { user } = useSession()
  const { rangeEnd } = useMonth() // primer día del mes/año siguiente al visible

  return useQuery({
    queryKey: ['accumulated-balance', user?.id, rangeEnd],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .lt('occurred_on', rangeEnd)

      if (error) throw error

      let income = 0
      let expense = 0
      for (const t of data ?? []) {
        if (t.type === 'income') income += Number(t.amount)
        else expense += Number(t.amount)
      }
      return income - expense
    },
  })
}
