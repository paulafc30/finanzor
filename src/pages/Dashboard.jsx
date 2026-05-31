import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Percent } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Fab from '../components/ui/Fab.jsx'
import TransactionForm from '../components/transactions/TransactionForm.jsx'
import KpiCard from '../components/dashboard/KpiCard.jsx'
import CategoryDonut from '../components/dashboard/CategoryDonut.jsx'
import MonthBudgetBar from '../components/dashboard/MonthBudgetBar.jsx'
import RecentTransactions from '../components/dashboard/RecentTransactions.jsx'
import CategoryComparisonChart from '../components/dashboard/CategoryComparisonChart.jsx'
import { useTransactions } from '../hooks/useTransactions.js'
import { usePreviousMonthSummary } from '../hooks/usePreviousMonthSummary.js'
import { useAccumulatedBalance } from '../hooks/useAccumulatedBalance.js'
import { useMonth } from '../hooks/useMonth.jsx'
import { formatEuro, formatMonthLabel, formatYearLabel } from '../lib/formatters.js'

export default function Dashboard() {
  const [open, setOpen] = useState(false)
  const { data: transactions = [], isLoading } = useTransactions()
  const { data: prev } = usePreviousMonthSummary()
  const { data: accumulatedBalance, isLoading: accLoading } = useAccumulatedBalance()
  const { month, isYearView } = useMonth()

  const summary = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (t.type === 'income') income += Number(t.amount)
      else expense += Number(t.amount)
    }
    const balance = income - expense
    const savingsRate = income > 0 ? (balance / income) * 100 : 0
    return { income, expense, balance, savingsRate }
  }, [transactions])

  const prevIncome = prev?.income ?? 0
  const prevExpense = prev?.expense ?? 0

  return (
    <section className="space-y-4">
      {/* Header con título grande del mes o año */}
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold leading-tight">
          {isYearView ? formatYearLabel(month) : formatMonthLabel(month)}
        </h1>
        <p className="text-xs text-white/50">
          {isYearView
            ? 'Resumen financiero del año'
            : 'Resumen financiero del mes'}
        </p>
      </div>

      {/* KPIs en grid 2x2 (móvil) / 4x1 (desktop) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Ingresos"
          value={formatEuro(summary.income)}
          icon={TrendingUp}
          tone="success"
          loading={isLoading}
          // Delta vs mes anterior desactivado temporalmente: la comparativa
          // sale rara cuando el mes anterior tiene importes muy distintos.
          // delta={diffPct(summary.income, prevIncome)}
          // deltaPositiveIsGood
        />
        <KpiCard
          label="Gastos"
          value={formatEuro(summary.expense)}
          icon={TrendingDown}
          tone="danger"
          loading={isLoading}
          // El delta vs mes anterior solo aplica en vista mensual.
          delta={isYearView ? null : diffPct(summary.expense, prevExpense)}
          deltaPositiveIsGood={false}
        />
        <KpiCard
          label="Saldo Actual"
          value={formatEuro(accumulatedBalance ?? 0)}
          icon={Wallet}
          tone="info"
          loading={accLoading}
          // Delta "este mes" desactivado temporalmente hasta revisar el cálculo.
          // delta={summary.balance}
          // deltaPositiveIsGood
          // deltaIsAbsolute
          // deltaLabel="este mes"
        />
        <KpiCard
          label="Tasa de Ahorro"
          value={summary.income > 0 ? `${summary.savingsRate.toFixed(1)}%` : '—'}
          icon={Percent}
          tone="accent"
          loading={isLoading}
        />
      </div>

      {/* Barra de presupuesto solo en vista mensual: los presupuestos
          se definen por mes y no tiene sentido agregarlos en anual. */}
      {!isYearView && <MonthBudgetBar />}

      {/* Comparativa por categoria — solo desktop (lg+). En vista mes
          compara con la media de los 3 meses anteriores; en vista anio
          compara con el anio anterior completo. El componente se
          autogestiona el `hidden lg:block`. */}
      <CategoryComparisonChart />

      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryDonut />
        <RecentTransactions limit={6} />
      </div>

      <Fab onClick={() => setOpen(true)} ariaLabel="Añadir movimiento" />
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo movimiento">
        <TransactionForm onSuccess={() => setOpen(false)} />
      </Modal>
    </section>
  )
}

/**
 * Diferencia porcentual respecto al valor previo. Si el porcentaje resulta
 * absurdamente grande (>999%) — pasa cuando el mes anterior tenía un valor
 * muy pequeño — devolvemos un objeto con la diferencia absoluta para que la
 * card pinte "+1.234,56 €" en lugar de un "+12350%" inútil.
 */
function diffPct(current, prev) {
  if (prev === 0 && current === 0) return null
  if (prev === 0) return null
  const pct = ((current - prev) / Math.abs(prev)) * 100
  if (Math.abs(pct) > 999) {
    return { fallbackToAbs: true, value: current - prev }
  }
  return pct
}

function diffAbs(current, prev) {
  if (current === 0 && prev === 0) return null
  return current - prev
}
