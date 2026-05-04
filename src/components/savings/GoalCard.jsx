import { Archive, ChevronRight, Calendar } from 'lucide-react'
import { formatEuro, formatDate } from '../../lib/formatters.js'

/**
 * Card de una meta de ahorro.
 * Muestra nombre, contribuido/objetivo, % progreso, barra y fecha objetivo si la hay.
 * Click en cualquier parte abre el detalle (onClick).
 */
export default function GoalCard({ goal, onClick }) {
  const isComplete = goal.percentage >= 100
  const widthPct = Math.min(100, Math.max(0, goal.percentage))

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl bg-bg-elevated p-4 text-left transition hover:bg-bg-card"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold text-white">{goal.name}</h3>
          {goal.is_archived && (
            <span
              className="inline-flex items-center gap-0.5 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70"
              title="Archivada"
            >
              <Archive size={10} />
              Archivada
            </span>
          )}
          {isComplete && !goal.is_archived && (
            <span className="rounded-md bg-success/20 px-1.5 py-0.5 text-[10px] font-medium text-success">
              ¡Completada!
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-white">
            {formatEuro(goal.contributed)}
          </span>
          <span className="text-white/50">de {formatEuro(goal.target_amount)}</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/5">
          <div
            className={[
              'h-full rounded-full transition-all',
              isComplete ? 'bg-success' : 'bg-accent',
            ].join(' ')}
            style={{ width: `${widthPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/40">
          <span>{goal.percentage.toFixed(0)}%</span>
          {goal.target_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(goal.target_date)}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={18} className="shrink-0 text-white/30 group-hover:text-white/60" />
    </button>
  )
}
