import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMonth } from '../../hooks/useMonth.jsx'
import { formatMonthLabel } from '../../lib/formatters.js'

export default function MonthSwitcher() {
  const { month, prev, next, goToToday } = useMonth()

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={prev}
        aria-label="Mes anterior"
        className="rounded-full p-2 hover:bg-white/5"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={goToToday}
        className="min-w-[140px] rounded-md px-2 py-1 text-center text-sm font-medium hover:bg-white/5"
        title="Volver al mes actual"
      >
        {formatMonthLabel(month)}
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Mes siguiente"
        className="rounded-full p-2 hover:bg-white/5"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
