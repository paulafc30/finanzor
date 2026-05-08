import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import MonthCalendar from '../components/calendar/MonthCalendar.jsx'
import DayDetailModal from '../components/calendar/DayDetailModal.jsx'

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(null)

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarIcon size={20} className="text-info" />
        <h1 className="text-xl font-semibold">Calendario</h1>
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
    </section>
  )
}
