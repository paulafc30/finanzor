import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Modal from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import CategoryForm from '../components/categories/CategoryForm.jsx'
import {
  useCategories,
  useArchiveCategory,
  useUnarchiveCategory,
} from '../hooks/useCategories.js'

/**
 * Pagina de gestion de categorias.
 *
 * Comportamiento de las custom:
 *  - "Archivar" en vez de "Eliminar": conserva los datos historicos
 *    para que los movimientos antiguos sigan mostrando la categoria.
 *  - "Restaurar" devuelve la categoria al listado activo.
 *  - Las archivadas no aparecen en los selectores nuevos pero si en el
 *    filtro de Movimientos.
 *
 * Las default (is_default = true) NO se pueden archivar ni eliminar —
 * garantiza que siempre haya al menos las 9 iniciales. Si se pueden
 * renombrar y cambiar color.
 */
export default function Categories() {
  // Cargamos siempre TODAS (activas + archivadas) para poder mostrarlas
  // segun el toggle.
  const { data: allCategories = [], isLoading, error } = useCategories({
    includeArchived: true,
  })
  const archiveMutation = useArchiveCategory()
  const unarchiveMutation = useUnarchiveCategory()

  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState(null) // null | 'new' | category object
  const open = editing !== null

  const { active, archived } = useMemo(() => {
    const a = []
    const ar = []
    for (const c of allCategories) {
      if (c.is_archived) ar.push(c)
      else a.push(c)
    }
    return { active: a, archived: ar }
  }, [allCategories])

  function handleNew() {
    setEditing('new')
  }

  function handleEdit(cat) {
    setEditing(cat)
  }

  async function handleArchive(cat) {
    if (cat.is_default) return
    const ok = window.confirm(
      `¿Archivar la categoría "${cat.name}"?\n\nDejará de aparecer al crear nuevos movimientos, pero los antiguos seguirán mostrándola.`,
    )
    if (!ok) return
    try {
      await archiveMutation.mutateAsync(cat)
    } catch (err) {
      alert('No se pudo archivar: ' + (err.message ?? 'error'))
    }
  }

  async function handleUnarchive(cat) {
    try {
      await unarchiveMutation.mutateAsync(cat)
    } catch (err) {
      alert('No se pudo restaurar: ' + (err.message ?? 'error'))
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

      {/* Activas */}
      <ul className="space-y-2">
        {active.map((c) => (
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
                    title="Categoría por defecto — se puede renombrar pero no archivar"
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

            {/* Solo las custom muestran botón de archivar */}
            {!c.is_default && (
              <button
                type="button"
                onClick={() => handleArchive(c)}
                aria-label="Archivar"
                title="Archivar (conserva el historial)"
                disabled={archiveMutation.isPending}
                className="rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-warning disabled:opacity-50"
              >
                <Archive size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Toggle ver archivadas */}
      {archived.length > 0 && (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
        >
          {showArchived ? <EyeOff size={13} /> : <Eye size={13} />}
          {showArchived
            ? `Ocultar archivadas (${archived.length})`
            : `Ver archivadas (${archived.length})`}
        </button>
      )}

      {/* Archivadas */}
      {showArchived && archived.length > 0 && (
        <div className="space-y-2 pt-2">
          <h2 className="px-1 text-[11px] uppercase tracking-wide text-white/40">
            Archivadas
          </h2>
          <ul className="space-y-2">
            {archived.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl bg-bg-elevated/50 p-3 ring-1 ring-white/5"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full opacity-60"
                  style={{ backgroundColor: c.color ?? '#94a3b8' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm text-white/70">{c.name}</span>
                    <span
                      title="Conservada para que tus movimientos antiguos sigan teniendo categoría"
                      className="inline-flex items-center gap-0.5 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/60"
                    >
                      <Archive size={10} />
                      Archivada
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUnarchive(c)}
                  aria-label="Restaurar"
                  title="Volver a activarla"
                  disabled={unarchiveMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-md bg-bg-card px-2 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-accent disabled:opacity-50"
                >
                  <ArchiveRestore size={13} />
                  Restaurar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="px-1 text-xs text-white/40">
        Las "Fijas" son las iniciales — puedes renombrarlas o recolorearlas, pero no
        archivarlas. Las que tú creas (ej. "Viaje Madrid", "Carnet de moto") puedes
        archivarlas cuando dejes de usarlas: desaparecen de los formularios nuevos
        pero los movimientos antiguos siguen mostrándolas.
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
