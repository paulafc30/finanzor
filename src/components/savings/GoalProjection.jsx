import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarCheck } from 'lucide-react'
import { projectGoal, averageMonthlyContribution } from '../../lib/goalProjection.js'
import { formatEuro, formatMonthLabel } from '../../lib/formatters.js'

const STEP = 5 // € por paso del slider

/**
 * "A X €/mes llegas a tu meta en <mes>". El slider simula otra aportación
 * mensual. Valor inicial: tu media real de los últimos 3 meses (o, si no
 * hay aportaciones, lo necesario para llegar a la fecha objetivo).
 */
export default function GoalProjection({ goal, contributions }) {
  const { t } = useTranslation('savings')
  const [override, setOverride] = useState(null)

  const today = new Date()
  const remaining = Math.max(0, goal.target_amount - goal.contributed)
  if (remaining <= 0) return null

  const sliderMax = Math.min(1000, Math.max(50, Math.ceil(remaining / STEP) * STEP))
  const clamp = (v) => Math.min(sliderMax, Math.max(STEP, Math.round(v / STEP) * STEP))

  const avg = averageMonthlyContribution(contributions, today)
  const baseline = projectGoal({ target: goal.target_amount, contributed: goal.contributed, monthly: STEP, today, targetDate: goal.target_date })
  const fallback = baseline.requiredMonthly ?? Math.ceil(remaining / 12)
  const monthly = override ?? clamp(avg > 0 ? avg : fallback)

  const p = projectGoal({
    target: goal.target_amount,
    contributed: goal.contributed,
    monthly,
    today,
    targetDate: goal.target_date,
  })

  return (
    <div className="rounded-xl bg-bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <CalendarCheck size={15} className="text-accent" />
        <h3 className="text-xs uppercase tracking-wide text-white/50">{t('projection.title')}</h3>
      </div>

      {p.status === 'ok' && (
        <p className="text-sm text-white">
          {t('projection.reach', { amount: formatEuro(monthly), date: formatMonthLabel(p.reachDate) })}
          <span className="text-white/50"> ({t('projection.months', { count: p.months })})</span>
        </p>
      )}
      {p.status === 'tooFar' && <p className="text-sm text-white">{t('projection.tooFar')}</p>}

      <input
        type="range"
        min={STEP}
        max={sliderMax}
        step={STEP}
        value={monthly}
        onChange={(e) => setOverride(Number(e.target.value))}
        aria-label={t('projection.sliderAria')}
        className="mt-3 w-full accent-accent"
      />
      <div className="flex justify-between text-[11px] text-white/40">
        <span>{formatEuro(STEP)}</span>
        <span>{t('projection.perMonth', { amount: formatEuro(monthly) })}</span>
        <span>{formatEuro(sliderMax)}</span>
      </div>

      {p.deadlinePassed && (
        <p className="mt-2 text-xs text-warning">{t('projection.deadlinePassed')}</p>
      )}
      {!p.deadlinePassed && p.onTrack === true && (
        <p className="mt-2 text-xs text-success">{t('projection.onTrack')}</p>
      )}
      {!p.deadlinePassed && p.onTrack === false && (
        <p className="mt-2 text-xs text-warning">
          {t('projection.offTrack', { required: formatEuro(p.requiredMonthly) })}
        </p>
      )}
    </div>
  )
}
