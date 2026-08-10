import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

export default function Budget() {
  const { t } = useTranslation('budget')
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

  // Materializar gastos/ingresos fijos. El hook materializa SOLO en el
  // mes calendario actual, ignorando el mes navegado en el switcher. Asi
  // navegar a mayo no genera nada en mayo. La operacion es idempotente,
  // se puede llamar tantas veces como haga falta sin duplicar.
  // Se dispara cuando cambia la lista de recurrentes activos (nuevo,
  // toggle on/off) o al entrar a la pagina.
  const activeCount = recurrings.filter((r) => r.is_active).length
  useEffect(() => {
    if (activeCount === 0) return
    if (materialize.isPending) return
    materialize.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCount])

  if (isYearView) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <div className="rounded-xl bg-bg-elevated p-8 text-center ring-1 ring-white/5">
          <CalendarRange size={32} className="mx-auto mb-3 text-white/40" />
          <p className="text-white">{t('yearView.notice')}</p>
          <p className="mt-1 text-sm text-white/60">{t('yearView.hint')}</p>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            {t('yearView.switchButton')}
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
        {t('errorPrefix')}{error.message}
      </p>
    )
  }

  const hasAnyBudget = totals.totalBudget > 0

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">{t('title')}</h1>

      {justCopied && (
        <div className="flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-sm text-white ring-1 ring-accent/20">
          <Info size={16} className="mt-0.5 shrink-0 text-accent" />
          <p className="flex-1">{t('copiedNotice')}</p>
          <button
            type="button"
            onClick={() => setJustCopied(false)}
            aria-label={t('dismissNotice')}
            className="rounded-md p-0.5 text-white/60 hover:bg-white/5 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* === Sección: Gastos fijos recurrentes === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{t('fixedExpenses.title')}</h2>
          <Button
            size="sm"
            onClick={() => setRecurringEdit({ __new: true, type: 'expense' })}
          >
            <Plus size={16} />
            {t('fixedExpenses.new')}
          </Button>
        </div>

        <RecurringList type="expense" onEdit={(r) => setRecurringEdit(r)} />

        <details className="rounded-xl bg-bg-elevated/50 p-3 text-xs text-white/60 [&>summary]:cursor-pointer [&[open]>summary]:mb-2">
          <summary className="flex items-center gap-1.5 text-white/70 hover:text-white">
            <Info size={13} />
            {t('fixedExpenses.howItWorks')}
          </summary>
          <ul className="ml-1 list-disc space-y-1 pl-4">
            <li>{t('fixedExpenses.item1')}</li>
            <li dangerouslySetInnerHTML={{ __html: t('fixedExpenses.item2') }} />
            <li dangerouslySetInnerHTML={{ __html: t('fixedExpenses.item3') }} />
            <li dangerouslySetInnerHTML={{ __html: t('fixedExpenses.item4') }} />
            <li dangerouslySetInnerHTML={{ __html: t('fixedExpenses.item5') }} />
          </ul>
        </details>
      </div>

      {/* === Sección: Ingresos fijos recurrentes === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{t('fixedIncome.title')}</h2>
          <Button
            size="sm"
            onClick={() => setRecurringEdit({ __new: true, type: 'income' })}
          >
            <Plus size={16} />
            {t('fixedIncome.new')}
          </Button>
        </div>

        <RecurringList type="income" onEdit={(r) => setRecurringEdit(r)} />

        <p className="px-1 text-xs text-white/40">{t('fixedIncome.hint')}</p>
      </div>

      {/* === Sección: Presupuestos por categoría === */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">{t('byCategory.title')}</h2>

        {/* Barra resumen del presupuesto del mes (movida desde el Dashboard) */}
        {hasAnyBudget && <MonthBudgetBar />}

        {!hasAnyBudget && !copyMutation.isPending && (
          <div className="rounded-xl bg-bg-elevated p-6 text-center">
            <p className="text-white">{t('byCategory.emptyTitle')}</p>
            <p className="mt-1 text-sm text-white/60">{t('byCategory.emptyHint')}</p>
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
            {t('byCategory.howItWorks')}
          </summary>
          <ul className="ml-1 list-disc space-y-1 pl-4">
            <li dangerouslySetInnerHTML={{ __html: t('byCategory.item1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('byCategory.item2') }} />
            <li dangerouslySetInnerHTML={{ __html: t('byCategory.item3') }} />
            <li dangerouslySetInnerHTML={{ __html: t('byCategory.item4') }} />
            <li>{t('byCategory.item5')}</li>
          </ul>
        </details>
      </div>

      <Modal
        open={recurringModalOpen}
        onClose={() => setRecurringEdit(null)}
        title={
          isNewRecurring
            ? newRecurringType === 'income'
              ? t('recurringModal.newIncome')
              : t('recurringModal.newExpense')
            : recurringToEdit?.type === 'income'
            ? t('recurringModal.editIncome')
            : t('recurringModal.editExpense')
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
