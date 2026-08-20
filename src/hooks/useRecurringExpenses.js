import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'

/**
 * Lista TODOS los recurrentes del usuario (gastos e ingresos fijos),
 * activos e inactivos. Devuelve `type` para que la UI pueda separarlos.
 *
 * Si se pasa `{ type }` filtra en BBDD. Sin filtro vienen los dos tipos
 * y se separan en cliente.
 */
export function useRecurringExpenses({ type = null } = {}) {
  const { user } = useSession()

  return useQuery({
    queryKey: ['recurring', user?.id, type ?? 'all'],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('recurring_expenses')
        .select(`
          id, name, amount, day_of_month, day_of_week, frequency, is_active, type, created_at,
          category:categories(id, name, color)
        `)
        .eq('user_id', user.id)
        .order('is_active', { ascending: false })
        .order('day_of_month', { ascending: true })
      if (type) q = q.eq('type', type)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateRecurring() {
  const { user } = useSession()
  const qc = useQueryClient()
  const { t } = useTranslation('recurring')

  return useMutation({
    mutationFn: async (input) => {
      const frequency = input.frequency === 'weekly' ? 'weekly' : 'monthly'
      const payload = {
        user_id: user.id,
        name: input.name?.trim(),
        amount: Number(input.amount),
        // Para ingresos la categoria es opcional (igual que en movimientos
        // sueltos: un ingreso puede ir "sin categoria"); para gastos es
        // obligatoria por coherencia con la UI de Movimientos.
        category_id: input.category_id || null,
        frequency,
        day_of_month: frequency === 'monthly' ? Number(input.day_of_month) : null,
        day_of_week: frequency === 'weekly' ? Number(input.day_of_week) : null,
        is_active: input.is_active ?? true,
        type: input.type === 'income' ? 'income' : 'expense',
      }
      if (!payload.name) throw new Error(t('errors.nameRequired'))
      if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
        throw new Error(t('errors.amountInvalid'))
      }
      if (frequency === 'monthly') {
        if (payload.day_of_month < 1 || payload.day_of_month > 28) {
          throw new Error(t('errors.dayInvalid'))
        }
      } else if (
        payload.day_of_week === null ||
        payload.day_of_week < 0 ||
        payload.day_of_week > 6 ||
        Number.isNaN(payload.day_of_week)
      ) {
        throw new Error(t('errors.weekdayInvalid'))
      }
      if (payload.type === 'expense' && !payload.category_id) {
        throw new Error(t('errors.categoryRequiredForExpense'))
      }

      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring', user?.id] })
    },
  })
}

export function useUpdateRecurring() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const cleaned = {}
      if (patch.name !== undefined) cleaned.name = patch.name.trim()
      if (patch.amount !== undefined) cleaned.amount = Number(patch.amount)
      if (patch.category_id !== undefined) cleaned.category_id = patch.category_id || null
      if (patch.is_active !== undefined) cleaned.is_active = !!patch.is_active
      if (patch.type !== undefined) cleaned.type = patch.type === 'income' ? 'income' : 'expense'
      // frequency, day_of_month y day_of_week viajan siempre juntos: al
      // cambiar de mensual a semanal (o viceversa) hay que limpiar el campo
      // que deja de aplicar, si no la constraint cruzada de la BD lo rechaza.
      if (patch.frequency !== undefined) {
        const frequency = patch.frequency === 'weekly' ? 'weekly' : 'monthly'
        cleaned.frequency = frequency
        cleaned.day_of_month = frequency === 'monthly' ? Number(patch.day_of_month) : null
        cleaned.day_of_week = frequency === 'weekly' ? Number(patch.day_of_week) : null
      }

      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(cleaned)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring', user?.id] })
    },
  })
}

/**
 * Cambia is_active. No materializa nada por si mismo: si se desactiva, los
 * movimientos ya generados se mantienen.
 */
export function useToggleRecurring() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      return { id, is_active }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring', user?.id] })
    },
  })
}

/**
 * Elimina un recurrente (gasto o ingreso fijo).
 * Antes de borrar el registro, elimina también los movimientos futuros
 * (occurred_on > hoy) generados por él. Los movimientos pasados se mantienen
 * para no falsear el histórico.
 */
export function useDeleteRecurring() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const today = format(new Date(), 'yyyy-MM-dd')

      // 1. Borrar movimientos futuros generados por este recurrente
      const { error: e1 } = await supabase
        .from('transactions')
        .delete()
        .eq('recurring_id', id)
        .eq('user_id', user.id)
        .gt('occurred_on', today)
      if (e1) throw e1

      // 2. Borrar el recurrente
      const { error: e2 } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (e2) throw e2

      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring', user?.id] })
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
    },
  })
}

/**
 * Materializa los recurrentes activos en el MES CALENDARIO ACTUAL.
 *
 * REGLAS COMUNES:
 *  - Solo se generan movimientos en el mes en curso (mes real de hoy).
 *    Da igual que el usuario navegue a mayo, abril o agosto: nunca se
 *    crearán recurrentes en esos meses al pasar por ellos.
 *  - Solo materializa los que están `is_active = true`. Si lo desactivas,
 *    deja de generarse en futuros meses; los pasados se mantienen.
 *  - Solo materializa ocurrencias desde el `created_at` del recurrente en
 *    adelante (uno creado el 15 de junio no produce nada antes de esa fecha).
 *
 * MENSUALES (frequency='monthly'):
 *  - Una única ocurrencia el `day_of_month` del mes en curso (idempotente:
 *    dedupe por `recurring_id`, sin mirar la fecha exacta, para tolerar que
 *    el usuario cambie el día después de haberse generado ya ese mes).
 *
 * SEMANALES (frequency='weekly'):
 *  - Una ocurrencia por cada `day_of_week` que haya caído este mes hasta
 *    hoy (normalmente ~4-5 al mes). Dedupe por `recurring_id` + fecha
 *    exacta, porque aquí sí puede haber varias filas legítimas del mismo
 *    recurrente en el mismo mes.
 */
