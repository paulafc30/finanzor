import { Pencil, Trash2, Repeat } from 'lucide-react'
import { formatEuro } from '../../lib/formatters.js'
import {
  useRecurringExpenses,
  useToggleRecurring,
  useDeleteRecurring,
} from '../../hooks/useRecurringExpenses.js'

/**
 * Lista de gastos fijos recurrentes con toggle activar/desactivar,
 * editar y eliminar.
 */
export default function RecurringList({ onEdit }) {
  const { data: recurrings = [], isLoading } = useRecurringExpenses()
  const toggle = useToggleRecurring()
  const remove = useDeleteRecurring()

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (recurrings.length === 0) {
    return (
      <div className="rounded-xl bg-bg-elevated p-4 text-center text-sm text-white/60">
        No tienes gastos fijos. Pulsa "Nuevo" para añadir el primero (alquiler,
        suscripciones, gimnasio…).
      </div>
    )
  }

  async function handleToggle(r) {
    try {
      await toggle.mutateAsync({ id: r.id, is_active: !r.is_active })
    } catch (err) {
      alert('No se pudo cambiar: ' + (err.message ?? 'error'))
    }
  }

  async function handleDelete(r) {
    const ok = window.confirm(
      `¿Eliminar el gasto fijo "${r.name}"?\n\n• Los movimientos futuros (de meses que aún no han ocurrido) se eliminarán.\n• Los movimientos pasados se mantienen para no falsear el histórico.\n• A partir de ahora ya no se volverá a generar.`,
    )
    if (!ok) return
    try {
      await remove.mutateAsync(r.id)
    } catch (err) {
      alert('No se pudo eliminar: ' + (err.message ?? 'error'))
    }
  }

  return (
    <ul className="space-y-2">
      {recurrings.map((r) => (
        <li
          key={r.id}
          className={[
            'flex items-center gap-3 rounded-xl bg-bg-elevated p-3',
            r.is_active ? '' : 'opacity-50',
          ].join(' ')}
        >
          <Repeat size={16} className="shrink-0 text-accent" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-white">
                {r.name}
              </span>
              {r.category && (
                <span
                  className="text-xs"
                  style={{ color: r.category.color ?? 'rgba(255,255,255,0.5)' }}
                >
                  · {r.category.name}
                </span>
              )}
            </div>
            <p className="text-xs text-white/50">
              {formatEuro(r.amount)} · día {r.day_of_month} de cada mes
            </p>
          </div>

          {/* Toggle activo */}
          <label className="shrink-0 cursor-pointer" title={r.is_active ? 'Activo' : 'Inactivo'}>
            <input
              type="checkbox"
              checked={r.is_active}
              onChange={() => handleToggle(r)}
              className="peer sr-only"
            />
            <span className="block h-5 w-9 rounded-full bg-white/10 transition peer-checked:bg-accent">
              <span
                className={[
                  'block h-4 w-4 translate-x-0.5 translate-y-0.5 rounded-full bg-white transition',
                  r.is_active ? 'translate-x-[18px]' : '',
                ].join(' ')}
              />
            </span>
          </label>

          <button
            type="button"
            onClick={() => onEdit(r)}
            aria-label="Editar"
            className="shrink-0 rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(r)}
            aria-label="Eliminar"
            className="shrink-0 rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-danger"
          >
            <Trash2 size={15} />
          </button>
        </li>
      ))}
    </ul>
  )
}
