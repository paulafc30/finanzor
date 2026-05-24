import { useMemo } from 'react'
import { Trash2, ArrowDownCircle, ArrowUpCircle, Repeat } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatEuro } from '../../lib/formatters.js'
import {
  useTransactions,
  useDeleteTransaction,
} from '../../hooks/useTransactions.js'
import { useMonth } from '../../hooks/useMonth.jsx'
import { applyFilter, countActiveFilters } from './MovementsFilters.jsx'

/**
 * Lista de movimientos del mes seleccionado.
 * Cada item es clickable: llama a onEdit(t) si se proporciona.
 * El botón de papelera tiene stopPropagation para no disparar el edit al borrar.
 *
 * Si se pasa `filter` (objeto con la forma definida en MovementsFilters.jsx),
 * la lista se filtra localmente.
 */
export default function TransactionList({ onEdit, filter = null }) {
  const { data: transactions = [], isLoading, error } = useTransactions()
  const deleteMutation = useDeleteTransaction()
  const { isYearView } = useMonth()

  // Aplicar filtro local si se proporciona
  const filtered = useMemo(
    () => (filter ? applyFilter(transactions, filter) : transactions),
    [transactions, filter],
  )

  // Agrupar por occurred_on (día)
  const grouped = useMemo(() => {
    const map = new Map()
    for (const t of filtered) {
      const key = t.occurred_on
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    return Array.from(map.entries())
  }, [filtered])

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
        Error cargando movimientos: {error.message}
      </p>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl bg-bg-elevated p-8 text-center">
        <p className="text-white/60">
          {isYearView
            ? 'No hay movimientos este año.'
            : 'No hay movimientos este mes.'}
        </p>
        <p className="mt-1 text-xs text-white/40">
          Pulsa el botón + para añadir el primero.
        </p>
      </div>
    )
  }

  // Hay movimientos pero el filtro deja la lista vacía
  if (filtered.length === 0) {
    const filtersActive =
      (filter?.text && filter.text.length > 0) ||
      (filter && countActiveFilters(filter) > 0)
    return (
      <div className="rounded-xl bg-bg-elevated p-8 text-center">
        <p className="text-white/60">
          {filtersActive
            ? 'Ningún movimiento coincide con los filtros.'
            : 'No hay resultados.'}
        </p>
        <p className="mt-1 text-xs text-white/40">
          Ajusta o limpia los filtros para ver más.
        </p>
      </div>
    )
  }

  async function handleDelete(e, t) {
    e.stopPropagation()
    const ok = window.confirm(
      `¿Eliminar este ${t.type === 'expense' ? 'gasto' : 'ingreso'} de ${formatEuro(t.amount)}?`,
    )
    if (!ok) return
    try {
      await deleteMutation.mutateAsync(t.id)
    } catch (err) {
      alert('No se pudo eliminar: ' + (err.message ?? 'error desconocido'))
    }
  }

  return (
    <div className="space-y-4">
      {grouped.map(([day, items]) => (
        <div key={day}>
          <h3 className="mb-1.5 px-1 text-xs uppercase tracking-wide text-white/40">
            {format(new Date(day), "EEEE d 'de' LLLL", { locale: es })}
          </h3>
          <ul className="overflow-hidden rounded-xl bg-bg-elevated">
            {items.map((t) => (
              <li
                key={t.id}
                className="border-b border-white/5 last:border-b-0"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onEdit?.(t)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onEdit?.(t)
                    }
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5"
                  aria-label="Editar movimiento"
                >
                  {t.type === 'expense' ? (
                    <ArrowDownCircle size={20} className="shrink-0 text-danger" />
                  ) : (
                    <ArrowUpCircle size={20} className="shrink-0 text-success" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm text-white">
                        {t.description || (t.category?.name ?? 'Sin descripción')}
                      </p>
                      {t.recurring_id && (
                        <Repeat
                          size={12}
                          className="shrink-0 text-accent"
                          aria-label="Movimiento recurrente"
                        />
                      )}
                    </div>
                    {t.category && (
                      <p
                        className="text-xs"
                        style={{ color: t.category.color ?? 'rgba(255,255,255,0.5)' }}
                      >
                        {t.category.name}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={[
                        'text-sm font-semibold tabular-nums',
                        t.type === 'expense' ? 'text-danger' : 'text-success',
                      ].join(' ')}
                    >
                      {t.type === 'expense' ? '−' : '+'}
                      {formatEuro(t.amount)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, t)}
                    aria-label="Eliminar"
                    className="shrink-0 rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
