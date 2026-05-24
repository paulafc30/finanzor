import { ArrowDownCircle, ArrowUpCircle, Repeat, ChevronRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTransactions } from '../../hooks/useTransactions.js'
import { useMonth } from '../../hooks/useMonth.jsx'
import { formatEuro } from '../../lib/formatters.js'

/**
 * Bloque "Últimos movimientos" para el Dashboard.
 * Muestra los N más recientes (por occurred_on desc) y un link a /movimientos.
 */
export default function RecentTransactions({ limit = 5 }) {
  const { data: transactions = [], isLoading } = useTransactions()
  const { isYearView } = useMonth()

  const items = transactions.slice(0, limit)

  return (
    <div className="rounded-xl bg-bg-elevated ring-1 ring-white/5">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Clock size={16} className="text-info" />
          Últimos movimientos
        </h3>
        <Link
          to="/movimientos"
          className="inline-flex items-center gap-0.5 text-xs text-accent hover:text-accent/80"
        >
          Ver todos
          <ChevronRight size={12} />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-white/50">
          {isYearView ? 'Sin movimientos este año.' : 'Sin movimientos este mes.'}
        </p>
      ) : (
        <ul>
          {items.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-b-0"
            >
              {t.type === 'expense' ? (
                <ArrowDownCircle size={18} className="shrink-0 text-danger" />
              ) : (
                <ArrowUpCircle size={18} className="shrink-0 text-success" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm text-white">
                    {t.description || (t.category?.name ?? 'Sin descripción')}
                  </p>
                  {t.recurring_id && (
                    <Repeat size={11} className="shrink-0 text-accent" />
                  )}
                </div>
                <p className="text-[11px] text-white/40">
                  {format(new Date(t.occurred_on), "d 'de' LLLL", { locale: es })}
                  {t.category && ' · '}
                  {t.category && (
                    <span style={{ color: t.category.color ?? 'rgba(255,255,255,0.4)' }}>
                      {t.category.name}
                    </span>
                  )}
                </p>
              </div>

              <p
                className={[
                  'shrink-0 text-sm font-semibold tabular-nums',
                  t.type === 'expense' ? 'text-danger' : 'text-success',
                ].join(' ')}
              >
                {t.type === 'expense' ? '−' : '+'}
                {formatEuro(t.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
