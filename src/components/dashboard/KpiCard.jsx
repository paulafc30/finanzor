import { ArrowUp, ArrowDown } from 'lucide-react'
import { formatEuro } from '../../lib/formatters.js'

/**
 * Card de KPI con estética tipo Hercules:
 * - Fondo tintado del color del KPI (más visible que /10 para que no quede negro
 *   sobre fondo dark — usamos /15 base + ring para definir el borde)
 * - Icono dentro de un círculo sólido del color
 * - Etiqueta arriba, valor en grande abajo
 * - Flecha decorativa ↗ arriba a la derecha
 * - Delta opcional ±% o ±€ vs mes anterior
 *
 * No tiene hover (no son clicables). Si en el futuro se hacen clicables,
 * usar hover:brightness-110 para no oscurecer.
 */
const tonePalette = {
  success: {
    cardBg: 'bg-success/15',
    cardRing: 'ring-success/25',
    iconBg: 'bg-success',
    text: 'text-success',
    arrow: 'text-success/60',
    label: 'text-success/80',
  },
  danger: {
    cardBg: 'bg-danger/15',
    cardRing: 'ring-danger/25',
    iconBg: 'bg-danger',
    text: 'text-danger',
    arrow: 'text-danger/60',
    label: 'text-danger/80',
  },
  info: {
    cardBg: 'bg-info/15',
    cardRing: 'ring-info/25',
    iconBg: 'bg-info',
    text: 'text-info',
    arrow: 'text-info/60',
    label: 'text-info/80',
  },
  accent: {
    cardBg: 'bg-accent/15',
    cardRing: 'ring-accent/25',
    iconBg: 'bg-accent',
    text: 'text-accent',
    arrow: 'text-accent/60',
    label: 'text-accent/80',
  },
}

export default function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'accent',
  loading = false,
  delta,
  deltaPositiveIsGood = true,
  deltaIsAbsolute = false,
  deltaLabel = null,
  onClick = null,
  className = '',
}) {
  const palette = tonePalette[tone] ?? tonePalette.accent

  let deltaNode = null
  if (delta !== null && delta !== undefined && !loading) {
    // Si el delta es un objeto { fallbackToAbs, value }, lo tratamos como absoluto
    const isFallback = typeof delta === 'object' && delta?.fallbackToAbs
    const numeric = isFallback ? delta.value : delta
    const useAbsolute = deltaIsAbsolute || isFallback

    const isPositive = numeric > 0
    const isNeutral = Math.abs(numeric) < 0.5
    let colorClass = 'text-white/50'
    if (!isNeutral) {
      const good = deltaPositiveIsGood ? isPositive : !isPositive
      colorClass = good ? 'text-success' : 'text-danger'
    }
    const ArrowIcon = isPositive ? ArrowUp : ArrowDown
    const text = useAbsolute
      ? `${isPositive ? '+' : ''}${formatEuro(numeric)}`
      : `${isPositive ? '+' : ''}${numeric.toFixed(0)}%`
    deltaNode = (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${colorClass}`}>
        {!isNeutral && <ArrowIcon size={11} />}
        {text}
        {deltaLabel && <span className="ml-0.5 text-white/40">{deltaLabel}</span>}
      </span>
    )
  }

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick ?? undefined}
      className={[
        'relative overflow-hidden rounded-2xl p-4 ring-1 text-left',
        palette.cardBg,
        palette.cardRing,
        onClick ? 'cursor-pointer transition-opacity hover:opacity-80 active:opacity-60' : '',
        className,
      ].join(' ')}
    >
      <div
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full ${palette.iconBg} shadow-sm`}
      >
        <Icon size={18} className="text-white" />
      </div>

      <p className={`text-xs font-medium ${palette.label}`}>{label}</p>
      <p
        className={[
          'mt-0.5 truncate text-lg font-bold leading-tight tabular-nums sm:text-xl',
          palette.text,
          loading ? 'opacity-40' : '',
        ].join(' ')}
      >
        {loading ? '…' : value}
      </p>

      {deltaNode && <div className="mt-1.5">{deltaNode}</div>}
    </Wrapper>
  )
}
