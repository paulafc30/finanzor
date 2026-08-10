import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import BudgetBar from './BudgetBar.jsx'
import { formatEuro } from '../../lib/formatters.js'
import { useUpsertBudget } from '../../hooks/useBudgets.js'

/**
 * Una fila de presupuesto por categoría.
 * - Muestra: nombre, gastado/presupuestado, barra de progreso
 * - Click sobre el importe presupuestado → editor inline
 * - Enter o blur → guarda; Escape → cancela
 * - Si pones 0 se elimina el presupuesto
 */
export default function BudgetRow({ row }) {
  const { t } = useTranslation('budget')
  const { category, budgetAmount, spentAmount, percentage, status } = row
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(budgetAmount || ''))
  const inputRef = useRef(null)
  const upsert = useUpsertBudget()

  useEffect(() => {
    setDraft(String(budgetAmount || ''))
  }, [budgetAmount])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function startEdit() {
    setDraft(budgetAmount ? String(budgetAmount) : '')
    setEditing(true)
  }

  async function commit() {
    setEditing(false)
    const value = Number(String(draft).replace(',', '.'))
    if (!Number.isFinite(value) || value < 0) return
    if (value === budgetAmount) return // sin cambios
    try {
      await upsert.mutateAsync({ category_id: category.id, amount: value })
    } catch (err) {
      alert(t('row.saveError', { error: err.message ?? 'error' }))
      setDraft(String(budgetAmount || ''))
    }
  }

  function cancel() {
    setEditing(false)
    setDraft(String(budgetAmount || ''))
  }

  return (
    <div className="rounded-xl bg-bg-elevated p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: category.color ?? '#94a3b8' }}
          />
          <span className="text-sm font-medium text-white">{category.name}</span>
        </div>

        <div className="flex items-baseline gap-1 text-sm">
          <span
            className={
              status === 'over'
                ? 'font-semibold text-danger'
                : status === 'warn'
                  ? 'font-semibold text-warning'
                  : 'text-white'
            }
          >
            {formatEuro(spentAmount)}
          </span>
          <span className="text-white/40">/</span>
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') cancel()
              }}
              className="w-20 rounded-md bg-bg-card px-1.5 py-0.5 text-right text-sm text-white outline-none ring-1 ring-accent"
            />
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="text-white/70 hover:text-white"
              title={t('row.editTooltip')}
            >
              {budgetAmount > 0 ? formatEuro(budgetAmount) : t('row.noLimit')}
            </button>
          )}
        </div>
      </div>

      <BudgetBar percentage={percentage} status={status} />

      {budgetAmount > 0 && (
        <div className="mt-1.5 flex justify-between text-[11px] text-white/40">
          <span>{t('row.percentUsed', { percent: percentage.toFixed(0) })}</span>
          <span>
            {budgetAmount - spentAmount >= 0
              ? t('row.remaining', { amount: formatEuro(budgetAmount - spentAmount) })
              : t('row.exceeded', { amount: formatEuro(spentAmount - budgetAmount) })}
          </span>
        </div>
      )}
    </div>
  )
}
