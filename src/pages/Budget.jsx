import { useEffect, useMemo, useState } from 'react'
import { Info, X, Plus, CalendarRange } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import BudgetRow from '../components/budget/BudgetRow.jsx'
import RecurringList from '../components/recurring/RecurringList.jsx'
import RecurringForm from '../components/recurring/RecurringForm.jsx'
import {
  useBudgetSummary,
  useCopyBudgetsFromPreviousMonth,
} from '../hooks/useBudgets.js'
import {
  useMaterializeRecurring,
  useRecurringExpenses,
} from '../hooks/useRecurringExpenses.js'
import { useMonth } from '../hooks/useMonth.jsx'
import { formatEuro } from '../lib/formatters.js'

export default function Budget() {
  const { rows, isLoading, error } = useBudgetSummary()
  const copyMutation = useCopyBudgetsFromPreviousMonth()
  const materialize = useMaterializeRecurring()
  const { data: recurrings = [] } = useRecurringExpenses()
  const { rangeStart, isYearView, setViewMode } = useMonth()

  const [justCopied, setJustCopied] = useState(false)
  const [recurringEdit, setRecurringEdit] = useState(null) // null | 'new' | object
  const recurringModalOpen = recurringEdit !== null

  const totals = useMemo(() => {
    let totalBudget = 0
    let totalSpent = 0
    for (const r of rows) {
      totalBudget += r.budgetAmount
      totalSpent += r.spentAmount
    }
    return { totalBudget, totalSpent }
  }, [rows])

  // Reset del aviso al cambiar de mes
  useEffect(() => {
    setJustCopied(false)
  }, [rangeStart])

  // Auto-copiar presupuestos del mes anterior cuando se entra a un mes vacío
  // por primera vez. Tracker en localStorage para respetar la decisión del
  // usuario si decide vaciarlos a propósito.
  const monthKey = `finanzor.budgetCopied:${rangeStart}`
  useEffect(() => {
    if (isYearView) return // los presupuestos son mensuales: en año no aplica
    if (isLoading) return
    if (typeof window === 'undefined') return

    const alreadyTriedCopy = localStorage.getItem(monthKey) === '1'
    if (totals.totalBudget === 0 && !copyMutation.isPending && !alreadyTriedCopy) {
      localStorage.setItem(monthKey, '1')
      copyMutation.mutate(undefined, {
        onSuccess: (res) => {
          if (res?.inserted > 0) setJustCopied(true)
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, totals.totalBudget, monthKey, isYearView])

  // Materializar gastos fijos del mes seleccionado.
  // Sin tracker en localStorage: la operación es idempotente, barata, y
  // así se ejecuta también cuando el usuario añade/edita un recurrente.
  // Se dispara al cambiar de mes O al cambiar la lista de recurrentes activos.
  const activeCount = recurrings.filter((r) => r.is_active).length
  useEffect(() => {
    if (isYearView) return // los recurrentes se materializan a nivel de mes
    if (activeCount === 0) return
    if (materialize.isPending) return
    materialize.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, activeCount, isYearView])

  if (isYearView) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold">Presupuesto</h1>
        <div className="rounded-xl bg-bg-elevated p-8 text-center ring-1 ring-white/5">
          <CalendarRange size={32} className="mx-auto mb-3 text-white/40" />
          <p className="text-white">Los presupuestos se definen por mes.</p>
          <p className="mt-1 text-sm text-white/60">
            Cambia la vista a "Mes" para gestionar los límites de un mes concreto.
          </p>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Cambiar a vista mensual
          </button>
        </div>
      </section>
    )
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

  const hasAnyBudget = totals.totalBudget > 0

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Presupuesto</h1>

      {justCopied && (
        <div className="flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-sm text-white ring-1 ring-accent/20">
          <Info size={16} className="mt-0.5 shrink-0 text-accent" />
          <p className="flex-1">
            Se ha copiado el presupuesto del mes anterior. Ajusta los importes que
            necesites tocando cada límite.
          </p>
          <button
            type="button"
            onClick={() => setJustCopied(false)}
            aria-label="Descartar aviso"
            className="rounded-md p-0.5 text-white/60 hover:bg-white/5 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* === Sección: Gastos fijos recurrentes === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Gastos fijos</h2>
          <Button size="sm" onClick={() => setRecurringEdit('new')}>
            <Plus size={16} />
            Nuevo
          </Button>
        </div>

        <RecurringList onEdit={(r) => setRecurringEdit(r)} />

        <details className="rounded-xl bg-bg-elevated/50 p-3 text-xs text-white/60 [&>summary]:cursor-pointer [&[open]>summary]:mb-2">
          <summary className="flex items-center gap-1.5 text-white/70 hover:text-white">
            <Info size={13} />
            Cómo funcionan los gastos fijos
          </summary>
          <ul className="ml-1 list-disc space-y-1 pl-4">
            <li>
              Al entrar a un mes, los activos se crean como movimientos
              automáticamente con el día y categoría que les hayas puesto.
            </li>
            <li>
              <strong>Si añades uno hoy</strong>, se genera al instante también
              en el mes que estés viendo, aunque el día ya hubiera pasado.
            </li>
            <li>
              <strong>Desactivar</strong> pausa sin borrar: deja de generarse en
              meses futuros, pero los movimientos pasados se mantienen.
            </li>
            <li>
              <strong>Editar</strong> (importe, día…) solo afecta a meses futuros
              aún no generados. Para ajustar el de un mes concreto, edita el
              movimiento directamente.
            </li>
            <li>
              <strong>Eliminar</strong> el gasto fijo borra los movimientos
              futuros que aún no han ocurrido. Los pasados se mantienen para
              no falsear el histórico.
            </li>
          </ul>
        </details>
      </div>

      {/* === Sección: Presupuestos por categoría === */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Presupuestos por categoría</h2>

        {hasAnyBudget && (
          <div className="rounded-xl bg-bg-elevated p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Total del mes</span>
              <span className="font-semibold text-white">
                {formatEuro(totals.totalSpent)}{' '}
                <span className="text-white/40">
                  / {formatEuro(totals.totalBudget)}
                </span>
              </span>
            </div>
          </div>
        )}

        {!hasAnyBudget && !copyMutation.isPending && (
          <div className="rounded-xl bg-bg-elevated p-6 text-center">
            <p className="text-white">Aún no has definido presupuestos.</p>
            <p className="mt-1 text-sm text-white/60">
              Pulsa "Sin límite" en cualquier categoría para fijar uno.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {rows.map((row) => (
            <BudgetRow key={row.category.id} row={row} />
          ))}
        </div>

        <p className="px-1 text-xs text-white/40">
          Click en el importe del límite para editarlo. Pon 0 para quitar el
          presupuesto de esa categoría.
        </p>
      </div>

      <Modal
        open={recurringModalOpen}
        onClose={() => setRecurringEdit(null)}
        title={recurringEdit === 'new' ? 'Nuevo gasto fijo' : 'Editar gasto fijo'}
      >
        <RecurringForm
          recurring={recurringEdit && recurringEdit !== 'new' ? recurringEdit : null}
          onSuccess={() => setRecurringEdit(null)}
        />
      </Modal>
    </section>
  )
}
