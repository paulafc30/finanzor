import { useMemo } from 'react'
import { parseISO, addDays, format, isSameDay, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransactionsByRange } from '../../hooks/useTransactions.js'

const DAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/**
 * Vista semanal tipo Google Calendar: 7 columnas (L-D).
 * - weekAnchor: 'YYYY-MM-DD' del lunes de la semana
 * - onWeekChange(anchor): callback para cambiar semana
 * - onDayClick(dateKey, date): abre el modal del día
 */
export default function WeekCalendar({ weekAnchor, onWeekChange, onDayClick }) {
  const weekStart = parseISO(weekAnchor)
  const weekEnd = addDays(weekStart, 6)

  const from = format(weekStart, 'yyyy-MM-dd')
  const to = format(weekEnd, 'yyyy-MM-dd')

  const { data: transactions = [] } = useTransactionsByRange(from, to)

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const today = new Date()

  const byDay = useMemo(() => {
    const map = new Map()
    for (const t of transactions) {
      const key = t.occurred_on
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    return map
  }, [transactions])

  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const weekLabel = sameMonth
    ? `${format(weekStart, 'd')} – ${format(weekEnd, 'd MMM yyyy', { locale: es })}`
    : `${format(weekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM yyyy', { locale: es })}`

  return (
    <div className="select-none">
      {/* Navegación */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onWeekChange(format(addDays(weekStart, -7), 'yyyy-MM-dd'))}
          className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium capitalize text-white">{weekLabel}</span>
        <button
          type="button"
          onClick={() => onWeekChange(format(addDays(weekStart, 7), 'yyyy-MM-dd'))}
          className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
          aria-label="Semana siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid de 7 columnas */}
      <div className="grid grid-cols-7 border-l border-t border-white/8">
        {/* Cabeceras de día */}
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          const dayIndex = day.getDay() === 0 ? 6 : day.getDay() - 1

          return (
            <div
              key={`h-${format(day, 'yyyy-MM-dd')}`}
              className="flex flex-col items-center border-b border-r border-white/8 py-2"
            >
              <span
                className={[
                  'text-[10px] font-semibold uppercase tracking-wider',
                  isToday ? 'text-accent' : 'text-white/35',
                ].join(' ')}
              >
                {DAY_SHORT[dayIndex]}
              </span>
              <span
                className={[
                  'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                  isToday ? 'bg-accent text-white' : 'text-white',
                ].join(' ')}
              >
                {format(day, 'd')}
              </span>
            </div>
          )
        })}

        {/* Columnas de transacciones */}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const isToday = isSameDay(day, today)
          const dayTxs = byDay.get(key) ?? []

          return (
            <button
              key={`col-${key}`}
              type="button"
              onClick={() => onDayClick?.(key, day)}
              className={[
                'flex min-h-[140px] w-full flex-col gap-0.5 border-b border-r border-white/8 p-0.5 text-left transition hover:bg-white/3 sm:min-h-[200px] sm:p-1',
                isToday ? 'bg-accent/3' : '',
              ].join(' ')}
              aria-label={format(day, "EEEE d 'de' LLLL", { locale: es })}
            >
              {dayTxs.map((t) => {
                const bg = t.category?.color
                  ? t.category.color + '30'
                  : t.type === 'income'
                  ? '#22c55e20'
                  : '#ef444420'
                const fg = t.category?.color ?? (t.type === 'income' ? '#22c55e' : '#ef4444')

                return (
                  <div
                    key={t.id}
                    className="w-full truncate rounded-[3px] px-0.5 py-px text-[8px] font-semibold tabular-nums leading-tight sm:text-[9px]"
                    style={{ backgroundColor: bg, color: fg }}
                    title={`${t.description || t.category?.name || ''} ${t.type === 'income' ? '+' : '−'}${Number(t.amount).toFixed(2)}€`}
                  >
                    {t.type === 'income' ? '+' : '−'}
                    {formatShortEuro(t.amount)}
                  </div>
                )
              })}
            </button>
          )
        })}
      </div>

      {/* Leyenda compacta */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/50">
        <span className="inline-flex items-center gap-1">
          Toca un día para ver detalle o añadir movimiento
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
