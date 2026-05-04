import { useEffect, useState } from 'react'
import Button from '../ui/Button.jsx'
import { useCreateGoal, useUpdateGoal } from '../../hooks/useGoals.js'

/**
 * Formulario de meta de ahorro.
 * - Si recibe `goal`, edita; si no, crea.
 */
export default function GoalForm({ goal, onSuccess }) {
  const isEdit = !!goal
  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()
  const busy = createMutation.isPending || updateMutation.isPending

  const [name, setName] = useState(goal?.name ?? '')
  const [target, setTarget] = useState(goal?.target_amount ?? '')
  const [date, setDate] = useState(goal?.target_date ?? '')
  const [error, setError] = useState(null)

  useEffect(() => {
    setName(goal?.name ?? '')
    setTarget(goal?.target_amount ?? '')
    setDate(goal?.target_date ?? '')
    setError(null)
  }, [goal])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const payload = { name, target_amount: target, target_date: date || null }
      if (isEdit) {
        await updateMutation.mutateAsync({ id: goal.id, ...payload })
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
          placeholder="Vacaciones, fondo emergencia, portátil…"
          autoFocus
          maxLength={60}
          required
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Objetivo (€)
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="500,00"
          required
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Fecha objetivo (opcional)
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-white/40">
          Ayuda a saber para cuándo quieres alcanzar la meta. Es solo informativo.
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={busy} className="flex-1">
          {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear meta'}
        </Button>
      </div>
    </form>
  )
}
