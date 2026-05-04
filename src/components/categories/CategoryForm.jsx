import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories.js'

const PALETTE = [
  '#7c5cff', '#22c55e', '#f59e0b', '#06b6d4',
  '#ef4444', '#ec4899', '#3b82f6', '#a855f7',
  '#94a3b8', '#84cc16', '#14b8a6', '#f97316',
]

/**
 * Formulario de alta/edición de categoría.
 * - Si recibe `category` lo usa para editar; si no, crea nueva.
 * - Llama a onSuccess() al guardar.
 *
 * Confirmación: cuando estás editando y CAMBIAS EL NOMBRE, antes de guardar
 * te pide confirmación para que entiendas que el nuevo nombre se aplica también
 * a todos los movimientos pasados que tienen esa categoría asignada.
 * Si solo cambias el color, guarda directo sin pedir nada.
 */
export default function CategoryForm({ category, onSuccess }) {
  const isEdit = !!category
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? PALETTE[0])
  const [error, setError] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const busy = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    setName(category?.name ?? '')
    setColor(category?.color ?? PALETTE[0])
    setError(null)
    setConfirming(false)
  }, [category])

  const nameChanged = isEdit && name.trim() !== category.name

  async function doSave() {
    setError(null)
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: category.id, name, color })
      } else {
        await createMutation.mutateAsync({ name, color })
      }
      onSuccess?.()
    } catch (err) {
      setError(err.message ?? 'No se pudo guardar')
      setConfirming(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Edit con cambio de nombre → confirmación
    if (nameChanged) {
      setConfirming(true)
      return
    }
    // Resto: guarda directo
    doSave()
  }

  // Vista de confirmación (sustituye al form mientras está activa)
  if (confirming) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 ring-1 ring-warning/20">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-sm text-white">
            Vas a renombrar <strong>"{category.name}"</strong> a{' '}
            <strong>"{name.trim()}"</strong>. El nombre nuevo se aplicará también a{' '}
            <strong>todos los movimientos pasados</strong> que tienen esta categoría
            asignada. ¿Quieres continuar?
          </p>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={doSave}
            disabled={busy}
            className="flex-1"
          >
            {busy ? 'Renombrando…' : 'Sí, renombrar'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mascotas, Suscripciones…"
          autoFocus
          maxLength={40}
          required
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs uppercase tracking-wide text-white/50">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={[
                'h-8 w-8 rounded-full transition',
                color === c
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-elevated'
                  : 'opacity-80 hover:opacity-100',
              ].join(' ')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={busy} className="flex-1">
          {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  )
}
