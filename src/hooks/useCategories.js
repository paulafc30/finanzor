import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

/**
 * Crea una categoría nueva. is_default queda en false (es del usuario).
 */
export function useCreateCategory() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, color, icon }) => {
      const cleanName = name?.trim()
      if (!cleanName) throw new Error('El nombre es obligatorio')

      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: cleanName,
          color: color ?? '#94a3b8',
          icon: icon ?? null,
          is_default: false,
        })
        .select()
        .single()

      if (error) {
        // El índice único user_id+name dispara código 23505
        if (error.code === '23505') {
          throw new Error('Ya tienes una categoría con ese nombre')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', user?.id] })
    },
  })
}

/**
 * Edita nombre, color o icono de una categoría existente.
 * No cambia is_default — esa marca solo la pone el trigger SQL inicial.
 */
export function useUpdateCategory() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, color, icon }) => {
      const patch = {}
      if (name !== undefined) {
        const cleanName = name.trim()
        if (!cleanName) throw new Error('El nombre no puede estar vacío')
        patch.name = cleanName
      }
      if (color !== undefined) patch.color = color
      if (icon !== undefined) patch.icon = icon

      const { data, error } = await supabase
        .from('categories')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya tienes una categoría con ese nombre')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', user?.id] })
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['budgets', user?.id] })
    },
  })
}

/**
 * Elimina una categoría.
 *
 * REGLA DEL PRODUCTO: las categorías por defecto (is_default=true) no se
 * pueden eliminar. Garantiza que el usuario siempre tendrá al menos las 9
 * categorías iniciales, aunque las haya renombrado o cambiado de color.
 * Solo se permite renombrar y cambiar color.
 *
 * Para las custom: las transacciones que la usaban quedan con category_id
 * = null (ON DELETE SET NULL). Los presupuestos asociados se borran
 * (ON DELETE CASCADE).
 */
export function useDeleteCategory() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (category) => {
      // Acepta tanto un objeto categoría como un id (compat hacia atrás).
      // Si es objeto, comprobamos is_default antes de tocar la BD.
      if (typeof category === 'object' && category !== null) {
        if (category.is_default) {
          throw new Error('Las categorías por defecto no se pueden eliminar')
        }
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', category.id)
        if (error) throw error
        return category.id
      }

      // Fallback: solo id. Re-leemos para validar is_default antes de borrar.
      const id = category
      const { data: cat, error: readErr } = await supabase
        .from('categories')
        .select('id, is_default')
        .eq('id', id)
        .single()
      if (readErr) throw readErr
      if (cat?.is_default) {
        throw new Error('Las categorías por defecto no se pueden eliminar')
      }
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', user?.id] })
      qc.invalidateQueries({ queryKey: ['transactions', user?.id] })
      qc.invalidateQueries({ queryKey: ['budgets', user?.id] })
    },
  })
}
