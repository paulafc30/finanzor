import { useState } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import Modal from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import CategoryForm from '../components/categories/CategoryForm.jsx'
import { useCategories, useDeleteCategory } from '../hooks/useCategories.js'

/**
 * Página de gestión de categorías.
 * - Las default (is_default=true) NO se pueden eliminar — garantiza que
 *   siempre haya un mínimo de categorías. Sí se pueden renombrar y cambiar
 *   color.
 * - Las custom se borran con un confirm normal.
 */
export default function Categories() {
  const { data: categories = [], isLoading, error } = useCategories()
  const deleteMutation = useDeleteCategory()

  const [editing, setEditing] = useState(null) // null | 'new' | category object
  const open = editing !== null

  function handleNew() {
    setEditing('new')
  }

  function handleEdit(cat) {
    setEditing(cat)
  }

  async function handleDelete(cat) {
    if (cat.is_default) return // doble seguro: el botón ya no aparece, pero por si acaso

    const ok = window.confirm(
      `¿Eliminar la categoría "${cat.name}"?\n\nLos movimientos que la usaban quedarán sin categoría y los presupuestos asociados se borrarán.`,
    )
    if (!ok) return

    try {
      await deleteMutation.mutateAsync(cat)
    } catch (err) {
      alert('No se pudo eliminar: ' + (err.message ?? 'error'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
        Error: {error.message}
      </p>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/ajustes"
          className="rounded-full p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
          aria-label="Volver a ajustes"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-xl font-semibold">Categorías</h1>
        <Button size="sm" onClick={handleNew}>
          <Plus size={16} />
          Nueva
        </Button>
      </div>

      <ul className="space-y-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-3 rounded-xl bg-bg-elevated p-3"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: c.color ?? '#94a3b8' }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm text-white">{c.name}</span>
                {c.is_default && (
                  <span
                    title="Categoría por defecto — se puede renombrar pero no eliminar"
                    className="inline-flex items-center gap-0.5 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent"
                  >
                    <Shield size={10} />
                    Fija
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleEdit(c)}
              aria-label="Editar"
              className="rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
            >
              <Pencil size={15} />
            </button>

            {/* Solo las custom muestran botón de borrar */}
            {!c.is_default && (
              <button
                type="button"
                onClick={() => handleDelete(c)}
                aria-label="Eliminar"
                disabled={deleteMutation.isPending}
                className="rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-danger disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <p className="px-1 text-xs text-white/40">
        Las categorías marcadas como "Fija" son las iniciales de la app. Puedes
        renombrarlas o cambiar su color, pero no eliminarlas — así te aseguras
        de tener siempre al menos esas 9 disponibles.
      </p>

      <Modal
        open={open}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Nueva categoría' : 'Editar categoría'}
      >
        <CategoryForm
          category={editing && editing !== 'new' ? editing : null}
          onSuccess={() => setEditing(null)}
        />
      </Modal>
    </section>
  )
}
