import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useCategories } from './useCategories.js'
import { toCents, fromCents } from '../lib/forecast.js'

/**
 * Vaciar la hucha ("romperla"): el dinero vuelve al saldo.
 *
 * La hucha muestra   gastos(categoría Ahorro) − ingresos(categoría Ahorro).
 * Vaciarla crea UN ingreso "Hucha vaciada" en la categoría Ahorro por ese
 * neto, así la hucha queda en 0 y el saldo recupera el dinero, sin borrar
 * el historial de aportaciones. El neto se vuelve a calcular en el momento
 * (no se fía de lo que hay en pantalla) y todo va en céntimos.
 */
export function useEmptyPiggy() {
  const { user } = useSession()
  const qc = useQueryClient()
  const { t } = useTranslation('savings')
  const { data: categories = [] } = useCategories()
  const ahorroId = categories.find((c) => c.name === 'Ahorro')?.id

  return useMutation({
    mutationFn: async () => {
      if (!ahorroId) throw new Error(t('piggy.noCategory'))

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .eq('category_id', ahorroId)
      if (error) throw error

      let netC = 0
      for (const row of data ?? []) {
        const c = toCents(row.amount)
        netC += row.type === 'income' ? -c : c
      }
      if (netC <= 0) throw new Error(t('piggy.nothingToEmpty'))

      const { error: insErr } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'income',
        amount: fromCents(netC),
        description: t('piggy.emptiedDescription'),
        category_id: ahorroId,
        occurred_on: format(new Date(), 'yyyy-MM-dd'),
      })
      if (insErr) throw insErr

      return { amount: fromCents(netC) }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['savings-from-expenses', user?.id] })
      qc.invalidateQueries({ queryKey: ['monthly-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['accumulated-balance', user?.id] })
      qc.invalidateQueries({ queryKey: ['previous-month-summary', user?.id] })
      qc.invalidateQueries({ queryKey: ['carry-forward', user?.id] })
    },
  })
}
