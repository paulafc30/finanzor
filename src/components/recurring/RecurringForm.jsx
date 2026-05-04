import { useEffect, useState } from 'react'
import Button from '../ui/Button.jsx'
import { useCategories } from '../../hooks/useCategories.js'
import {
  useCreateRecurring,
  useUpdateRecurring,
} from '../../hooks/useRecurringExpenses.js'

/**
 * Formulario de gasto fijo recurrente.
 * - Si recibe `recurring`, edita; si no, crea nuevo.
 * - Día limitado a 1-28 para evitar problemas con febrero.
 */
export default function RecurringForm({ recurring, onSuccess }) {
  const isEdit = !!recurring
  const { data: categories = [] } = useCategories()
  const createMutation = useCreateRecurring()
  const updateMutation = useUpdateRecurring()
  const busy = createMutation.isPending || updateMutation.isPending

  const [name, setName] = useState(recurring?.name ?? '')
  const [amount, setAmount] = useState(recurring?.amount ?? '')
  const [categoryId, setCategoryId] = useState(recurring?.category?.id ?? '')
  const [day, setDay] = useState(recurring?.day_of_month ?? 1)
  const [isActive, setIsActive] = useState(recurring?.is_active ?? true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setName(recurring?.name ?? '')
    setAmount(recurring?.amount ?? '')
    setCategoryId(recurring?.category?.id ?? '')
    setDay(recurring?.day_of_month ?? 1)
    setIsActive(recurring?.is_active ?? true)
    setError(null)
  }, [recurring])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
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
      setError(err.message ?? 'No se pudo guardar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alquiler, Netflix, Gimnasio…"
          autoFocus
          maxLength={60}
          required
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Importe (€)
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
          Categoría
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Día del mes
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
          Limitado a 1–28 para que funcione siempre, incluso en febrero.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        Activo (se generará cada mes automáticamente)
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={busy} className="flex-1">
          {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear gasto fijo'}
        </Button>
      </div>
    </form>
  )
}
