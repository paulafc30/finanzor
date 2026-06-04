import { useMemo } from 'react'
import { parseISO, addDays, format, isSameDay, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransactionsByRange } from '../../hooks/useTransactions.js'

const DAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Navegación de semana */}
      <div className="flex shrink-0 items-center justify-between">
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

      {/* Grid de 7 columnas estirado */}
      <div className="grid min-h-0 flex-1 grid-cols-7 border-l border-t border-white/10">
        {/* Cabeceras */}
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          const idx = day.getDay() === 0 ? 6 : day.getDay() - 1
          return (
            <div
              key={`h-${format(day, 'yyyy-MM-dd')}`}
              className="flex flex-col items-center border-b border-r border-white/10 py-1.5"
            >
              <span
                className={[
                  'text-[9px] font-medium uppercase tracking-wide',
                  isToday ? 'text-accent' : 'text-white/35',
                ].join(' ')}
              >
                {DAY_SHORT[idx]}
              </span>
              <span
                className={[
                  'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
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
              aria-label={format(day, "EEEE d 'de' LLLL", { locale: es })}
              className={[
                'flex h-full w-full flex-col gap-px overflow-hidden border-b border-r border-white/10 p-0.5 text-left transition hover:bg-white/[0.03]',
                isToday ? 'bg-accent/[0.04]' : '',
              ].join(' ')}
            >
              {dayTxs.map((t) => {
                const color = t.category?.color ?? (t.type === 'income' ? '#22c55e' : '#ef4444')
                const bg = color + '28'
                return (
                  <div
                    key={t.id}
                    className="w-full truncate rounded-[3px] px-0.5 py-px text-[8px] font-semibold leading-tight tabular-nums sm:text-[9px]"
                    style={{ backgroundColor: bg, color }}
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
