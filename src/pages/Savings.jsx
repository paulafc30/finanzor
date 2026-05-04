import { useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Fab from '../components/ui/Fab.jsx'
import GoalCard from '../components/savings/GoalCard.jsx'
import GoalForm from '../components/savings/GoalForm.jsx'
import GoalDetailModal from '../components/savings/GoalDetailModal.jsx'
import { useGoals } from '../hooks/useGoals.js'
import { formatEuro } from '../lib/formatters.js'

export default function Savings() {
  const [showArchived, setShowArchived] = useState(false)
  const { goals, isLoading, error } = useGoals({ includeArchived: showArchived })

  const [creating, setCreating] = useState(false)
  const [openGoal, setOpenGoal] = useState(null) // goal seleccionada para detalle

  // Mantener referenciada la versión más reciente de la goal abierta para que al
  // recargar la lista (después de aportar / editar) el modal se actualice.
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

      {/* Resumen total de metas activas */}
      {activeGoals.length > 0 && (
        <div className="rounded-xl bg-bg-elevated p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Progreso total</span>
            <span className="font-semibold text-white">
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

      {/* Archivadas (solo si está activado el toggle) */}
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

      {/* Modal: nueva meta */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nueva meta"
      >
        <GoalForm onSuccess={() => setCreating(false)} />
      </Modal>

      {/* Modal: detalle de meta */}
      <GoalDetailModal
        goal={liveOpenGoal}
        open={!!openGoal}
        onClose={() => setOpenGoal(null)}
      />
    </section>
  )
}
