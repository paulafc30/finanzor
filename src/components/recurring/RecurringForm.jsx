import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button.jsx'
import { useCategories } from '../../hooks/useCategories.js'
import {
  useCreateRecurring,
  useUpdateRecurring,
} from '../../hooks/useRecurringExpenses.js'

/**
 * Formulario de recurrente (gasto fijo o ingreso fijo).
 *
 * Props:
 *  - recurring: si se pasa, modo edición.
 *  - defaultType: 'expense' | 'income'. Solo aplica si se está creando.
 *    Permite que la página Presupuesto abra el modal "Nuevo ingreso fijo"
 *    sin obligar al usuario a tocar el toggle.
 *  - onSuccess: callback al guardar.
 *
 * Reglas:
 *  - Día limitado a 1-28 para evitar problemas con febrero.
 *  - En gastos la categoría es obligatoria. En ingresos, opcional.
 */
export default function RecurringForm({ recurring, defaultType = 'expense', onSuccess }) {
  const { t } = useTranslation('recurring')
  const isEdit = !!recurring
  const { data: categories = [] } = useCategories()
  const createMutation = useCreateRecurring()
  const updateMutation = useUpdateRecurring()
  const busy = createMutation.isPending || updateMutation.isPending

  const [type, setType] = useState(recurring?.type ?? defaultType)
  const [name, setName] = useState(recurring?.name ?? '')
  const [amount, setAmount] = useState(recurring?.amount ?? '')
  const [categoryId, setCategoryId] = useState(recurring?.category?.id ?? '')
  const [day, setDay] = useState(recurring?.day_of_month ?? 1)
  const [isActive, setIsActive] = useState(recurring?.is_active ?? true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setType(recurring?.type ?? defaultType)
    setName(recurring?.name ?? '')
    setAmount(recurring?.amount ?? '')
    setCategoryId(recurring?.category?.id ?? '')
    setDay(recurring?.day_of_month ?? 1)
    setIsActive(recurring?.is_active ?? true)
    setError(null)
  }, [recurring, defaultType])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
        type,
        name,
        amount,
        category_id: categoryId || null,
        day_of_month: day,
        is_active: isActive,
      }
      if (isEdit) {
        await updateMutation.mutateAsync({ id: recurring.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onSuccess?.()
    } catch (err) {
      setError(err.message ?? t('errors.saveFailed'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Toggle Gasto / Ingreso */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-bg-card p-1">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={[
            'rounded-md py-2 text-sm font-medium transition',
            type === 'expense'
              ? 'bg-danger text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          {t('expenseType')}
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={[
            'rounded-md py-2 text-sm font-medium transition',
            type === 'income'
              ? 'bg-success text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          {t('incomeType')}
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          {t('nameLabel')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            type === 'income'
              ? t('namePlaceholderIncome')
              : t('namePlaceholderExpense')
          }
          autoFocus
          maxLength={60}
          required
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          {t('amountLabel')}
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          required
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          {t('categoryLabel')} {type === 'expense' && <span className="text-danger">*</span>}
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        >
          <option value="">
            {type === 'income' ? t('noCategory') : t('selectPlaceholder')}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          {t('dayLabel')}
        </label>
        <input
          type="number"
          min="1"
          max="28"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          required
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-white/40">
          {t('dayHint')}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        {t('activeLabel')}
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={busy} className="flex-1">
          {busy
            ? t('saving')
            : isEdit
            ? t('saveChanges')
            : type === 'income'
            ? t('createIncome')
            : t('createExpense')}
        </Button>
      </div>
    </form>
  )
}
