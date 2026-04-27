import { useMemo } from 'react'
import { Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatEuro } from '../../lib/formatters.js'
import { useTransactions, useDeleteTransaction } from '../../hooks/useTransactions.js'

/**
 * Lista de movimientos del mes seleccionado.
 * Agrupa por día para que sea más fácil de leer en móvil.
 */
export default function TransactionList() {
  const { data: transactions = [], isLoading, error } = useTransactions()
  const deleteMutation = useDeleteTransaction()

  // Agrupar por occurred_on (día)
  const grouped = useMemo(() => {
    const map = new Map()
    for (const t of transactions) {
      const key = t.occurred_on
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    // Map mantiene el orden de inserción (las queries vienen DESC), así que
    // el orden de los días se preserva sin tocar nada
    return Array.from(map.entries())
  }, [transactions])

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
        <p className="text-white/60">No hay movimientos este mes.</p>
        <p className="mt-1 text-xs text-white/40">
          Pulsa el botón + para añadir el primero.
        </p>
      </div>
    )
  }

  async function handleDelete(t) {
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
                className="flex items-center gap-3 border-b border-white/5 px-3 py-2.5 last:border-b-0"
              >
                {t.type === 'expense' ? (
                  <ArrowDownCircle size={20} className="shrink-0 text-danger" />
                ) : (
                  <ArrowUpCircle size={20} className="shrink-0 text-success" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">
                    {t.description || (t.category?.name ?? 'Sin descripción')}
                  </p>
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
                      'text-sm font-semibold',
                      t.type === 'expense' ? 'text-danger' : 'text-success',
                    ].join(' ')}
                  >
                    {t.type === 'expense' ? '−' : '+'}
                    {formatEuro(t.amount)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(t)}
                  aria-label="Eliminar"
                  className="shrink-0 rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
