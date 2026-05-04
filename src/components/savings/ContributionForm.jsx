import { useState } from 'react'
import { format } from 'date-fns'
import Button from '../ui/Button.jsx'
import { useCreateContribution } from '../../hooks/useGoalContributions.js'

/**
 * Formulario para añadir una aportación a una meta.
 */
export default function ContributionForm({ goalId, onSuccess }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [error, setError] = useState(null)
  const create = useCreateContribution()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await create.mutateAsync({
        goal_id: goalId,
        amount,
        contributed_on: date,
      })
      onSuccess?.()
    } catch (err) {
      setError(err.message ?? 'No se pudo guardar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Cantidad (€)
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="50,00"
          autoFocus
          required
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-lg font-semibold text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Fecha
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={create.isPending} className="flex-1">
          {create.isPending ? 'Guardando…' : 'Aportar'}
        </Button>
      </div>
    </form>
  )
}
