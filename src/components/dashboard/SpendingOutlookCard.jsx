import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Gauge } from 'lucide-react'
import { useRecurringExpenses } from '../../hooks/useRecurringExpenses.js'
import { computeOutlook } from '../../lib/forecast.js'
import { formatEuro } from '../../lib/formatters.js'
import InfoHint from '../ui/InfoHint.jsx'

/**
 * Gasto diario disponible + previsión de fin de mes (solo mes en curso).
 * Los cálculos viven en `lib/forecast.js` (céntimos enteros, sin flotantes).
 *
 * Props:
 * - balance: saldo a hoy en euros (carry-forward incluido).
 * - transactions: movimientos del mes visible (que es el mes actual).
 */
export default function SpendingOutlookCard({ balance, transactions }) {
  const { t } = useTranslation('dashboard')
  const { data: recurrings, isLoading } = useRecurringExpenses()

  const outlook = useMemo(
    () =>
      computeOutlook({
        balance,
        transactions,
        recurrings: recurrings ?? [],
        today: new Date(),
      }),
    [balance, transactions, recurrings],
  )

  if (isLoading) return null

  const over = outlook.isOverspent
  const projected = outlook.projectedEnd

  return (
    <div className="rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
          <Gauge size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/50">{t('outlook.title')}</p>
          {over ? (
            <p className="text-lg font-bold leading-tight text-danger">
              {t('outlook.overspent', { amount: formatEuro(Math.abs(outlook.available)) })}
            </p>
          ) : (
            <p className="text-lg font-bold leading-tight tabular-nums">
              {t('outlook.perDay', { amount: formatEuro(outlook.dailyAllowance) })}
            </p>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-white/50">
        {t('outlook.basis', {
          count: outlook.daysLeft,
          pending: formatEuro(outlook.pendingExpense),
        })}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-sm">
        <span className="text-white/60">{t('outlook.projectedEnd')}</span>
        {projected === null ? (
          <span className="text-xs text-white/40">{t('outlook.needMoreData')}</span>
        ) : (
          <span
            className={[
              'font-semibold tabular-nums',
              projected >= 0 ? 'text-success' : 'text-danger',
            ].join(' ')}
          >
            {formatEuro(projected)}
          </span>
        )}
      </div>

      <InfoHint className="mt-3">{t('outlook.info')}</InfoHint>
    </div>
  )
}
