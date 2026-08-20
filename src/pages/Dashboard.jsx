import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Wallet, CalendarClock, Receipt } from 'lucide-react'
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
    // ¿Hay movimientos con fecha futura en el mes visible?
    const hasFuture = incomeAll !== income || expenseAll !== expense

    return { income: incomeAll, expense: expenseAll, expenseToDate: expense, balance, balanceAll, hasFuture }
  }, [transactions, todayStr])

  const prevIncome = prev?.income ?? 0
  const prevExpense = prev?.expense ?? 0

  // Días transcurridos del periodo visible, para el gasto medio diario.
  // - Mes/año actual: días hasta hoy (incluido).
  // - Mes/año ya cerrado (pasado): todos sus días.
  // - Mes/año futuro: 0 (aún no hay "medio diario" que calcular).
  const daysElapsed = useMemo(() => {
    const now = new Date()
    if (isYearView) {
      const year = month.getFullYear()
      if (year === now.getFullYear()) {
        return Math.floor((now - new Date(year, 0, 1)) / 86400000) + 1
      }
      if (year < now.getFullYear()) {
        return Math.floor((new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / 86400000)
      }
      return 0
    }
    const y = month.getFullYear()
    const m = month.getMonth()
    if (y === now.getFullYear() && m === now.getMonth()) {
      return now.getDate()
    }
    if (new Date(y, m, 1) < new Date(now.getFullYear(), now.getMonth(), 1)) {
      return new Date(y, m + 1, 0).getDate() // días totales de ese mes
    }
    return 0
  }, [month, isYearView])
  const avgDailyExpense = daysElapsed > 0 ? summary.expenseToDate / daysElapsed : null

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
          delta={isYearView ? null : diffAbs(summary.income, prevIncome)}
          deltaIsAbsolute
          deltaLabel={t('kpi.vsLastMonth')}
          onClick={() => navigate('/movimientos', { state: { filterType: 'income' } })}
        />
        <KpiCard
          label={t('kpi.expense')}
          value={formatEuro(summary.expense)}
          icon={TrendingDown}
          tone="danger"
          loading={isLoading}
          delta={isYearView ? null : diffAbs(summary.expense, prevExpense)}
          deltaIsAbsolute
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
          label={t('kpi.avgDailyExpense')}
          value={avgDailyExpense !== null ? formatEuro(avgDailyExpense) : '—'}
          icon={Receipt}
          tone="accent"
          loading={isLoading}
          onClick={() => navigate('/movimientos', { state: { filterType: 'expense' } })}
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
 * Diferencia en euros respecto al valor previo (mes anterior).
 */
function diffAbs(current, prev) {
  if (current === 0 && prev === 0) return null
  return current - prev
}
