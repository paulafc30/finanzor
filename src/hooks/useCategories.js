import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'

/**
 * Devuelve las categorias del usuario actual.
 *
 * Por defecto SOLO devuelve las activas (is_archived = false). Pasa
 * `{ includeArchived: true }` para incluir tambien las archivadas — util
 * en la pagina de gestion de categorias o en el filtro de Movimientos
 * para poder consultar el historico.
 *
 * Las 9 por defecto se insertan via trigger SQL al crear la cuenta.
 */
export function useCategories({ includeArchived = false } = {}) {
  const { user } = useSession()

  return useQuery({
    queryKey: ['categories', user?.id, includeArchived ? 'all' : 'active'],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('categories')
        .select('id, name, icon, color, is_default, is_archived')
      if (!includeArchived) q = q.eq('is_archived', false)
      q = q.order('is_default', { ascending: false }).order('name', { ascending: true })
      const { data, error } = await q

      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Crea una categoria nueva. is_default queda en false (es del usuario).
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
        // El indice unico user_id+name dispara codigo 23505
        if (error.code === '23505') {
          throw new Error('Ya tienes una categoria con ese nombre')
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
 * Edita nombre, color o icono de una categoria existente.
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
        if (!cleanName) throw new Error('El nombre no puede estar vacio')
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
          throw new Error('Ya tienes una categoria con ese nombre')
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
 * Archiva una categoria personalizada. NO borra los datos:
 *  - Los movimientos que la usaban siguen mostrandola como antes
 *    (con su nombre y color), asi se conserva el historial.
 *  - Deja de aparecer en los selectores de "crear movimiento", etc.
 *  - Si aparece en el filtro de Movimientos para consultar historico.
 *
 * REGLA: las default (is_default = true) NO se archivan — el usuario
 * siempre tiene esas 9 disponibles.
 */
export function useArchiveCategory() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (category) => {
      if (category?.is_default) {
        throw new Error('Las categorias por defecto no se pueden archivar')
      }
      const id = typeof category === 'object' ? category.id : category
      const { data, error } = await supabase
        .from('categories')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', user?.id] })
      qc.invalidateQueries({ queryKey: ['budgets', user?.id] })
    },
  })
}

/**
 * Restaura una categoria archivada (la vuelve a activa).
 */
export function useUnarchiveCategory() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (category) => {
      const id = typeof category === 'object' ? category.id : category
      const { data, error } = await supabase
        .from('categories')
        .update({ is_archived: false })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', user?.id] })
    },
  })
}

/**
 * Elimina una categoria PERMANENTEMENTE (perdiendo el nombre en
 * movimientos antiguos, que pasaran a "Sin categoria").
 *
 * Actualmente no esta expuesto desde la UI — la accion principal es
 * archivar. Se mantiene aqui por si se necesita en el futuro o para
 * acciones administrativas manuales.
 *
 * REGLA DEL PRODUCTO: las categorias por defecto (is_default=true) no
 * se pueden eliminar.
 *
 * Para las custom: las transacciones que la usaban quedan con
 * category_id = null (ON DELETE SET NULL). Los presupuestos asociados
 * se borran (ON DELETE CASCADE).
 */
export function useDeleteCategory() {
  const { user } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (category) => {
      if (typeof category === 'object' && category !== null) {
        if (category.is_default) {
          throw new Error('Las categorias por defecto no se pueden eliminar')
        }
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', category.id)
        if (error) throw error
        return category.id
      }

      const id = category
      const { data: cat, error: readErr } = await supabase
        .from('categories')
        .select('id, is_default')
        .eq('id', id)
        .single()
      if (readErr) throw readErr
      if (cat?.is_default) {
        throw new Error('Las categorias por defecto no se pueden eliminar')
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
