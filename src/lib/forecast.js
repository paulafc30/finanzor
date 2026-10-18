import { format } from 'date-fns'

/**
 * Previsión del mes en curso. Funciones puras (sin React ni Supabase) para
 * poder verificarlas con casos de prueba.
 *
 * TODO el dinero se calcula en CÉNTIMOS enteros para evitar errores de
 * coma flotante (0.1 + 0.2 !== 0.3). Solo se convierte a euros al final.
 *
 * Reglas:
 * - "Hoy" cuenta como día transcurrido y como día restante (nunca hay
 *   división por cero: daysLeft >= 1).
 * - Pendiente = movimientos con fecha futura ya registrados + recurrentes
 *   que aún no se han materializado este mes (mismas reglas que
 *   `useMaterializeRecurring`).
 * - Gasto diario disponible: conservador. Resta los gastos pendientes pero
 *   NO suma ingresos pendientes (hasta que no llegan, no se pueden gastar).
 * - Previsión de fin de mes: realista. Suma ingresos pendientes y resta
 *   gastos pendientes y el ritmo de gasto variable (gastos que no vienen
 *   de recurrentes) por los días que quedan.
 */

export const toCents = (euros) => Math.round(Number(euros || 0) * 100)
export const fromCents = (cents) => cents / 100

const ymd = (d) => format(d, 'yyyy-MM-dd')

/**
 * Importes pendientes (en céntimos) del mes de `today`, después de hoy.
 */
export function getPendingAmounts({ transactions = [], recurrings = [], today }) {
  const year = today.getFullYear()
  const monthIdx = today.getMonth()
  const todayDay = today.getDate()
  const todayStr = ymd(today)

  let futureIncome = 0
  let futureExpense = 0
  const materializedIds = new Set()
  const materializedPairs = new Set()

  for (const tx of transactions) {
    if (tx.recurring_id) {
      materializedIds.add(tx.recurring_id)
      materializedPairs.add(`${tx.recurring_id}|${tx.occurred_on}`)
    }
    if (tx.occurred_on > todayStr) {
      if (tx.type === 'income') futureIncome += toCents(tx.amount)
      else futureExpense += toCents(tx.amount)
    }
  }

  let recurringIncome = 0
  let recurringExpense = 0

  for (const r of recurrings) {
    if (!r.is_active) continue
    const cents = toCents(r.amount)
    const createdOn = r.created_at ? ymd(new Date(r.created_at)) : '0000-01-01'
    const isIncome = r.type === 'income'
    let occurrences = 0

    if (r.frequency === 'weekly') {
      const dow = r.day_of_week
      if (dow == null) continue
      const first = new Date(year, monthIdx, 1)
      const offset = (dow - first.getDay() + 7) % 7
      let d = new Date(year, monthIdx, 1 + offset)
      while (d.getMonth() === monthIdx) {
        const occurred = ymd(d)
        if (
          occurred > todayStr &&
          occurred >= createdOn &&
          !materializedPairs.has(`${r.id}|${occurred}`)
        ) {
          occurrences += 1
        }
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
      }
    } else {
      // Mensual: el día se limita a 1..28 igual que al materializar.
      const day = Math.max(1, Math.min(28, r.day_of_month))
      const occurred = ymd(new Date(year, monthIdx, day))
      if (day > todayDay && occurred >= createdOn && !materializedIds.has(r.id)) {
        occurrences = 1
      }
    }

    if (isIncome) recurringIncome += cents * occurrences
    else recurringExpense += cents * occurrences
  }

  return {
    pendingIncome: futureIncome + recurringIncome,
    pendingExpense: futureExpense + recurringExpense,
    pendingRecurringExpense: recurringExpense,
  }
}

/**
 * Calcula el gasto diario disponible y la previsión de fin de mes.
 *
 * @param balance        Saldo a hoy en euros (carry-forward incluido).
 * @param transactions   Movimientos del mes actual (todos, también futuros).
 * @param recurrings     Plantillas recurrentes del usuario.
 * @param today          Date de hoy (inyectable para tests).
 */
export function computeOutlook({ balance, transactions = [], recurrings = [], today = new Date() }) {
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysElapsed = today.getDate()
  const daysLeft = daysInMonth - daysElapsed + 1 // incluye hoy, siempre >= 1
  const daysAfterToday = daysInMonth - daysElapsed
  const todayStr = ymd(today)

  const balanceC = toCents(balance)
  const { pendingIncome, pendingExpense } = getPendingAmounts({ transactions, recurrings, today })

  // ── Gasto diario disponible (conservador) ──
  const availableC = balanceC - pendingExpense
  const dailyAllowanceC = availableC > 0 ? Math.floor(availableC / daysLeft) : 0

  // ── Previsión de fin de mes ──
  // Ritmo variable: gastos hasta hoy que NO vienen de un recurrente.
  let variableSpentC = 0
  for (const tx of transactions) {
    if (tx.type === 'expense' && !tx.recurring_id && tx.occurred_on <= todayStr) {
      variableSpentC += toCents(tx.amount)
    }
  }
  // Con menos de 3 días de datos el ritmo no es fiable.
  const hasEnoughData = daysElapsed >= 3
  const projectedVariableC = hasEnoughData
    ? Math.round((variableSpentC / daysElapsed) * daysAfterToday)
    : null
  const projectedEndC =
    projectedVariableC === null
      ? null
      : balanceC + pendingIncome - pendingExpense - projectedVariableC

  return {
    daysLeft,
    available: fromCents(availableC),
    dailyAllowance: fromCents(dailyAllowanceC),
    isOverspent: availableC < 0,
    pendingExpense: fromCents(pendingExpense),
    pendingIncome: fromCents(pendingIncome),
    projectedEnd: projectedEndC === null ? null : fromCents(projectedEndC),
    projectedVariable: projectedVariableC === null ? null : fromCents(projectedVariableC),
  }
}
