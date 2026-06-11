import { useMemo, useState } from 'react'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Fab from '../components/ui/Fab.jsx'
import GoalCard from '../components/savings/GoalCard.jsx'
import GoalForm from '../components/savings/GoalForm.jsx'
import GoalDetailModal from '../components/savings/GoalDetailModal.jsx'
import PiggyIcon from '../components/savings/PiggyIcon.jsx'
import { useGoals } from '../hooks/useGoals.js'
import { useSavingsFromExpenses } from '../hooks/useSavingsFromExpenses.js'
import { formatEuro } from '../lib/formatters.js'

export default function Savings() {
  const [showArchived, setShowArchived] = useState(false)
  const { goals, isLoading, error } = useGoals({ includeArchived: showArchived })
  const { data: savingsExp } = useSavingsFromExpenses()

  const [creating, setCreating] = useState(false)
  const [openGoal, setOpenGoal] = useState(null)

  // Mantener referenciada la versión más reciente de la goal abierta
  const liveOpenGoal = useMemo(() => {
    if (!openGoal) return null
    return goals.find((g) => g.id === openGoal.id) ?? openGoal
  }, [openGoal, goals])

  const totals = useMemo(() => {
    let target = 0
    let contributed = 0
    for (const g of goals) {
      if (g.is_archived) continue
      target += g.target_amount
      contributed += g.contributed
    }
    return { target, contributed }
  }, [goals])

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

  const activeGoals = goals.filter((g) => !g.is_archived)
  const archivedGoals = goals.filter((g) => g.is_archived)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ahorro</h1>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md bg-bg-elevated px-2.5 py-1.5 text-xs text-white/70 hover:text-white"
        >
          {showArchived ? <EyeOff size={13} /> : <Eye size={13} />}
          {showArchived ? 'Ocultar archivadas' : 'Ver archivadas'}
        </button>
      </div>

      {/* Categoría Ahorro: cerdito grande con el total dentro */}
      <div className="rounded-xl bg-success/10 p-4 ring-1 ring-success/20">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Categoría Ahorro</h2>
          <p className="text-[11px] text-white/50">
            gastos como "Ahorro"
          </p>
        </div>

        {/* Cerdito grande con la cifra total renderizada dentro */}
        <div className="flex justify-center py-2">
          <PiggyIcon
            size={180}
            amount={piggyFormat(savingsExp?.allTotal ?? 0)}
            label="ahorrado"
            className="text-success"
          />
        </div>

      </div>

      {/* Resumen total de metas activas */}
      {activeGoals.length > 0 && (
        <div className="rounded-xl bg-bg-elevated p-3 ring-1 ring-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-white/60">
              <TrendingUp size={14} />
              Progreso total de metas
            </span>
            <span className="font-semibold text-white tabular-nums">
              {formatEuro(totals.contributed)}{' '}
              <span className="text-white/40">/ {formatEuro(totals.target)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Activas */}
      {activeGoals.length === 0 ? (
        <div className="rounded-xl bg-bg-elevated p-8 text-center">
          <p className="text-white">No tienes metas activas.</p>
          <p className="mt-1 text-sm text-white/60">
            Pulsa el + para crear la primera (un viaje, fondo de emergencia, una compra…).
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeGoals.map((g) => (
            <GoalCard key={g.id} goal={g} onClick={() => setOpenGoal(g)} />
          ))}
        </div>
      )}

      {/* Archivadas */}
      {showArchived && archivedGoals.length > 0 && (
        <div className="space-y-2 pt-4">
          <h2 className="text-xs uppercase tracking-wide text-white/40">
            Archivadas
          </h2>
          {archivedGoals.map((g) => (
            <GoalCard key={g.id} goal={g} onClick={() => setOpenGoal(g)} />
          ))}
        </div>
      )}

      <Fab onClick={() => setCreating(true)} ariaLabel="Nueva meta" />

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva meta">
        <GoalForm onSuccess={() => setCreating(false)} />
      </Modal>

      <GoalDetailModal
        goal={liveOpenGoal}
        open={!!openGoal}
        onClose={() => setOpenGoal(null)}
      />
    </section>
  )
}

/**
 * Formato compacto pensado para encajar dentro del SVG del cerdito,
 * donde el espacio es pequeño. Ejemplos:
 *   0       → "0 €"
 *   12      → "12 €"
 *   1234    → "1.234 €"
 *   12345   → "12.345 €"
 *   123456  → "123 k€"   (a partir de 100.000 abreviamos)
 */
function piggyFormat(n) {
  const v = Math.abs(Number(n) || 0)
  if (v >= 100000) return `${Math.round(v / 1000)} k€`
  // Separador de miles con punto, sin decimales (lo que cabe).
  const intPart = Math.round(v).toLocaleString('es-ES')
  return `${intPart} €`
}
