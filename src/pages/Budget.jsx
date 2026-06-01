import { useEffect, useMemo, useState } from 'react'
import { Info, X, Plus, CalendarRange } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import BudgetRow from '../components/budget/BudgetRow.jsx'
import RecurringList from '../components/recurring/RecurringList.jsx'
import RecurringForm from '../components/recurring/RecurringForm.jsx'
import MonthBudgetBar from '../components/dashboard/MonthBudgetBar.jsx'
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
  // recurringEdit:
  //   null                                  → modal cerrado
  //   { __new: true, type: 'expense' }      → nuevo gasto fijo
  //   { __new: true, type: 'income' }       → nuevo ingreso fijo
  //   <recurring object>                    → editar uno existente
  const [recurringEdit, setRecurringEdit] = useState(null)
  const recurringModalOpen = recurringEdit !== null
  const isNewRecurring = !!recurringEdit?.__new
  const recurringToEdit = isNewRecurring ? null : recurringEdit
  const newRecurringType = isNewRecurring ? recurringEdit.type : 'expense'

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
          <Button
            size="sm"
            onClick={() => setRecurringEdit({ __new: true, type: 'expense' })}
          >
            <Plus size={16} />
            Nuevo
          </Button>
        </div>

        <RecurringList type="expense" onEdit={(r) => setRecurringEdit(r)} />

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

      {/* === Sección: Ingresos fijos recurrentes === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Ingresos fijos</h2>
          <Button
            size="sm"
            onClick={() => setRecurringEdit({ __new: true, type: 'income' })}
          >
            <Plus size={16} />
            Nuevo
          </Button>
        </div>

        <RecurringList type="income" onEdit={(r) => setRecurringEdit(r)} />

        <p className="px-1 text-xs text-white/40">
          Igual que los gastos fijos, pero positivos: nómina, alquiler que cobras,
          una mensualidad… Se materializan automáticamente cada mes y se contabilizan
          como ingreso en las estadísticas.
        </p>
      </div>

      {/* === Sección: Presupuestos por categoría === */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Presupuestos por categoría</h2>

        {/* Barra resumen del presupuesto del mes (movida desde el Dashboard) */}
        {hasAnyBudget && <MonthBudgetBar />}

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

        <details className="rounded-xl bg-bg-elevated/50 p-3 text-xs text-white/60 [&>summary]:cursor-pointer [&[open]>summary]:mb-2">
          <summary className="flex items-center gap-1.5 text-white/70 hover:text-white">
            <Info size={13} />
            Cómo funcionan los presupuestos
          </summary>
          <ul className="ml-1 list-disc space-y-1 pl-4">
            <li>
              Cada presupuesto vive <strong>en un mes concreto</strong>. Si en
              marzo subes el de Alimentación a 500 €, abril sigue con su valor
              propio, no se cambian todos los meses a la vez.
            </li>
            <li>
              Al entrar a un mes nuevo sin presupuestos, copiamos los del mes
              anterior <strong>una sola vez</strong> para que no empieces de
              cero cada vez.
            </li>
            <li>
              Click en el importe del límite para editarlo. Pon <strong>0</strong>
              para quitar el presupuesto de esa categoría ese mes.
            </li>
            <li>
              El gasto que cuenta se filtra por la fecha real del movimiento
              (<em>occurred_on</em>), no por cuándo lo apuntaste.
            </li>
            <li>
              Estados de la barra: hasta el 70 % verde, 70-90 % naranja, a partir
              del 90 % rojo.
            </li>
          </ul>
        </details>
      </div>

      <Modal
        open={recurringModalOpen}
        onClose={() => setRecurringEdit(null)}
        title={
          isNewRecurring
            ? newRecurringType === 'income'
              ? 'Nuevo ingreso fijo'
              : 'Nuevo gasto fijo'
            : recurringToEdit?.type === 'income'
            ? 'Editar ingreso fijo'
            : 'Editar gasto fijo'
        }
      >
        <RecurringForm
          recurring={recurringToEdit}
          defaultType={newRecurringType}
          onSuccess={() => setRecurringEdit(null)}
        />
      </Modal>
    </section>
  )
}
