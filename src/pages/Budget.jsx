import { useMemo } from 'react'
import Button from '../components/ui/Button.jsx'
import BudgetRow from '../components/budget/BudgetRow.jsx'
import { useBudgetSummary, useCopyBudgetsFromPreviousMonth } from '../hooks/useBudgets.js'
import { formatEuro } from '../lib/formatters.js'

export default function Budget() {
  const { rows, isLoading, error } = useBudgetSummary()
  const copyMutation = useCopyBudgetsFromPreviousMonth()

  const totals = useMemo(() => {
    let totalBudget = 0
    let totalSpent = 0
    for (const r of rows) {
      totalBudget += r.budgetAmount
      totalSpent += r.spentAmount
    }
    return { totalBudget, totalSpent }
  }, [rows])

  const hasAnyBudget = totals.totalBudget > 0

  async function handleCopy() {
    try {
      const res = await copyMutation.mutateAsync()
      if (!res || res.inserted === 0) {
        alert('No hay presupuestos del mes anterior para copiar.')
      }
    } catch (err) {
      alert('No se pudo copiar: ' + (err.message ?? 'error'))
    }
  }

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
        Error: {error.message}
      </p>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Presupuesto</h1>
        {!hasAnyBudget && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            disabled={copyMutation.isPending}
          >
            {copyMutation.isPending ? 'Copiando…' : 'Copiar mes anterior'}
          </Button>
        )}
      </div>

      {hasAnyBudget && (
        <div className="rounded-xl bg-bg-elevated p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Total del mes</span>
            <span className="font-semibold text-white">
              {formatEuro(totals.totalSpent)}{' '}
              <span className="text-white/40">/ {formatEuro(totals.totalBudget)}</span>
            </span>
          </div>
        </div>
      )}

      {!hasAnyBudget ? (
        <div className="rounded-xl bg-bg-elevated p-6 text-center">
          <p className="text-white">Aún no has definido presupuestos este mes.</p>
          <p className="mt-1 text-sm text-white/60">
            Pulsa el importe "Sin límite" de cada categoría para fijar uno, o copia
            los del mes anterior con el botón de arriba.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        {rows.map((row) => (
          <BudgetRow key={row.category.id} row={row} />
        ))}
      </div>

      <p className="px-1 text-xs text-white/40">
        Click en el importe del límite para editarlo. Pon 0 para quitar el
        presupuesto de esa categoría.
      </p>
    </section>
  )
}
