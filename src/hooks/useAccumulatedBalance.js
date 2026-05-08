import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'

/**
 * Calcula el saldo acumulado del usuario hasta el último día del mes
 * seleccionado. Esto incluye TODAS las transacciones (ingresos − gastos)
 * desde el comienzo del histórico hasta justo antes del primer día del
 * mes siguiente.
 *
 * Es lo que en banca se llama "saldo a fin de mes" — refleja cuánto
 * dinero queda acumulado cuando termina el mes en curso.
 *
 * Devuelve { balance, isLoading, error }.
 */
export function useAccumulatedBalance() {
  const { user } = useSession()
  const { rangeEnd } = useMonth() // primer día del mes siguiente al seleccionado

  return useQuery({
    queryKey: ['accumulated-balance', user?.id, rangeEnd],
    enabled: !!user,
    queryFn: async () => {
      // Traemos solo type y amount (no necesitamos el resto)
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
