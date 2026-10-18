import { extractKeyword } from './categoryRules.js'
import { toCents, fromCents } from './forecast.js'

/**
 * Detección de suscripciones (cargos periódicos) y gastos hormiga a partir
 * del histórico. Funciones puras; el dinero se maneja en CÉNTIMOS enteros.
 */

const DAY_MS = 86400000
// 'YYYY-MM-DD' -> nº de día absoluto (UTC, sin líos de zona horaria)
const dayNumber = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}
const todayNumber = (today) =>
  Math.round(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / DAY_MS)

function median(sorted) {
  const n = sorted.length
  const mid = Math.floor(n / 2)
  return n % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function mostFrequent(values) {
  const counts = new Map()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  let best = null
  let bestCount = 0
  for (const [v, c] of counts) {
    if (c > bestCount) { best = v; bestCount = c }
  }
  return best
}

/** "NETFLIX.COM 1004" -> "NETFLIX.COM" (quita los trozos con números) */
function cleanName(description) {
  const trimmed = description.trim()
  const cleaned = trimmed.split(/\s+/).filter((tok) => !/\d/.test(tok)).join(' ')
  return (cleaned || trimmed).slice(0, 60)
}

const PERIODS = {
  monthly: { min: 25, max: 37, medMin: 27, medMax: 34, minOccurrences: 3, maxAgeDays: 45 },
  weekly: { min: 6, max: 8, medMin: 7, medMax: 7, minOccurrences: 4, maxAgeDays: 14 },
}

/**
 * Detecta cargos que se repiten con importe parecido a intervalos regulares.
 *
 * @param transactions  histórico con { id, type, amount, description,
 *                      occurred_on, recurring_id, category_id }
 * @param recurrings    recurrentes ya creados (para no proponer duplicados)
 * @returns lista ordenada por coste mensual descendente
 */
export function detectSubscriptions({ transactions = [], recurrings = [], today = new Date() }) {
  const now = todayNumber(today)
  const knownKeys = new Set(recurrings.map((r) => extractKeyword(r.name)).filter(Boolean))

  // Agrupar gastos sueltos (no generados por un recurrente) por comercio.
  const groups = new Map()
  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.recurring_id || !tx.description) continue
    if (/^ahorro:/i.test(tx.description)) continue // aportaciones a metas
    const key = extractKeyword(tx.description)
    if (!key || knownKeys.has(key)) continue
    if (dayNumber(tx.occurred_on) > now) continue // futuros: no son histórico
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(tx)
  }

  const found = []
  for (const [key, txs] of groups) {
    if (txs.length < 3) continue

    // Agrupamos alrededor del importe mediano: ±10 % o ±1 €, lo que sea mayor.
    const allCents = txs.map((t) => toCents(t.amount)).sort((a, b) => a - b)
    const medAll = median(allCents)
    const tol = Math.max(100, Math.round(medAll * 0.1))
    const stable = txs
      .filter((t) => Math.abs(toCents(t.amount) - medAll) <= tol)
      .sort((a, b) => (a.occurred_on < b.occurred_on ? -1 : a.occurred_on > b.occurred_on ? 1 : 0))
    if (stable.length < 3) continue

    const days = stable.map((t) => dayNumber(t.occurred_on))
    const gaps = []
    for (let i = 1; i < days.length; i++) gaps.push(days[i] - days[i - 1])
    const sortedGaps = [...gaps].sort((a, b) => a - b)
    const medGap = median(sortedGaps)

    let frequency = null
    for (const f of ['monthly', 'weekly']) {
      const p = PERIODS[f]
      if (stable.length < p.minOccurrences) continue
      const inRange = gaps.filter((g) => g >= p.min && g <= p.max).length
      if (inRange / gaps.length >= 0.75 && medGap >= p.medMin && medGap <= p.medMax) {
        frequency = f
        break
      }
    }
    if (!frequency) continue

    const lastDay = days[days.length - 1]
    if (now - lastDay > PERIODS[frequency].maxAgeDays) continue // ya no se paga

    const stableCents = stable.map((t) => toCents(t.amount)).sort((a, b) => a - b)
    const amountC = median(stableCents)
    const last = stable[stable.length - 1]
    const dom = stable.map((t) => Number(t.occurred_on.slice(8, 10))).sort((a, b) => a - b)
    const monthlyC = frequency === 'monthly' ? amountC : Math.round((amountC * 52) / 12)

    found.push({
      key,
      name: cleanName(last.description),
      amount: fromCents(amountC),
      frequency,
      // el recurrente mensual admite días 1..28 (igual que al materializar)
      day_of_month: frequency === 'monthly' ? Math.max(1, Math.min(28, median(dom))) : null,
      day_of_week: frequency === 'weekly' ? new Date(last.occurred_on + 'T00:00:00Z').getUTCDay() : null,
      occurrences: stable.length,
      lastDate: last.occurred_on,
      lastTransactionId: last.id ?? null,
      category_id: mostFrequent(stable.map((t) => t.category_id).filter(Boolean)),
      monthlyCost: fromCents(monthlyC),
    })
  }

  return found.sort((a, b) => b.monthlyCost - a.monthlyCost)
}

/**
 * Gastos hormiga: gastos pequeños (<= threshold) de los últimos 30 días
 * (hoy incluido). Excluye recurrentes y aportaciones a metas.
 */
export function sumPettySpending({ transactions = [], today = new Date(), threshold = 10 }) {
  const now = todayNumber(today)
  const from = now - 29
  const limitC = toCents(threshold)
  let totalC = 0
  let count = 0
  const byCat = new Map()

  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.recurring_id) continue
    if (/^ahorro:/i.test(tx.description ?? '')) continue
    const d = dayNumber(tx.occurred_on)
    if (d < from || d > now) continue
    const c = toCents(tx.amount)
    if (c <= 0 || c > limitC) continue
    totalC += c
    count += 1
    const name = tx.category?.name ?? null
    const prev = byCat.get(name) ?? { name, totalC: 0, count: 0 }
    prev.totalC += c
    prev.count += 1
    byCat.set(name, prev)
  }

  const top = [...byCat.values()]
    .sort((a, b) => b.totalC - a.totalC)
    .slice(0, 3)
    .map((x) => ({ name: x.name, total: fromCents(x.totalC), count: x.count }))

  return {
    total: fromCents(totalC),
    count,
    yearlyEstimate: fromCents(totalC * 12),
    top,
    threshold,
  }
}
