import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'
import { useCategories } from './useCategories.js'
import { useTransactions } from './useTransactions.js'

/**
 * Trae los presupuestos crudos del mes seleccionado.
 * Cada fila es { id, category_id, month, amount }.
 */
export function useBudgets() {
  const { user } = useSession()
  const { rangeStart } = useMonth() // primer día del mes seleccionado

  return useQuery({
    queryKey: ['budgets', user?.id, rangeStart],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('id, category_id, month, amount')
        .eq('month', rangeStart)

      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Combina categorías + presupuestos del mes + gastos del mes
 * y devuelve un array por categoría con:
 *   { category, budgetAmount, spentAmount, percentage, status }
 *
 * status: 'ok' (<70%) | 'warn' (70-90%) | 'over' (>=90%)
 *
 * IMPORTANTE: spent se calcula sobre transactions filtradas por occurred_on
 * (ya viene así de useTransactions).
 */
export function useBudgetSummary() {
  const cats = useCategories()
  const buds = useBudgets()
  const txs = useTransactions()

  const isLoading = cats.isLoading || buds.isLoading || txs.isLoading
  const error = cats.error || buds.error || txs.error

  const rows = useMemo(() => {
    const categories = cats.data ?? []
    const budgets = buds.data ?? []
    const transactions = txs.data ?? []

    // gasto por category_id
    const spentByCat = new Map()
    for (const t of transactions) {
      if (t.type !== 'expense') continue
      const id = t.category?.id ?? null
      if (!id) continue
      spentByCat.set(id, (spentByCat.get(id) ?? 0) + Number(t.amount))
    }

    // budget por category_id
    const budgetByCat = new Map()
    for (const b of budgets) {
      budgetByCat.set(b.category_id, Number(b.amount))
    }

    return categories.map((c) => {
      const budgetAmount = budgetByCat.get(c.id) ?? 0
      const spentAmount = spentByCat.get(c.id) ?? 0
      const percentage =
        budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0
      let status = 'ok'
      if (budgetAmount > 0) {
        if (percentage >= 90) status = 'over'
        else if (percentage >= 70) status = 'warn'
      }
      return { category: c, budgetAmount, spentAmount, percentage, status }
    })
  }, [cats.data, buds.data, txs.data])

  return { rows, isLoading, error }
}

/**
 * Upsert de un presupuesto: si existe (user_id, category_id, month) lo
 * actualiza; si no, lo crea. Si amount es 0, lo borra.
 */
export function useUpsertBudget() {
  const { user } = useSession()
  const { rangeStart } = useMonth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ category_id, amount }) => {
      const value = Number(amount)
      if (!Number.isFinite(value) || value < 0) {
        throw new Error('Importe inválido')
      }

      // Si el importe es 0, eliminamos el presupuesto
      if (value === 0) {
        const { error } = await supabase
          .from('budgets')
          .delete()
          .eq('user_id', user.id)
          .eq('category_id', category_id)
          .eq('month', rangeStart)
        if (error) throw error
        return null
      }

      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          {
            user_id: user.id,
            category_id,
            month: rangeStart,
            amount: value,
          },
          { onConflict: 'user_id,category_id,month' },
        )
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', user?.id, rangeStart] })
    },
  })
}

/**
 * Copia los presupuestos del mes anterior al mes seleccionado.
 * No sobreescribe los que ya existan en el mes actual.
 */
export function useCopyBudgetsFromPreviousMonth() {
  const { user } = useSession()
  const { month, rangeStart } = useMonth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // calcular primer día del mes anterior
      const prev = new Date(month.getFullYear(), month.getMonth() - 1, 1)
      const prevMonth = format(prev, 'yyyy-MM-dd')

      const { data: prevBudgets, error: e1 } = await supabase
        .from('budgets')
        .select('category_id, amount')
        .eq('month', prevMonth)
      if (e1) throw e1

      if (!prevBudgets || prevBudgets.length === 0) {
        return { inserted: 0 }
      }

      const rows = prevBudgets.map((b) => ({
        user_id: user.id,
        category_id: b.category_id,
        month: rangeStart,
        amount: b.amount,
      }))

      // upsert masivo, ignorando los que ya existen este mes
      const { error: e2 } = await supabase
        .from('budgets')
        .upsert(rows, { onConflict: 'user_id,category_id,month', ignoreDuplicates: true })
      if (e2) throw e2

      return { inserted: rows.length }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', user?.id, rangeStart] })
    },
  })
}
