/**
 * Barra de progreso del presupuesto.
 * Color según status: ok=accent, warn=warning, over=danger.
 * Si percentage > 100, satura visualmente al 100% pero el texto muestra el real.
 */
const colorByStatus = {
  ok: 'bg-accent',
  warn: 'bg-warning',
  over: 'bg-danger',
}

export default function BudgetBar({ percentage, status }) {
  const width = Math.min(100, Math.max(0, percentage))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-card">
      <div
        className={[
          'h-full rounded-full transition-all',
          colorByStatus[status] ?? 'bg-white/20',
        ].join(' ')}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
