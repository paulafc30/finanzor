import { Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBudgetSummary } from '../../hooks/useBudgets.js'
import { formatEuro } from '../../lib/formatters.js'

/**
 * Barra global del presupuesto del mes. Suma todos los presupuestos por
 * categoría y compara con el gasto real del mes.
 *
 * Se oculta si no hay ningún presupuesto definido.
 */
export default function MonthBudgetBar() {
  const { rows, isLoading } = useBudgetSummary()

  if (isLoading) return null

  let totalBudget = 0
  let totalSpent = 0
  for (const r of rows) {
    totalBudget += r.budgetAmount
    totalSpent += r.spentAmount
  }

  if (totalBudget === 0) return null

  const percentage = (totalSpent / totalBudget) * 100
  const remaining = totalBudget - totalSpent
  const widthPct = Math.min(100, Math.max(0, percentage))

  let status = 'ok'
  if (percentage >= 90) status = 'over'
  else if (percentage >= 70) status = 'warn'

  const colorByStatus = {
    ok: 'bg-success',
    warn: 'bg-warning',
    over: 'bg-danger',
  }
  const badgeByStatus = {
    ok: 'bg-success text-white',
    warn: 'bg-warning text-white',
    over: 'bg-danger text-white',
  }

  return (
    <Link
      to="/presupuesto"
      className="block rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5 transition hover:ring-white/15"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-info" />
          <span className="text-sm font-semibold text-white">
            Presupuesto del mes
          </span>
        </div>
        <span
          className={[
            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            badgeByStatus[status],
          ].join(' ')}
        >
          {percentage.toFixed(0)}% gastado
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/5">
        <div
          className={[
            'h-full rounded-full transition-all',
            colorByStatus[status],
          ].join(' ')}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-white/50">
          Gastado: <span className="text-white">{formatEuro(totalSpent)}</span>
        </span>
        <span className="text-white/50">
          {remaining >= 0 ? 'Disponible' : 'Excedido'}:{' '}
          <span className={remaining >= 0 ? 'text-white' : 'text-danger'}>
            {formatEuro(Math.abs(remaining))}
          </span>
        </span>
      </div>
    </Link>
  )
}
