import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'

/**
 * Devuelve todas las categorías del usuario actual.
 * Las 9 por defecto se insertan via trigger SQL al crear la cuenta.
 */
export function useCategories() {
  const { user } = useSession()

  return useQuery({
    queryKey: ['categories', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, color, is_default')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}
