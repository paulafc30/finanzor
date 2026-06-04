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

export default function MonthCalendar({ onDayClick }) {
  const { data: transactions = [] } = useTransactions()
  const { month } = useMonth()

  const days = useMemo(() => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [month])

  const byDay = useMemo(() => {
    const map = new Map()
    for (const t of transactions) {
      const key = t.occurred_on
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 })
      const cur = map.get(key)
      if (t.type === 'income') cur.income += Number(t.amount)
      else cur.expense += Number(t.amount)
    }
    return map
  }, [transactions])

  const today = new Date()

  return (
    <div className="select-none">
      {/* Cabecera días de la semana */}
      <div className="grid grid-cols-7 border-b border-white/8 pb-2">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold uppercase tracking-wider text-white/35"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 border-l border-t border-white/8">
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
              aria-label={format(day, "EEEE d 'de' LLLL", { locale: es })}
              className="group flex min-h-[56px] flex-col items-center border-b border-r border-white/8 px-0.5 pt-1.5 pb-1 transition hover:bg-white/3 sm:min-h-[80px] sm:p-2"
            >
              {/* Número del día */}
              <span
                className={[
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold leading-none sm:h-7 sm:w-7 sm:text-sm',
                  isToday
                    ? 'bg-accent text-white'
                    : inMonth
                    ? 'text-white group-hover:bg-white/10'
                    : 'text-white/20',
                ].join(' ')}
              >
                {format(day, 'd')}
              </span>

              {/* Chips de importe */}
              {data && (
                <div className="mt-1 flex w-full flex-col gap-px">
                  {data.expense > 0 && (
                    <div
                      className="w-full truncate rounded-[3px] bg-danger/20 px-0.5 text-center text-[8px] font-semibold tabular-nums text-danger sm:text-[9px]"
                      title={`Gastos: ${data.expense.toFixed(2)} €`}
                    >
                      −{formatShortEuro(data.expense)}
                    </div>
                  )}
                  {data.income > 0 && (
                    <div
                      className="w-full truncate rounded-[3px] bg-success/20 px-0.5 text-center text-[8px] font-semibold tabular-nums text-success sm:text-[9px]"
                      title={`Ingresos: ${data.income.toFixed(2)} €`}
                    >
                      +{formatShortEuro(data.income)}
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-white/50">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-[3px] bg-success/30" />
          Ingresos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-[3px] bg-danger/30" />
          Gastos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
            {today.getDate()}
          </span>
          Hoy
        </span>
      </div>
    </div>
  )
}

function formatShortEuro(n) {
  const v = Math.abs(Number(n) || 0)
  if (v >= 10000) return `${Math.round(v / 1000)}k€`
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')}k€`
  if (Number.isInteger(v)) return `${v}€`
  return `${v.toFixed(2).replace('.', ',')}€`
}
