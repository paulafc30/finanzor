import { useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTransactions } from '../../hooks/useTransactions.js'
import { useMonth } from '../../hooks/useMonth.jsx'
import { formatEuro } from '../../lib/formatters.js'
import { applyFilter } from './MovementsFilters.jsx'

/**
 * Banner de totales del periodo seleccionado (mes o año, segun MonthSwitcher).
 *
 * Muestra:
 *  - Ingresos, Gastos y Balance del conjunto YA filtrado por
 *    `MovementsFilters`. Si no hay filtros, son los totales del mes/año.
 *  - Un detalle plegable con desglose por origen (manual, recurrente,
 *    aporte a meta) para diagnosticar descuadres.
 *
 * Util para verificar a ojo que las sumas del Dashboard cuadran con lo
 * que hay realmente en Movimientos.
 */
export default function MovementsSummary({ filter }) {
  const { t } = useTranslation('transactions')
  const { data: transactions = [] } = useTransactions()
  const { isYearView } = useMonth()

  const filtered = useMemo(
    () => (filter ? applyFilter(transactions, filter) : transactions),
    [transactions, filter],
  )

  const stats = useMemo(() => {
    let income = 0
    let expense = 0
    const byOrigin = {
      manual:    { count: 0, income: 0, expense: 0 },
      recurring: { count: 0, income: 0, expense: 0 },
      saving:    { count: 0, income: 0, expense: 0 },
    }
    for (const t of filtered) {
      const amt = Number(t.amount) || 0
      if (t.type === 'income') income += amt
      else expense += amt

      const origin = classifyOrigin(t)
      byOrigin[origin].count += 1
      if (t.type === 'income') byOrigin[origin].income += amt
      else byOrigin[origin].expense += amt
    }
    return { income, expense, balance: income - expense, byOrigin, count: filtered.length }
  }, [filtered])

  if (transactions.length === 0) return null

  return (
    <details className="group rounded-xl bg-bg-elevated ring-1 ring-white/5 [&>summary]:list-none">
      <summary className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
        <div className="flex flex-1 items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
            <ArrowUpCircle size={11} />
            {formatEuro(stats.income)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 font-medium text-danger">
            <ArrowDownCircle size={11} />
            {formatEuro(stats.expense)}
          </span>
          <span
            className={[
              'ml-auto rounded-full px-2 py-0.5 font-semibold tabular-nums',
              stats.balance >= 0
                ? 'bg-white/5 text-white'
                : 'bg-danger/10 text-danger',
            ].join(' ')}
          >
            {stats.balance >= 0 ? '+' : '−'}
            {formatEuro(Math.abs(stats.balance))}
          </span>
        </div>
        <ChevronDown
          size={14}
          className="shrink-0 text-white/40 transition group-open:rotate-180"
        />
      </summary>

      {/* Desglose por origen */}
      <div className="space-y-2 border-t border-white/5 px-3 py-3 text-xs">
        <p className="text-white/50">
          {t('summary.breakdownByOrigin', {
            count: stats.count,
            period: isYearView ? t('summary.periodYear') : t('summary.periodMonth'),
          })}
        </p>
        <OriginRow label={t('summary.manual')} stats={stats.byOrigin.manual} />
        <OriginRow label={t('summary.recurring')} stats={stats.byOrigin.recurring} />
        <OriginRow
          label={t('summary.savingContributions')}
          stats={stats.byOrigin.saving}
          hint={t('summary.savingHint')}
        />
      </div>
    </details>
  )
}

function OriginRow({ label, stats, hint }) {
  return (
    <div className="rounded-lg bg-bg-card/60 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-white/80">
          {label}{' '}
          <span className="ml-1 text-white/40">({stats.count})</span>
        </span>
        <div className="flex items-center gap-2 tabular-nums">
          {stats.income > 0 && (
            <span className="text-success">+{formatEuro(stats.income)}</span>
          )}
          {stats.expense > 0 && (
            <span className="text-danger">−{formatEuro(stats.expense)}</span>
          )}
          {stats.income === 0 && stats.expense === 0 && (
            <span className="text-white/40">—</span>
          )}
        </div>
      </div>
      {hint && stats.count > 0 && (
        <p className="mt-1 text-[10px] text-white/40">{hint}</p>
      )}
    </div>
  )
}

/**
 * Devuelve el "origen" de una transaccion:
 *  - 'recurring'  → la creo `useMaterializeRecurring` (tiene recurring_id).
 *  - 'saving'     → la creo `useCreateContribution` (descripcion empieza
 *                   por "Ahorro:").
 *  - 'manual'     → la creo el usuario directamente desde el formulario o
 *                   por importacion CSV.
 *
 * Es heuristico: si en el futuro hay otros orígenes, ampliar aqui.
 */
function classifyOrigin(t) {
  if (t.recurring_id) return 'recurring'
  if (typeof t.description === 'string' && t.description.startsWith('Ahorro:')) {
    return 'saving'
  }
  return 'manual'
}
