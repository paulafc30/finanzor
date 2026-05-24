import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { useMonth } from '../../hooks/useMonth.jsx'
import { formatMonthLabel, formatYearLabel } from '../../lib/formatters.js'
import MonthYearPicker from './MonthYearPicker.jsx'

export default function MonthSwitcher() {
  const {
    month,
    prev,
    next,
    viewMode,
    setViewMode,
    isYearView,
    goToMonth,
    goToYear,
  } = useMonth()

  const [pickerOpen, setPickerOpen] = useState(false)

  const label = isYearView ? formatYearLabel(month) : formatMonthLabel(month)

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div className="flex items-center">
        <button
          type="button"
          onClick={prev}
          aria-label={isYearView ? 'Año anterior' : 'Mes anterior'}
          className="rounded-full p-1.5 hover:bg-white/5 sm:p-2"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-center text-sm font-medium hover:bg-white/5 sm:px-2"
          title={isYearView ? 'Cambiar de año' : 'Cambiar mes/año'}
          aria-haspopup="dialog"
        >
          <span className="whitespace-nowrap">{label}</span>
          <ChevronDown size={14} className="text-white/50" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label={isYearView ? 'Año siguiente' : 'Mes siguiente'}
          className="rounded-full p-1.5 hover:bg-white/5 sm:p-2"
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
            'rounded-full px-2 py-1 text-[11px] font-semibold transition sm:px-2.5',
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
            'rounded-full px-2 py-1 text-[11px] font-semibold transition sm:px-2.5',
            viewMode === 'year'
              ? 'bg-accent text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          Año
        </button>
      </div>

      <MonthYearPicker
        open={pickerOpen}
        mode={isYearView ? 'year' : 'month'}
        value={month}
        onSelect={(d) => {
          if (isYearView) goToYear(d.getFullYear())
          else goToMonth(d)
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )
}
