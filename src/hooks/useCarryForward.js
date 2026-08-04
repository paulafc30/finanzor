import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'

/**
 * Devuelve el "carry-forward": el saldo acumulado al final del periodo
 * INMEDIATAMENTE anterior al que se está visualizando.
 *
 *   carryForward = SUMA(income) − SUMA(expense)  WHERE occurred_on < rangeStart
 *
 * - En vista mes: es lo que sobró al cierre del mes anterior.
 * - En vista año: es lo que había acumulado hasta el 31-dic del año
 *   anterior.
 *
 * El "Saldo del mes" del Dashboard se calcula sumando este número al
 * balance del periodo visible (ingresos − gastos del mes/año actual).
 * Asi:
 *   - El saldo refleja el dinero real "que tienes" tras cerrar el mes.
 *   - No mezcla el sobrante histórico antiguo: solo arrastra hasta el
 *     primer día del mes visible.
 */
export function useCarryForward() {
  const { user } = useSession()
  const { rangeStart } = useMonth()

  return useQuery({
    queryKey: ['carry-forward', user?.id, rangeStart],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .lt('occurred_on', rangeStart)

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
