import { Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { formatEuro, formatDate } from '../../lib/formatters.js'

/**
 * Tabla editable con los movimientos a importar.
 * - Cada fila se puede eliminar (botón papelera).
 * - Se puede cambiar tipo, descripción y categoría inline.
 * - La fecha y el importe se pueden editar también.
 *
 * Llama a onChange(transactions) con la nueva lista cada vez que algo cambia.
 */
export default function ImportPreviewTable({ items, categories, onChange }) {
  function update(id, patch) {
    onChange(items.map((it) => (it._id === id ? { ...it, ...patch } : it)))
  }

  function remove(id) {
    onChange(items.filter((it) => it._id !== id))
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-bg-elevated p-6 text-center text-sm text-white/60 ring-1 ring-white/5">
        No quedan movimientos. Sube otro CSV o ajusta el mapeo de columnas.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const isExpense = it.type === 'expense'
        return (
          <div
            key={it._id}
            className="rounded-xl bg-bg-elevated p-3 ring-1 ring-white/5"
          >
            {/* Fila superior: tipo + importe + papelera */}
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  update(it._id, { type: isExpense ? 'income' : 'expense' })
                }
                className={[
                  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition',
                  isExpense
                    ? 'bg-danger/15 text-danger hover:bg-danger/25'
                    : 'bg-success/15 text-success hover:bg-success/25',
                ].join(' ')}
                title="Click para cambiar gasto/ingreso"
              >
                {isExpense ? (
                  <>
                    <ArrowDownCircle size={12} />
                    Gasto
                  </>
                ) : (
                  <>
                    <ArrowUpCircle size={12} />
                    Ingreso
                  </>
                )}
              </button>

              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={it.amount}
                onChange={(e) =>
                  update(it._id, { amount: Number(e.target.value) })
                }
                className="w-28 rounded-md bg-bg-card px-2 py-1 text-right text-sm font-semibold text-white tabular-nums outline-none ring-1 ring-white/5 focus:ring-accent"
              />
              <span className="text-xs text-white/40">€</span>

              <input
                type="date"
                value={it.occurred_on}
                onChange={(e) => update(it._id, { occurred_on: e.target.value })}
                className="ml-auto rounded-md bg-bg-card px-2 py-1 text-xs text-white outline-none ring-1 ring-white/5 focus:ring-accent"
              />

              <button
                type="button"
                onClick={() => remove(it._id)}
                aria-label="Eliminar fila"
                className="rounded-md p-1.5 text-white/40 hover:bg-white/5 hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Fila inferior: descripción + categoría */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={it.description ?? ''}
                onChange={(e) => update(it._id, { description: e.target.value })}
                placeholder="Descripción"
                className="flex-1 rounded-md bg-bg-card px-2.5 py-1.5 text-sm text-white outline-none ring-1 ring-white/5 focus:ring-accent"
              />
              <select
                value={it.category_id ?? ''}
                onChange={(e) => update(it._id, { category_id: e.target.value })}
                className="rounded-md bg-bg-card px-2.5 py-1.5 text-sm text-white outline-none ring-1 ring-white/5 focus:ring-accent sm:w-44"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )
      })}

      <p className="px-1 text-xs text-white/40">
        Click en "Gasto" / "Ingreso" para cambiar el tipo. Edita cualquier campo
        directamente. Pulsa la papelera para descartar una fila.
      </p>
    </div>
  )
}