export function useMaterializeRecurring() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Mes actual real (no el del switcher). Esto es clave: el usuario
      // puede estar viendo mayo, pero solo se materializa en junio (o el
      // mes en el que esté).
      const now = new Date()
      const year = now.getFullYear()
      const monthIdx = now.getMonth() // 0-11
      const todayDay = now.getDate() // 1-31
      const monthStart = format(new Date(year, monthIdx, 1), 'yyyy-MM-dd')
      const monthEnd = format(new Date(year, monthIdx + 1, 1), 'yyyy-MM-dd')
      const todayStr = format(now, 'yyyy-MM-dd')

      // 1. Recurrentes activos (de ambos tipos). Incluimos created_at
      //    para saltar los creados despues del mes en curso.
      const { data: recurrings, error: e1 } = await supabase
        .from('recurring_expenses')
        .select('id, name, amount, category_id, day_of_month, day_of_week, frequency, type, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
      if (e1) throw e1
      if (!recurrings?.length) return { inserted: 0 }

      // 2. Movimientos del mes actual que ya provienen de recurrentes
      const { data: existing, error: e2 } = await supabase
        .from('transactions')
        .select('recurring_id, occurred_on')
        .eq('user_id', user.id)
        .gte('occurred_on', monthStart)
        .lt('occurred_on', monthEnd)
        .not('recurring_id', 'is', null)
      if (e2) throw e2

      // Para mensuales: basta con saber SI ya existe alguna fila este mes.
      const materializedIds = new Set((existing ?? []).map((t) => t.recurring_id))
      // Para semanales: hace falta la fecha exacta, porque puede haber
      // varias filas legítimas del mismo recurrente en el mismo mes.
      const materializedPairs = new Set(
        (existing ?? []).map((t) => `${t.recurring_id}|${t.occurred_on}`),
      )

      const createdDateStr = (r) =>
        r.created_at ? format(new Date(r.created_at), 'yyyy-MM-dd') : '0000-01-01'

      const toInsert = []

      for (const r of recurrings) {
        const isWeekly = r.frequency === 'weekly'
        const createdOn = createdDateStr(r)

        if (!isWeekly) {
          // ── Mensual ──
          if (materializedIds.has(r.id)) continue
          const day = Math.max(1, Math.min(28, r.day_of_month))
          if (day > todayDay) continue
          const occurred = format(new Date(year, monthIdx, day), 'yyyy-MM-dd')
          if (occurred < createdOn) continue
          toInsert.push({
            user_id: user.id,
            type: r.type === 'income' ? 'income' : 'expense',
            amount: r.amount,
            description: r.name,
            category_id: r.category_id,
            occurred_on: occurred,
            recurring_id: r.id,
          })
          continue
        }

        // ── Semanal ── genera todas las fechas de este mes que caigan en
        // `day_of_week` (0=domingo..6=sábado, como Date.getDay()), desde el
        // primer día del mes hasta hoy, saltando las ya materializadas y
        // las anteriores a la creación del recurrente.
        const dow = r.day_of_week
        if (dow == null) continue
        const first = new Date(year, monthIdx, 1)
        const offset = (dow - first.getDay() + 7) % 7
        let d = new Date(year, monthIdx, 1 + offset)
        while (d.getMonth() === monthIdx) {
          const occurred = format(d, 'yyyy-MM-dd')
          if (occurred > todayStr) break
          if (occurred >= createdOn && !materializedPairs.has(`${r.id}|${occurred}`)) {
            toInsert.push({
              user_id: user.id,
              type: r.type === 'income' ? 'income' : 'expense',
              amount: r.amount,
              description: r.name,
              category_id: r.category_id,
              occurred_on: occurred,
              recurring_id: r.id,
            })
          }
          d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
        }
      }

      if (toInsert.length === 0) return { inserted: 0 }

      const { error: e3 } = await supabase.from('transactions').insert(toInsert)
      if (e3) throw e3

      return { inserted: toInsert.length }
    },
    onSuccess: (res) => {
      if (res?.inserted > 0) {
        // Refrescamos todo lo que depende de transacciones: lista, KPIs del
        // mes, saldo acumulado, comparativa, presupuestos y ahorro.
        qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
        qc.invalidateQueries({ queryKey: ['monthly-summary', user?.id] })
        qc.invalidateQueries({ queryKey: ['accumulated-balance', user?.id] })
        qc.invalidateQueries({ queryKey: ['previous-month-summary', user?.id] })
        qc.invalidateQueries({ queryKey: ['savings-from-expenses', user?.id] })
        qc.invalidateQueries({ queryKey: ['budgets', user?.id] })
        qc.invalidateQueries({ queryKey: ['expense-comparison', user?.id] })
      }
    },
  })
}
