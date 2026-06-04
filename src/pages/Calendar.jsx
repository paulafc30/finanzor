import { useState } from 'react'
import { format, startOfWeek } from 'date-fns'
import { Calendar as CalendarIcon, CalendarRange } from 'lucide-react'
import MonthCalendar from '../components/calendar/MonthCalendar.jsx'
import WeekCalendar from '../components/calendar/WeekCalendar.jsx'
import DayDetailModal from '../components/calendar/DayDetailModal.jsx'
import { useMonth } from '../hooks/useMonth.jsx'

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(null)
  const { isYearView, setViewMode } = useMonth()

  // Vista local: 'month' | 'week'
  const [calView, setCalView] = useState('month')

  // Ancla de la semana visible (lunes de la semana actual por defecto)
  const [weekAnchor, setWeekAnchor] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  )

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
    <section className="space-y-3">
      {/* Header con toggle mes / semana */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="shrink-0 text-info" />
          <h1 className="truncate text-xl font-semibold">Calendario</h1>
        </div>

        {/* Toggle Mes / Semana */}
        <div className="flex rounded-lg bg-bg-elevated p-0.5">
          {[
            { id: 'month', label: 'Mes' },
            { id: 'week', label: 'Semana' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCalView(id)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                calView === id
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white/70',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/50">
        Toca un día para ver sus movimientos o añadir uno nuevo.
      </p>

      {calView === 'month' ? (
        <MonthCalendar onDayClick={(key) => setSelectedDay(key)} />
      ) : (
        <WeekCalendar
          weekAnchor={weekAnchor}
          onWeekChange={setWeekAnchor}
          onDayClick={(key) => setSelectedDay(key)}
        />
      )}

      <DayDetailModal
        dayKey={selectedDay}
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </section>
  )
}
