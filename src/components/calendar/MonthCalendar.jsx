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

const WEEKDAYS_ES = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

export default function MonthCalendar({ onDayClick, className = '' }) {
  const { data: transactions = [] } = useTransactions()
  const { month } = useMonth()

  const days = useMemo(() => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [month])

  const numWeeks = days.length / 7

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
    <div className={`flex flex-col ${className}`}>
      {/* Cabecera con nombres de día */}
      <div className="grid shrink-0 grid-cols-7 border-b border-white/10 pb-1.5">
        {WEEKDAYS_ES.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium tracking-wide text-white/35"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid estirado — cada fila ocupa 1fr del espacio disponible */}
      <div
        className="grid min-h-0 flex-1 grid-cols-7 border-l border-t border-white/10"
        style={{ gridTemplateRows: `repeat(${numWeeks}, 1fr)` }}
      >
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
              className={[
                'flex h-full flex-col items-start border-b border-r border-white/10 p-1 text-left transition hover:bg-white/[0.03]',
                !inMonth ? 'opacity-30' : '',
              ].join(' ')}
            >
              {/* Número del día — círculo si es hoy */}
              <span
                className={[
                  'mb-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold leading-none',
                  isToday ? 'bg-accent text-white' : 'text-white',
                ].join(' ')}
              >
                {format(day, 'd')}
              </span>

              {/* Chips de transacciones */}
              {data && (
                <div className="flex w-full flex-col gap-px">
                  {data.expense > 0 && (
                    <div
                      className="w-full truncate rounded-[3px] bg-danger/25 px-1 py-px text-[9px] font-semibold leading-tight text-danger"
                      title={`Gastos: ${data.expense.toFixed(2)} €`}
                    >
                      −{formatShortEuro(data.expense)}
                    </div>
                  )}
                  {data.income > 0 && (
                    <div
                      className="w-full truncate rounded-[3px] bg-success/25 px-1 py-px text-[9px] font-semibold leading-tight text-success"
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
