import { useState } from 'react'
import { Calendar as CalendarIcon, CalendarRange, ChevronDown } from 'lucide-react'
import MonthCalendar from '../components/calendar/MonthCalendar.jsx'
import DayDetailModal from '../components/calendar/DayDetailModal.jsx'
import MonthYearPicker from '../components/layout/MonthYearPicker.jsx'
import { useMonth } from '../hooks/useMonth.jsx'
import { formatMonthLabel } from '../lib/formatters.js'

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const { isYearView, setViewMode, month, goToMonth } = useMonth()

  if (isYearView) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="text-info" />
          <h1 className="text-xl font-semibold">Calendario</h1>
        </div>

        <div className="rounded-xl bg-bg-elevated p-6 text-center ring-1 ring-white/5 sm:p-8">
          <CalendarRange size={32} className="mx-auto mb-3 text-white/40" />
          <p className="text-white">El calendario es mensual.</p>
          <p className="mt-1 text-sm text-white/60">
            Cambia la vista superior a "Mes" para ver el calendario.
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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarIcon size={20} className="shrink-0 text-info" />
          <h1 className="truncate text-xl font-semibold">Calendario</h1>
        </div>

        {/* Selector mes/año dentro de la página */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-bg-elevated px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/5 hover:bg-white/5"
          aria-haspopup="dialog"
        >
          <span className="capitalize">{formatMonthLabel(month)}</span>
          <ChevronDown size={14} className="text-white/50" />
        </button>
      </div>

      <p className="text-xs text-white/50">
        Toca cualquier día para ver sus movimientos o añadir uno nuevo con esa fecha.
      </p>

      <MonthCalendar onDayClick={(key) => setSelectedDay(key)} />

      <DayDetailModal
        dayKey={selectedDay}
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
      />

      <MonthYearPicker
        open={pickerOpen}
        mode="month"
        value={month}
        onSelect={(d) => {
          goToMonth(d)
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
      />
    </section>
  )
}
