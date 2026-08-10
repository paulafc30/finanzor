import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'

/**
 * Lista las metas del usuario, incluyendo la suma de sus aportaciones.
 * Por defecto solo activas; pasa { includeArchived: true } para incluir las archivadas.
 *
 * Cada meta resultante tiene:
 *   { id, name, target_amount, target_date, is_archived, contributed, percentage }
 */
export function useGoals({ includeArchived = false } = {}) {
  const { user } = useSession()

  const query = useQuery({
    queryKey: ['goals', user?.id, includeArchived ? 'all' : 'active'],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('goals')
        .select(`
          id, name, target_amount, target_date, is_archived, created_at,
          contributions:goal_contributions(amount)
        `)
        .order('is_archived', { ascending: true })
        .order('created_at', { ascending: false })

      if (!includeArchived) q = q.eq('is_archived', false)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })

  const goals = useMemo(() => {
    return (query.data ?? []).map((g) => {
      const contributed = (g.contributions ?? []).reduce(
        (acc, c) => acc + Number(c.amount),
        0,
      )
      const target = Number(g.target_amount)
      const percentage = target > 0 ? (contributed / target) * 100 : 0
      return {
        id: g.id,
        name: g.name,
        target_amount: target,
        target_date: g.target_date,
        is_archived: g.is_archived,
        created_at: g.created_at,
        contributed,
        percentage,
      }
    })
  }, [query.data])

  return { goals, isLoading: query.isLoading, error: query.error }
}

export function useCreateGoal() {
  const { user } = useSession()
  const qc = useQueryClient()
  const { t } = useTranslation('savings')

  return useMutation({
    mutationFn: async ({ name, target_amount, target_date }) => {
      const cleanName = name?.trim()
      if (!cleanName) throw new Error(t('errors.nameRequired'))
      const target = Number(target_amount)
      if (!Number.isFinite(target) || target <= 0) {
        throw new Error(t('errors.targetRequired'))
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: cleanName,
          target_amount: target,
          target_date: target_date || null,
          is_archived: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
  })
}

export function useUpdateGoal() {
  const { user } = useSession()
  const qc = useQueryClient()
  const { t } = useTranslation('savings')

  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const cleaned = {}
      if (patch.name !== undefined) {
        const v = patch.name.trim()
        if (!v) throw new Error(t('errors.nameEmpty'))
        cleaned.name = v
      }
      if (patch.target_amount !== undefined) {
        const v = Number(patch.target_amount)
        if (!Number.isFinite(v) || v <= 0) throw new Error(t('errors.targetInvalid'))
        cleaned.target_amount = v
      }
      if (patch.target_date !== undefined) cleaned.target_date = patch.target_date || null
      if (patch.is_archived !== undefined) cleaned.is_archived = !!patch.is_archived

      const { data, error } = await supabase
        .from('goals')
        .update(cleaned)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
  })
}

/**
 * Archiva o desarchiva una meta (toggle).
 */
export function useToggleArchiveGoal() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_archived }) => {
      const { error } = await supabase
        .from('goals')
        .update({ is_archived })
        .eq('id', id)
      if (error) throw error
      return { id, is_archived }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
  })
}

/**
 * Elimina una meta y todas sus aportaciones (CASCADE).
 */
export function useDeleteGoal() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
  })
}
