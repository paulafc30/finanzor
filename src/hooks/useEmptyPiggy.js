import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useCategories } from './useCategories.js'
import { toCents, fromCents } from '../lib/forecast.js'

// Códigos de "la tabla no existe" (PostgREST / Postgres): migración 0017 sin aplicar.
const MISSING_TABLE = new Set(['PGRST205', '42P01'])

/**
 * Vaciar la hucha = dar ese dinero por GASTADO.
 *
 * Al aportar a la hucha el dinero ya salió del saldo (es un gasto de la
 * categoría Ahorro). Vaciarla NO crea movimientos ni toca el saldo: solo
 * registra un "vaciado" en `piggy_withdrawals` y la hucha vuelve a 0.
 *
 *   hucha = gastos(Ahorro) − suma(piggy_withdrawals)
 *
 * El importe se vuelve a calcular en el momento (no se fía de lo que hay en
 * pantalla) y todo va en céntimos.
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

      const { data: rows, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .eq('category_id', ahorroId)
      if (error) throw error

      const { data: withdrawals, error: wErr } = await supabase
        .from('piggy_withdrawals')
        .select('amount')
        .eq('user_id', user.id)
      if (wErr) {
        throw new Error(MISSING_TABLE.has(wErr.code) ? t('piggy.migrationMissing') : wErr.message)
      }

      let netC = 0
      for (const row of rows ?? []) {
        const c = toCents(row.amount)
        netC += row.type === 'income' ? -c : c
      }
      for (const w of withdrawals ?? []) netC -= toCents(w.amount)
      if (netC <= 0) throw new Error(t('piggy.nothingToEmpty'))

      const { error: insErr } = await supabase
        .from('piggy_withdrawals')
        .insert({ user_id: user.id, amount: fromCents(netC) })
      if (insErr) throw insErr

      return { amount: fromCents(netC) }
    },
    onSuccess: () => {
      // Solo cambia el contador de la hucha: saldo y movimientos no se tocan.
      qc.invalidateQueries({ queryKey: ['savings-from-expenses', user?.id] })
    },
  })
}
