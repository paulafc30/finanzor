import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { cleanKeyword } from '../lib/categoryRules.js'

/** Reglas de categorización del usuario (palabra clave -> categoría). */
export function useCategoryRules() {
  const { user } = useSession()

  return useQuery({
    queryKey: ['category-rules', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_rules')
        .select('id, keyword, category_id')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

/** Crea (o actualiza, si la palabra clave ya existe) una regla. */
export function useCreateCategoryRule() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ keyword, category_id }) => {
      const clean = cleanKeyword(keyword)
      if (!clean) throw new Error('invalid-keyword')
      if (!category_id) throw new Error('category-required')
      const { error } = await supabase
        .from('category_rules')
        .upsert(
          { user_id: user.id, keyword: clean, category_id },
          { onConflict: 'user_id,keyword' },
        )
      if (error) throw error
      return { keyword: clean, category_id }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['category-rules', user?.id] }),
  })
}

export function useDeleteCategoryRule() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('category_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['category-rules', user?.id] }),
  })
}
