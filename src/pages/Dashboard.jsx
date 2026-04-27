import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Fab from '../components/ui/Fab.jsx'
import TransactionForm from '../components/transactions/TransactionForm.jsx'
import { useTransactions } from '../hooks/useTransactions.js'
import { formatEuro } from '../lib/formatters.js'

export default function Dashboard() {
  const [open, setOpen] = useState(false)
  const { data: transactions = [], isLoading } = useTransactions()

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

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Inicio</h1>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Ingresos"
          value={formatEuro(summary.income)}
          icon={TrendingUp}
          tone="success"
          loading={isLoading}
        />
        <KpiCard
          label="Gastos"
          value={formatEuro(summary.expense)}
          icon={TrendingDown}
          tone="danger"
          loading={isLoading}
        />
        <KpiCard
          label="Balance"
          value={formatEuro(summary.balance)}
          icon={Wallet}
          tone={summary.balance >= 0 ? 'success' : 'danger'}
          loading={isLoading}
        />
        <KpiCard
          label="Tasa de ahorro"
          value={summary.income > 0 ? `${summary.savingsRate.toFixed(0)}%` : '—'}
          icon={PiggyBank}
          tone={summary.savingsRate >= 0 ? 'accent' : 'danger'}
          loading={isLoading}
        />
      </div>

      <div className="rounded-xl bg-bg-elevated p-4 text-sm text-white/60">
        En las próximas fases aquí aparecerá la donut por categorías, la barra
        del presupuesto del mes, los últimos movimientos y la comparativa con el
        mes anterior.
      </div>

      <Fab onClick={() => setOpen(true)} ariaLabel="Añadir movimiento" />
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo movimiento">
        <TransactionForm onSuccess={() => setOpen(false)} />
      </Modal>
    </section>
  )
}

const tones = {
  success: 'text-success',
  danger: 'text-danger',
  accent: 'text-accent',
}

function KpiCard({ label, value, icon: Icon, tone, loading }) {
  return (
    <div className="rounded-xl bg-bg-elevated p-3">
      <div className="mb-1 flex items-center justify-between text-xs text-white/50">
        <span>{label}</span>
        <Icon size={14} className={tones[tone] ?? 'text-white/50'} />
      </div>
      <p
        className={[
          'text-lg font-semibold',
          tones[tone] ?? 'text-white',
          loading ? 'opacity-40' : '',
        ].join(' ')}
      >
        {loading ? '…' : value}
      </p>
    </div>
  )
}
