import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Repeat, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import InfoHint from '../ui/InfoHint.jsx'
import { useTransactionHistory } from '../../hooks/useTransactionHistory.js'
import { useRecurringExpenses } from '../../hooks/useRecurringExpenses.js'
import { useCategories } from '../../hooks/useCategories.js'
import { useAdoptSubscription } from '../../hooks/useAdoptSubscription.js'
import { detectSubscriptions } from '../../lib/subscriptions.js'
import { suggestCategoryByDescription } from '../../lib/categoryRules.js'
import { toCents, fromCents } from '../../lib/forecast.js'
import { formatEuro } from '../../lib/formatters.js'

const STORAGE_KEY = 'finanzor.dismissedSubscriptions'

function loadDismissed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

/**
 * Cargos periódicos detectados en el histórico (Netflix, gimnasio…) que
 * todavía no son un recurrente. Un toque los convierte en recurrente.
 * No pinta nada si no hay ninguna.
 */
export default function SubscriptionsCard() {
  const { t } = useTranslation('transactions')
  const { data: history = [] } = useTransactionHistory()
  const { data: recurrings = [] } = useRecurringExpenses()
  const { data: categories = [] } = useCategories()
  const adopt = useAdoptSubscription()
  const [dismissed, setDismissed] = useState(loadDismissed)
  const [error, setError] = useState(null)
  const [busyKey, setBusyKey] = useState(null)

  const subs = useMemo(
    () =>
      detectSubscriptions({ transactions: history, recurrings, today: new Date() }).filter(
        (s) => !dismissed.has(s.key),
      ),
    [history, recurrings, dismissed],
  )

  if (subs.length === 0) return null

  const totalMonthly = fromCents(subs.reduce((acc, s) => acc + toCents(s.monthlyCost), 0))

  function resolveCategory(sub) {
    if (sub.category_id && categories.some((c) => c.id === sub.category_id)) return sub.category_id
    const byName = (name) => categories.find((c) => c.name === name)?.id
    return (
      byName(suggestCategoryByDescription(sub.name)) ?? byName('Otros') ?? categories[0]?.id ?? null
    )
  }

  async function handleAdopt(sub) {
    setError(null)
    setBusyKey(sub.key)
    try {
      await adopt.mutateAsync({ sub, category_id: resolveCategory(sub) })
    } catch (err) {
      setError(err.message ?? t('insights.subscriptions.error'))
    } finally {
      setBusyKey(null)
    }
  }

  function handleDismiss(sub) {
    const next = new Set(dismissed).add(sub.key)
    setDismissed(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
    } catch {
      /* sin almacenamiento: se oculta solo en esta sesión */
    }
  }

  return (
    <div className="rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info">
          <Repeat size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{t('insights.subscriptions.title')}</h2>
          <p className="text-xs text-white/50">
            {t('insights.subscriptions.summary', { count: subs.length, total: formatEuro(totalMonthly) })}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {subs.map((s) => (
          <li key={s.key} className="rounded-lg bg-bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-white/50">
                  {formatEuro(s.amount)} ·{' '}
                  {s.frequency === 'weekly'
                    ? t('insights.subscriptions.weekly')
                    : t('insights.subscriptions.monthlyDay', { day: s.day_of_month })}{' '}
                  · {t('insights.subscriptions.charges', { count: s.occurrences })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDismiss(s)}
                aria-label={t('insights.subscriptions.dismiss')}
                className="shrink-0 rounded-md p-1 text-white/30 hover:bg-white/5 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <Button
              size="sm"
              className="mt-2 w-full"
              onClick={() => handleAdopt(s)}
              disabled={adopt.isPending}
            >
              {busyKey === s.key
                ? t('insights.subscriptions.creating')
                : t('insights.subscriptions.create')}
            </Button>
          </li>
        ))}
      </ul>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <InfoHint className="mt-3">{t('insights.subscriptions.info')}</InfoHint>
    </div>
  )
}
