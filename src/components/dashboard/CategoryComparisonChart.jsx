import { BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useExpenseComparison } from '../../hooks/useExpenseComparison.js'
import { useTheme } from '../../context/ThemeContext.jsx'
import { formatEuro } from '../../lib/formatters.js'

/**
 * Grafica de barras agrupadas que compara los gastos por categoria del
 * periodo actual con un periodo de referencia.
 *
 * - Vista mes: actual vs media de los 3 meses anteriores.
 * - Vista anio: actual vs anio anterior completo.
 *
 * Solo se monta en desktop (`lg+`): la grafica con dos barras por categoria
 * en pantallas estrechas queda apretada y poco legible. En movil ya hay
 * `CategoryDonut` para ver la composicion del mes.
 */
export default function CategoryComparisonChart() {
  const { data, isLoading } = useExpenseComparison()
  const ctx = useTheme()
  const isDark = ctx?.theme !== 'light'

  // No renderizamos nada hasta lg+; el padre podria seguir mostrando otras
  // tarjetas en moviles. Usamos `hidden lg:block` para ahorrar la consulta
  // en moviles, aunque la query se hace igual; Recharts no se monta.
  if (isLoading) {
    return (
      <div className="hidden lg:block rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    )
  }

  const items = data?.items ?? []
  if (items.length === 0) {
    return (
      <div className="hidden lg:block rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
        <Header subtitle={data?.previousLabel} />
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-white/50">
            Aún no hay datos suficientes para comparar.
          </p>
        </div>
      </div>
    )
  }

  // Convertimos a formato Recharts. Mantenemos el color de la categoria para
  // la barra "actual"; la barra de referencia es gris para evitar competir
  // visualmente con la actual.
  const chartData = items.map((it) => ({
    name: it.name,
    color: it.color,
    actual: round2(it.current),
    referencia: round2(it.previous),
    diff: round2(it.diff),
  }))

  const axisColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.55)'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
  const tooltipBg = isDark ? '#1c2030' : '#ffffff'
  const tooltipText = isDark ? '#ffffff' : '#0f172a'
  const tooltipBorder = isDark
    ? '1px solid rgba(255,255,255,0.15)'
    : '1px solid rgba(15,23,42,0.12)'
  const refBarColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.2)'

  return (
    <div className="hidden lg:block rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      <Header subtitle={data.previousLabel} />

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
            barCategoryGap="22%"
            barGap={4}
          >
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: axisColor, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              interval={0}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              tickFormatter={(v) => formatShortEuro(v)}
              width={56}
            />
            <Tooltip
              cursor={{ fill: gridColor }}
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder,
                borderRadius: 8,
                color: tooltipText,
                fontSize: 12,
                padding: '8px 10px',
              }}
              itemStyle={{ color: tooltipText }}
              labelStyle={{ color: tooltipText, fontWeight: 600 }}
              formatter={(value, name) => [
                formatEuro(value),
                name === 'actual' ? data.currentLabel : data.previousLabel,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: axisColor }}
              formatter={(value) =>
                value === 'actual' ? data.currentLabel : data.previousLabel
              }
            />
            {/* Barra "actual" coloreada por categoria */}
            <Bar dataKey="actual" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
            {/* Barra "referencia" en gris para no competir */}
            <Bar
              dataKey="referencia"
              radius={[4, 4, 0, 0]}
              fill={refBarColor}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Header({ subtitle }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
      <BarChart3 size={16} className="text-info" />
      Comparativa por categoría
      {subtitle && (
        <span className="ml-auto text-[11px] font-normal text-white/50">
          vs. {subtitle}
        </span>
      )}
    </h3>
  )
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

function formatShortEuro(v) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k€`
  return `${v}€`
}
