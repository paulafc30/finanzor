import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Coffee } from 'lucide-react'
import { useTransactionHistory } from '../../hooks/useTransactionHistory.js'
import { sumPettySpending } from '../../lib/subscriptions.js'
import { formatEuro } from '../../lib/formatters.js'
import InfoHint from '../ui/InfoHint.jsx'

const THRESHOLD = 10 // € — un gasto "hormiga" es de este importe o menos

/** Gastos pequeños de los últimos 30 días y lo que suponen al año. */
export default function PettySpendingCard() {
  const { t } = useTranslation('transactions')
  const { data: history = [] } = useTransactionHistory()

  const petty = useMemo(
    () => sumPettySpending({ transactions: history, today: new Date(), threshold: THRESHOLD }),
    [history],
  )

  if (petty.count === 0) return null

  return (
    <div className="rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning">
          <Coffee size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{t('insights.petty.title')}</h2>
          <p className="text-xs text-white/50">
            {t('insights.petty.subtitle', { count: petty.count, max: formatEuro(THRESHOLD) })}
          </p>
        </div>
        <p className="text-lg font-bold tabular-nums">{formatEuro(petty.total)}</p>
      </div>

      <p className="mt-2 text-xs text-white/60">
        {t('insights.petty.yearly', { amount: formatEuro(petty.yearlyEstimate) })}
      </p>

      {petty.top.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {petty.top.map((c) => (
            <li
              key={c.name ?? 'none'}
              className="rounded-md bg-bg-card px-2 py-1 text-[11px] text-white/70"
            >
              {c.name ?? t('insights.petty.noCategory')} · {formatEuro(c.total)}
            </li>
          ))}
        </ul>
      )}

      <InfoHint className="mt-3">{t('insights.petty.info')}</InfoHint>
    </div>
  )
}
