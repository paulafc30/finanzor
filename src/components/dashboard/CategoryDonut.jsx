import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTransactions } from '../../hooks/useTransactions.js'
import { useMonth } from '../../hooks/useMonth.jsx'
import { formatEuro } from '../../lib/formatters.js'
import { useTheme } from '../../context/ThemeContext.jsx'

/**
 * Donut de gastos del mes agrupados por categoría.
 * Solo cuenta transacciones de tipo 'expense'.
 * Usa el color asignado a cada categoría.
 */
export default function CategoryDonut() {
  const { t } = useTranslation('dashboard')
  const { data: transactions = [] } = useTransactions()
  const { isYearView } = useMonth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const data = useMemo(() => {
    const map = new Map()
    for (const tx of transactions) {
      if (tx.type !== 'expense') continue
      const key = tx.category?.id ?? '__none__'
      const name = tx.category?.name ?? t('donut.noCategory')
      const color = tx.category?.color ?? '#94a3b8'
      const cur = map.get(key) ?? { name, color, value: 0 }
      cur.value += Number(tx.amount)
      map.set(key, cur)
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value)
  }, [transactions, t])

  const total = data.reduce((acc, d) => acc + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-bg-elevated ring-1 ring-white/5">
        <p className="text-sm text-white/50">
          {isYearView ? t('donut.noExpensesYear') : t('donut.noExpensesMonth')}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <PieIcon size={16} className="text-info" />
        {t('donut.title')}
      </h3>

      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={1}
              stroke="none"
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)' }}
              contentStyle={{
                backgroundColor: isDark ? '#1c2030' : '#ffffff',
                border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(15,23,42,0.1)',
                borderRadius: 8,
                color: isDark ? 'white' : 'rgb(15,23,42)',
                fontSize: 12,
                padding: '6px 10px',
              }}
              itemStyle={{ color: isDark ? 'white' : 'rgb(15,23,42)' }}
              labelStyle={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.5)' }}
              formatter={(value, name) => [formatEuro(value), name]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Total centrado */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wide text-white/40">
            {t('donut.total')}
          </span>
          <span className="text-base font-semibold text-white">
            {formatEuro(total)}
          </span>
        </div>
      </div>

      {/* Leyenda */}
      <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0
          return (
            <li key={d.name} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="truncate text-white/80">{d.name}</span>
              <span className="ml-auto shrink-0 text-white/40">
                {pct.toFixed(0)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
