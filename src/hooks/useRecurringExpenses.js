import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'

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
          id, name, amount, day_of_month, is_active, type, created_at,
          category:categories(id, name, color)
        `)
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

  return useMutation({
    mutationFn: async (input) => {
      const payload = {
        user_id: user.id,
        name: input.name?.trim(),
        amount: Number(input.amount),
        // Para ingresos la categoria es opcional (igual que en movimientos
        // sueltos: un ingreso puede ir "sin categoria"); para gastos es
        // obligatoria por coherencia con la UI de Movimientos.
        category_id: input.category_id || null,
        day_of_month: Number(input.day_of_month),
        is_active: input.is_active ?? true,
        type: input.type === 'income' ? 'income' : 'expense',
      }
      if (!payload.name) throw new Error('El nombre es obligatorio')
      if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
        throw new Error('Importe inválido')
      }
      if (payload.day_of_month < 1 || payload.day_of_month > 28) {
        throw new Error('El día debe estar entre 1 y 28')
      }
      if (payload.type === 'expense' && !payload.category_id) {
        throw new Error('Categoría obligatoria en gastos fijos')
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
      if (patch.day_of_month !== undefined) cleaned.day_of_month = Number(patch.day_of_month)
      if (patch.is_active !== undefined) cleaned.is_active = !!patch.is_active
      if (patch.type !== undefined) cleaned.type = patch.type === 'income' ? 'income' : 'expense'

      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(cleaned)
        .eq('id', id)
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
        .gt('occurred_on', today)
      if (e1) throw e1

      // 2. Borrar el recurrente
      const { error: e2 } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
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
 * Materializa los recurrentes activos para el mes seleccionado.
 *
 * Por cada recurrente activo cuyo movimiento aún no exista, inserta uno
 * con su `type` propio (expense o income). Idempotente.
 */
export function useMaterializeRecurring() {
  const { user } = useSession()
  const { month, rangeStart, rangeEnd } = useMonth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // 1. Recurrentes activos (de ambos tipos)
      const { data: recurrings, error: e1 } = await supabase
        .from('recurring_expenses')
        .select('id, name, amount, category_id, day_of_month, type')
        .eq('is_active', true)
      if (e1) throw e1
      if (!recurrings?.length) return { inserted: 0 }

      // 2. Movimientos del mes que ya provienen de recurrentes
      const { data: existing, error: e2 } = await supabase
        .from('transactions')
        .select('recurring_id')
        .gte('occurred_on', rangeStart)
        .lt('occurred_on', rangeEnd)
        .not('recurring_id', 'is', null)
      if (e2) throw e2

      const alreadyMaterialized = new Set(
        (existing ?? []).map((t) => t.recurring_id),
      )

      // 3. Construir las filas que faltan
      const year = month.getFullYear()
      const monthIdx = month.getMonth() // 0-11

      const toInsert = recurrings
        .filter((r) => !alreadyMaterialized.has(r.id))
        .map((r) => {
          const day = Math.max(1, Math.min(28, r.day_of_month))
          const occurred = format(new Date(year, monthIdx, day), 'yyyy-MM-dd')
          return {
            user_id: user.id,
            type: r.type === 'income' ? 'income' : 'expense',
            amount: r.amount,
            description: r.name,
            category_id: r.category_id,
            occurred_on: occurred,
            recurring_id: r.id,
          }
        })

      if (toInsert.length === 0) return { inserted: 0 }

      const { error: e3 } = await supabase.from('transactions').insert(toInsert)
      if (e3) throw e3

      return { inserted: toInsert.length }
    },
    onSuccess: (res) => {
      if (res?.inserted > 0) {
        qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      }
    },
  })
}
