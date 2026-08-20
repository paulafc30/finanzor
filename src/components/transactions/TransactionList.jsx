import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, ArrowDownCircle, ArrowUpCircle, Repeat, CreditCard, Banknote } from 'lucide-react'
import { format } from 'date-fns'
import { formatEuro, dateFnsLocale } from '../../lib/formatters.js'
import {
  useTransactions,
  useDeleteTransaction,
} from '../../hooks/useTransactions.js'
import { useMonth } from '../../hooks/useMonth.jsx'
import { applyFilter, countActiveFilters } from './MovementsFilters.jsx'

/**
 * Lista de movimientos del mes seleccionado.
 * Cada item es clickable: llama a onEdit(tx) si se proporciona.
 * El botón de papelera tiene stopPropagation para no disparar el edit al borrar.
 *
 * Si se pasa `filter` (objeto con la forma definida en MovementsFilters.jsx),
 * la lista se filtra localmente.
 */
export default function TransactionList({ onEdit, filter = null }) {
  const { t } = useTranslation('transactions')
  const { data: transactions = [], isLoading, error } = useTransactions()
  const deleteMutation = useDeleteTransaction()
  const { isYearView } = useMonth()

  // Aplicar filtro local si se proporciona
  const filtered = useMemo(
    () => (filter ? applyFilter(transactions, filter) : transactions),
    [transactions, filter],
  )

  // Agrupar por occurred_on (día)
  const grouped = useMemo(() => {
    const map = new Map()
    for (const tx of filtered) {
      const key = tx.occurred_on
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(tx)
    }
    return Array.from(map.entries())
  }, [filtered])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
        {t('list.errorLoading', { message: error.message })}
      </p>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl bg-bg-elevated p-8 text-center">
        <p className="text-white/60">
          {isYearView ? t('list.emptyYear') : t('list.emptyMonth')}
        </p>
        <p className="mt-1 text-xs text-white/40">
          {t('list.emptyHint')}
        </p>
      </div>
    )
  }

  // Hay movimientos pero el filtro deja la lista vacía
  if (filtered.length === 0) {
    const filtersActive =
      (filter?.text && filter.text.length > 0) ||
      (filter && countActiveFilters(filter) > 0)
    return (
      <div className="rounded-xl bg-bg-elevated p-8 text-center">
        <p className="text-white/60">
          {filtersActive ? t('list.noMatches') : t('list.noResults')}
        </p>
        <p className="mt-1 text-xs text-white/40">
          {t('list.adjustFiltersHint')}
        </p>
      </div>
    )
  }

  async function handleDelete(e, tx) {
    e.stopPropagation()
    const ok = window.confirm(
      tx.type === 'expense'
        ? t('list.confirmDeleteExpense', { amount: formatEuro(tx.amount) })
        : t('list.confirmDeleteIncome', { amount: formatEuro(tx.amount) }),
    )
    if (!ok) return
    try {
      await deleteMutation.mutateAsync(tx.id)
    } catch (err) {
      alert(t('list.deleteFailed', { message: err.message ?? t('list.unknownError') }))
    }
  }

  return (
    <div className="space-y-4">
      {grouped.map(([day, items]) => (
        <div key={day}>
          <h3 className="mb-1.5 px-1 text-xs uppercase tracking-wide text-white/40">
            {format(new Date(day), "EEEE d 'de' LLLL", { locale: dateFnsLocale() })}
          </h3>
          <ul className="overflow-hidden rounded-xl bg-bg-elevated">
            {items.map((tx) => (
              <li
                key={tx.id}
                className="border-b border-white/5 last:border-b-0"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onEdit?.(tx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onEdit?.(tx)
                    }
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5"
                  aria-label={t('list.editMovementAria')}
                >
                  {tx.type === 'expense' ? (
                    <ArrowDownCircle size={20} className="shrink-0 text-danger" />
                  ) : (
                    <ArrowUpCircle size={20} className="shrink-0 text-success" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm text-white">
                        {tx.description || (tx.category?.name ?? t('list.noDescription'))}
                      </p>
                      {tx.recurring_id && (
                        <Repeat
                          size={12}
                          className="shrink-0 text-accent"
                          aria-label={t('list.recurringMovementAria')}
                        />
                      )}
                      {tx.payment_method === 'cash' ? (
                        <Banknote
                          size={12}
                          className="shrink-0 text-white/40"
                          aria-label={t('list.paymentMethodCashAria')}
                        />
                      ) : (
                        <CreditCard
                          size={12}
                          className="shrink-0 text-white/40"
                          aria-label={t('list.paymentMethodCardAria')}
                        />
                      )}
                    </div>
                    {tx.category && (
                      <p
                        className="text-xs"
                        style={{ color: tx.category.color ?? 'rgba(148,163,184,0.8)' }}
                      >
                        {tx.category.name}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={[
                        'text-sm font-semibold tabular-nums',
                        tx.type === 'expense' ? 'text-danger' : 'text-success',
                      ].join(' ')}
                    >
                      {tx.type === 'expense' ? '−' : '+'}
                      {formatEuro(tx.amount)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, tx)}
                    aria-label={t('list.deleteAria')}
                    className="shrink-0 rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
