import { addMonths, differenceInCalendarMonths } from 'date-fns'
import { toCents, fromCents } from './forecast.js'

/**
 * Proyección de una meta de ahorro. Dinero en CÉNTIMOS enteros.
 *
 * Supuesto: se aporta `monthly` € cada mes y la primera aportación llega
 * dentro de un mes. Meses necesarios = ceil(pendiente / aportación).
 */
const MAX_MONTHS = 600 // 50 años: más allá no tiene sentido mostrar fecha

export function projectGoal({ target, contributed, monthly, today = new Date(), targetDate = null }) {
  const remainingC = Math.max(0, toCents(target) - toCents(contributed))
  const monthlyC = Math.max(0, toCents(monthly))
  const deadline = targetDate ? new Date(`${targetDate}T00:00:00`) : null

  if (remainingC === 0) return { status: 'done', remaining: 0 }

  // Aportación mensual necesaria para llegar a la fecha objetivo (si la hay).
  let requiredMonthly = null
  let deadlinePassed = false
  if (deadline) {
    const monthsToDeadline = differenceInCalendarMonths(deadline, today)
    if (monthsToDeadline < 1) deadlinePassed = true
    else requiredMonthly = fromCents(Math.ceil(remainingC / monthsToDeadline))
  }

  if (monthlyC === 0) {
    return { status: 'noContribution', remaining: fromCents(remainingC), requiredMonthly, deadlinePassed }
  }

  const months = Math.ceil(remainingC / monthlyC)
  if (months > MAX_MONTHS) {
    return { status: 'tooFar', remaining: fromCents(remainingC), requiredMonthly, deadlinePassed }
  }

  const reachDate = addMonths(today, months)
  const onTrack = deadline ? reachDate <= deadline : null

  return {
    status: 'ok',
    remaining: fromCents(remainingC),
    months,
    reachDate,
    requiredMonthly,
    deadlinePassed,
    onTrack,
  }
}

/**
 * Aportación mensual media de los últimos 90 días (3 meses), redondeada
 * al euro. Sirve como valor inicial del slider.
 */
export function averageMonthlyContribution(contributions = [], today = new Date()) {
  const to = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const from = to - 89 * 86400000
  let totalC = 0
  for (const c of contributions) {
    const [y, m, d] = String(c.contributed_on).split('-').map(Number)
    const t = Date.UTC(y, m - 1, d)
    if (t >= from && t <= to) totalC += toCents(c.amount)
  }
  return Math.round(totalC / 3 / 100)
}
