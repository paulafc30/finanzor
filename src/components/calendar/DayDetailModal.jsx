import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  Plus,
  ArrowLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import TransactionForm from '../transactions/TransactionForm.jsx'
import {
  useTransactions,
  useDeleteTransaction,
} from '../../hooks/useTransactions.js'
import { formatEuro, dateFnsLocale } from '../../lib/formatters.js'

/**
 * Modal con el detalle de un día concreto del calendario.
 * Vistas internas: 'list' (default) | 'new' | 'edit'
 *
 * - list: lista de movimientos del día + totales + botón añadir
 * - new: TransactionForm con defaultDate prellenada
 * - edit: TransactionForm con la transaction seleccionada
 */
export default function DayDetailModal({ dayKey, open, onClose }) {
  const { t } = useTranslation('calendar')
  const [view, setView] = useState('list')
  const [editing, setEditing] = useState(null)
  const { data: allTx = [] } = useTransactions()
  const removeMutation = useDeleteTransaction()

  // Filtrar movimientos del día seleccionado
  const items = useMemo(
    () => allTx.filter((t) => t.occurred_on === dayKey),
    [allTx, dayKey],
  )

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of items) {
      if (t.type === 'income') income += Number(t.amount)
      else expense += Number(t.amount)
    }
    return { income, expense, balance: income - expense }
  }, [items])

  function handleClose() {
    setView('list')
    setEditing(null)
    onClose?.()
  }

  function handleEdit(tx) {
    setEditing(tx)
    setView('edit')
  }

  async function handleDelete(tx) {
    const ok = window.confirm(
      t('dayModal.deleteConfirm', {
        type: tx.type === 'expense' ? t('dayModal.typeExpense') : t('dayModal.typeIncome'),
        amount: formatEuro(tx.amount),
      }),
    )
    if (!ok) return
    try {
      await removeMutation.mutateAsync(tx.id)
    } catch (err) {
      alert(t('dayModal.deleteFailed', { error: err.message ?? t('dayModal.unknownError') }))
    }
  }

  if (!dayKey) return null

  const dayLabel = format(new Date(dayKey + 'T00:00:00'), "EEEE d 'de' LLLL", {
    locale: dateFnsLocale(),
  })
  const dayLabelCap = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)

  // Cabeceras según vista
  const titles = {
    list: dayLabelCap,
    new: t('dayModal.newTransaction'),
    edit: t('dayModal.editTransaction'),
  }

  return (
    <Modal open={open} onClose={handleClose} title={titles[view]}>
      {view === 'new' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setView('list')}
            className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
          >
            <ArrowLeft size={13} />
            {t('dayModal.backToDay')}
          </button>
          <TransactionForm
            defaultDate={dayKey}
            onSuccess={() => setView('list')}
          />
        </div>
      )}

      {view === 'edit' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setView('list')
            }}
            className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
          >
            <ArrowLeft size={13} />
            {t('dayModal.backToDay')}
          </button>
          <TransactionForm
            transaction={editing}
            onSuccess={() => {
              setEditing(null)
              setView('list')
            }}
          />
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-4">
          {/* Resumen del día */}
          {items.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-bg-card p-3 text-center text-xs">
              <div>
                <p className="text-white/50">{t('dayModal.income')}</p>
                <p className="mt-0.5 font-semibold text-success">
                  {formatEuro(totals.income)}
                </p>
              </div>
              <div>
                <p className="text-white/50">{t('dayModal.expense')}</p>
                <p className="mt-0.5 font-semibold text-danger">
                  {formatEuro(totals.expense)}
                </p>
              </div>
              <div>
                <p className="text-white/50">{t('dayModal.balance')}</p>
                <p
                  className={[
                    'mt-0.5 font-semibold',
                    totals.balance >= 0 ? 'text-success' : 'text-danger',
                  ].join(' ')}
                >
                  {formatEuro(totals.balance)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-bg-card p-4 text-center text-sm text-white/50">
              {t('dayModal.noTransactions')}
            </div>
          )}

          {/* Botón añadir */}
          <Button onClick={() => setView('new')} className="w-full">
            <Plus size={16} />
            {t('dayModal.addTransaction')}
          </Button>

          {/* Lista */}
          {items.length > 0 && (
            <ul className="overflow-hidden rounded-xl bg-bg-card">
              {items.map((tx) => (
                <li
                  key={tx.id}
                  className="border-b border-white/5 last:border-b-0"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleEdit(tx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleEdit(tx)
                      }
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5"
                  >
                    {tx.type === 'expense' ? (
                      <ArrowDownCircle size={18} className="shrink-0 text-danger" />
                    ) : (
                      <ArrowUpCircle size={18} className="shrink-0 text-success" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm text-white">
                          {tx.description || (tx.category?.name ?? t('dayModal.noDescription'))}
                        </p>
                        {tx.recurring_id && (
                          <Repeat size={11} className="shrink-0 text-accent" />
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

                    <p
                      className={[
                        'shrink-0 text-sm font-semibold',
                        tx.type === 'expense' ? 'text-danger' : 'text-success',
                      ].join(' ')}
                    >
                      {tx.type === 'expense' ? '−' : '+'}
                      {formatEuro(tx.amount)}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(tx)
                      }}
                      aria-label={t('dayModal.deleteAriaLabel')}
                      className="shrink-0 rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}
