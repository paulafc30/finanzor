import { useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useTransactions } from '../../hooks/useTransactions.js'
import { useMonth } from '../../hooks/useMonth.jsx'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/**
 * Grid mensual con un cuadradito por cada día.
 * - Muestra ingresos / gastos del día como dots de colores.
 * - El día actual aparece con un anillo morado.
 * - Click en cualquier día llama a onDayClick(dateString).
 *
 * Las semanas empiezan en lunes (locale español).
 */
export default function MonthCalendar({ onDayClick }) {
  const { data: transactions = [] } = useTransactions()
  const { month } = useMonth()

  // Construir matriz de días que cubre el mes completo + relleno de
  // semanas anterior/siguiente para que el grid sea regular.
  const days = useMemo(() => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [month])

  // Indexar transactions por día (YYYY-MM-DD)
  const byDay = useMemo(() => {
    const map = new Map()
    for (const t of transactions) {
      const key = t.occurred_on
      if (!map.has(key)) map.set(key, { income: 0, expense: 0, count: 0 })
      const cur = map.get(key)
      if (t.type === 'income') cur.income += Number(t.amount)
      else cur.expense += Number(t.amount)
      cur.count += 1
    }
    return map
  }, [transactions])

  const today = new Date()

  return (
    <div className="rounded-2xl bg-bg-elevated p-4 ring-1 ring-white/5 sm:p-5">
      {/* Encabezado de días de la semana */}
      <div className="mb-3 grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-xs font-semibold uppercase tracking-wide text-white/40"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días — celdas grandes para móvil */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, month)
          const isToday = isSameDay(day, today)
          const data = byDay.get(key)

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick?.(key, day)}
              className={[
                'group relative flex min-h-[88px] flex-col items-center justify-between rounded-lg p-2 transition sm:min-h-[110px] sm:p-3',
                inMonth ? 'bg-bg-card/50 hover:bg-bg-card' : 'opacity-30 hover:opacity-60',
                isToday ? 'ring-2 ring-accent' : '',
              ].join(' ')}
              aria-label={format(day, "EEEE d 'de' LLLL", { locale: es })}
            >
              <span
                className={[
                  'text-lg font-semibold tabular-nums leading-none sm:text-xl',
                  inMonth ? 'text-white' : 'text-white/50',
                  isToday ? 'text-accent' : '',
                ].join(' ')}
              >
                {format(day, 'd')}
              </span>

              {/* Indicadores de actividad */}
              {data ? (
                <div className="flex items-center gap-1.5">
                  {data.income > 0 && (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-success"
                      title="Ingresos"
                    />
                  )}
                  {data.expense > 0 && (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-danger"
                      title="Gastos"
                    />
                  )}
                </div>
              ) : (
                <span className="h-2.5" />
              )}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-5 flex items-center justify-center gap-5 text-xs text-white/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
          Ingresos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" />
          Gastos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full ring-2 ring-accent" />
          Hoy
        </span>
      </div>
    </div>
  )
}
