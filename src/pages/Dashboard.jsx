import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Percent } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Fab from '../components/ui/Fab.jsx'
import TransactionForm from '../components/transactions/TransactionForm.jsx'
import KpiCard from '../components/dashboard/KpiCard.jsx'
import CategoryDonut from '../components/dashboard/CategoryDonut.jsx'
import RecentTransactions from '../components/dashboard/RecentTransactions.jsx'
import CategoryComparisonChart from '../components/dashboard/CategoryComparisonChart.jsx'
import { useTransactions } from '../hooks/useTransactions.js'
import { usePreviousMonthSummary } from '../hooks/usePreviousMonthSummary.js'
import { useCarryForward } from '../hooks/useCarryForward.js'
import { useMonth } from '../hooks/useMonth.jsx'
import { formatEuro, formatMonthLabel, formatYearLabel } from '../lib/formatters.js'

export default function Dashboard() {
  const [open, setOpen] = useState(false)
  const { data: transactions = [], isLoading } = useTransactions()
  const { data: prev } = usePreviousMonthSummary()
  const { data: carryForward = 0, isLoading: cfLoading } = useCarryForward()
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

  // La card "Saldo del mes" suma el balance del periodo visible al
  // carry-forward (lo que sobró al cierre del mes anterior). Resultado:
  // refleja el dinero que tendrias acumulado a fin del mes visible,
  // SOLO incluyendo lo que paso antes en la app. Si paula tiene un
  // déficit histórico antiguo (importacion CSV vieja, gastos olvidados),
  // sale aqui — y se ve donde mirando los meses anteriores.
  const balanceLabel = isYearView ? 'Saldo del año' : 'Saldo del mes'
  const balanceValue = summary.balance + Number(carryForward || 0)

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
          // Delta vs mes anterior solo en vista mensual. En ingresos
          // "positivo = bueno" (default), o sea subir 12% sale en verde
          // y bajar 12% en rojo.
          delta={isYearView ? null : diffPct(summary.income, prevIncome)}
          deltaLabel="vs. mes pasado"
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
          deltaLabel="vs. mes pasado"
        />
        <KpiCard
          label={balanceLabel}
          value={formatEuro(balanceValue)}
          icon={Wallet}
          tone="info"
          loading={isLoading || cfLoading}
        />
        <KpiCard
          label="Tasa de Ahorro"
          value={summary.income > 0 ? `${summary.savingsRate.toFixed(1)}%` : '—'}
          icon={Percent}
          tone="accent"
          loading={isLoading}
        />
      </div>

      {/* La barra resumen del presupuesto vive en la pagina Presupuesto,
          no aqui. Asi el Dashboard se queda como vista financiera general. */}

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
