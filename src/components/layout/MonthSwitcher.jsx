import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMonth } from '../../hooks/useMonth.jsx'
import { formatMonthLabel, formatYearLabel } from '../../lib/formatters.js'

export default function MonthSwitcher() {
  const { month, prev, next, goToToday, viewMode, setViewMode, isYearView } =
    useMonth()

  const label = isYearView ? formatYearLabel(month) : formatMonthLabel(month)

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={prev}
          aria-label={isYearView ? 'Año anterior' : 'Mes anterior'}
          className="rounded-full p-2 hover:bg-white/5"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={goToToday}
          className="min-w-[120px] rounded-md px-2 py-1 text-center text-sm font-medium hover:bg-white/5"
          title={isYearView ? 'Volver al año actual' : 'Volver al mes actual'}
        >
          {label}
        </button>
        <button
          type="button"
          onClick={next}
          aria-label={isYearView ? 'Año siguiente' : 'Mes siguiente'}
          className="rounded-full p-2 hover:bg-white/5"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Toggle Mes / Año */}
      <div
        role="tablist"
        aria-label="Vista por mes o por año"
        className="flex shrink-0 rounded-full bg-bg-card p-0.5 ring-1 ring-white/5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'month'}
          onClick={() => setViewMode('month')}
          className={[
            'rounded-full px-2.5 py-1 text-[11px] font-semibold transition',
            viewMode === 'month'
              ? 'bg-accent text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          Mes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'year'}
          onClick={() => setViewMode('year')}
          className={[
            'rounded-full px-2.5 py-1 text-[11px] font-semibold transition',
            viewMode === 'year'
              ? 'bg-accent text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          Año
        </button>
      </div>
    </div>
  )
}
