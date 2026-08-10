import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Wallet, Percent, CalendarClock } from 'lucide-react'
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
  const { t } = useTranslation('dashboard')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: transactions = [], isLoading } = useTransactions()
  const { data: prev } = usePreviousMonthSummary()
  const { data: carryForward = 0, isLoading: cfLoading } = useCarryForward()
  const { month, isYearView } = useMonth()

  // Fecha de hoy en formato 'YYYY-MM-DD' para comparar con occurred_on
  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const summary = useMemo(() => {
    let income = 0, expense = 0           // solo transacciones hasta hoy
    let incomeAll = 0, expenseAll = 0     // todas (incluidas las futuras del mes)

    for (const t of transactions) {
      const amount = Number(t.amount)
      if (t.type === 'income') incomeAll += amount
      else expenseAll += amount

      // Solo cuenta para el saldo actual si la fecha ya llegó
      if (t.occurred_on <= todayStr) {
        if (t.type === 'income') income += amount
        else expense += amount
      }
    }

    const balance = income - expense
    const balanceAll = incomeAll - expenseAll
    const savingsRate = income > 0 ? (balance / income) * 100 : 0
    // ¿Hay movimientos con fecha futura en el mes visible?
    const hasFuture = incomeAll !== income || expenseAll !== expense

    return { income: incomeAll, expense: expenseAll, balance, balanceAll, savingsRate, hasFuture }
  }, [transactions, todayStr])

  const prevIncome = prev?.income ?? 0
  const prevExpense = prev?.expense ?? 0

  // Saldo actual = solo lo ocurrido hasta hoy + carry-forward
  const balanceLabel = isYearView ? t('kpi.balanceYear') : t('kpi.balanceToday')
  const balanceValue = summary.balance + Number(carryForward || 0)
  // Saldo estimado = todos los movimientos del mes + carry-forward
  const estimatedValue = summary.balanceAll + Number(carryForward || 0)

  return (
    <section className="space-y-4">
      {/* Header con título grande del mes o año */}
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold leading-tight">
          {isYearView ? formatYearLabel(month) : formatMonthLabel(month)}
        </h1>
        <p className="text-xs text-white/50">
          {isYearView
            ? t('subtitle.year')
            : t('subtitle.month')}
        </p>
      </div>

      {/* KPIs en grid 2x2 (móvil) / 4x1 (desktop) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label={t('kpi.income')}
          value={formatEuro(summary.income)}
          icon={TrendingUp}
          tone="success"
          loading={isLoading}
          delta={isYearView ? null : diffPct(summary.income, prevIncome)}
          deltaLabel={t('kpi.vsLastMonth')}
          onClick={() => navigate('/movimientos', { state: { filterType: 'income' } })}
        />
        <KpiCard
          label={t('kpi.expense')}
          value={formatEuro(summary.expense)}
          icon={TrendingDown}
          tone="danger"
          loading={isLoading}
          delta={isYearView ? null : diffPct(summary.expense, prevExpense)}
          deltaPositiveIsGood={false}
          deltaLabel={t('kpi.vsLastMonth')}
          onClick={() => navigate('/movimientos', { state: { filterType: 'expense' } })}
        />
        <KpiCard
          label={balanceLabel}
          value={formatEuro(balanceValue)}
          icon={Wallet}
          tone="info"
          loading={isLoading || cfLoading}
        />
        <KpiCard
          label={t('kpi.savingsRate')}
          value={summary.income > 0 ? `${summary.savingsRate.toFixed(1)}%` : '—'}
          icon={Percent}
          tone="accent"
          loading={isLoading}
        />
      </div>

      {/* Saldo estimado — solo aparece cuando hay movimientos con fecha
          futura en el mes visible. Muestra cómo quedará el saldo si todos
          los movimientos planificados se ejecutan. */}
      {!isYearView && summary.hasFuture && !isLoading && (
        <div className="flex items-center gap-2.5 rounded-xl bg-info/10 px-3 py-2.5 ring-1 ring-info/20">
          <CalendarClock size={16} className="shrink-0 text-info" />
          <div className="min-w-0 flex-1 text-sm">
            <span className="text-white/60">{t('estimatedBalance')}</span>
            <span
              className={[
                'font-semibold tabular-nums',
                estimatedValue >= 0 ? 'text-success' : 'text-danger',
              ].join(' ')}
            >
              {formatEuro(estimatedValue)}
            </span>
          </div>
          <span className="shrink-0 text-[10px] text-white/35">{t('withFutureMovements')}</span>
        </div>
      )}

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

      <Fab onClick={() => setOpen(true)} ariaLabel={t('addTransaction')} />
      <Modal open={open} onClose={() => setOpen(false)} title={t('newTransaction')}>
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
