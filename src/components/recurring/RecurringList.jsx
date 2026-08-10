import { Pencil, Trash2, Repeat, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatEuro } from '../../lib/formatters.js'
import {
  useRecurringExpenses,
  useToggleRecurring,
  useDeleteRecurring,
} from '../../hooks/useRecurringExpenses.js'

/**
 * Lista de recurrentes con toggle activar/desactivar, editar y eliminar.
 *
 * Props:
 *  - type: 'expense' | 'income' — filtra los recurrentes por tipo.
 *  - onEdit: callback al pulsar editar.
 */
export default function RecurringList({ type = 'expense', onEdit }) {
  const { t } = useTranslation('recurring')
  const { data: recurrings = [], isLoading } = useRecurringExpenses({ type })
  const toggle = useToggleRecurring()
  const remove = useDeleteRecurring()

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (recurrings.length === 0) {
    return (
      <div className="rounded-xl bg-bg-elevated p-4 text-center text-sm text-white/60">
        {type === 'income'
          ? t('emptyIncome')
          : t('emptyExpense')}
      </div>
    )
  }

  async function handleToggle(r) {
    try {
      await toggle.mutateAsync({ id: r.id, is_active: !r.is_active })
    } catch (err) {
      alert(t('errors.toggleFailed', { message: err.message ?? 'error' }))
    }
  }

  async function handleDelete(r) {
    const noun = r.type === 'income' ? t('incomeNoun') : t('expenseNoun')
    const ok = window.confirm(
      t('confirmDelete', { noun, name: r.name }),
    )
    if (!ok) return
    try {
      await remove.mutateAsync(r.id)
    } catch (err) {
      alert(t('errors.deleteFailed', { message: err.message ?? 'error' }))
    }
  }

  return (
    <ul className="space-y-2">
      {recurrings.map((r) => {
        const isIncome = r.type === 'income'
        const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle
        const iconClass = isIncome ? 'text-success' : 'text-danger'
        return (
          <li
            key={r.id}
            className={[
              'flex items-center gap-3 rounded-xl bg-bg-elevated p-3',
              r.is_active ? '' : 'opacity-50',
            ].join(' ')}
          >
            <Icon size={18} className={`shrink-0 ${iconClass}`} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-white">
                  {r.name}
                </span>
                {r.category && (
                  <span
                    className="text-xs"
                    style={{ color: r.category.color ?? 'rgba(148,163,184,0.8)' }}
                  >
                    · {r.category.name}
                  </span>
                )}
                <Repeat
                  size={11}
                  className="shrink-0 text-accent/70"
                  aria-label={t('recurringAria')}
                />
              </div>
              <p className="text-xs text-white/50">
                {t('amountDayLine', { amount: formatEuro(r.amount), day: r.day_of_month })}
              </p>
            </div>

            {/* Toggle activo */}
            <label
              className="shrink-0 cursor-pointer"
              title={r.is_active ? t('statusActive') : t('statusInactive')}
            >
              <input
                type="checkbox"
                checked={r.is_active}
                onChange={() => handleToggle(r)}
                className="peer sr-only"
              />
              <span className="block h-5 w-9 rounded-full bg-white/10 transition peer-checked:bg-accent">
                <span
                  className={[
                    'block h-4 w-4 translate-x-0.5 translate-y-0.5 rounded-full bg-white transition',
                    r.is_active ? 'translate-x-[18px]' : '',
                  ].join(' ')}
                />
              </span>
            </label>

            <button
              type="button"
              onClick={() => onEdit(r)}
              aria-label={t('editAria')}
              className="shrink-0 rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(r)}
              aria-label={t('deleteAria')}
              className="shrink-0 rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
