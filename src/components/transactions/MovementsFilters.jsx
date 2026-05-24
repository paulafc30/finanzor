import { useState } from 'react'
import { Search, SlidersHorizontal, X, Plus, Archive } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories.js'

/**
 * Filtros y buscador para la pagina de Movimientos.
 *
 * Estado controlado desde el padre via prop `filter` y callback `onChange`.
 *
 * Estructura del objeto filter:
 *  {
 *    text: '',
 *    type: 'all' | 'expense' | 'income',
 *    dateFrom: '',   // YYYY-MM-DD, vacio = sin limite inferior
 *    dateTo: '',     // YYYY-MM-DD, vacio = sin limite superior
 *    amountMin: '',
 *    amountMax: '',
 *    categoryIds: [], // ids seleccionados; vacio = todas
 *  }
 */
export function emptyFilter() {
  return {
    text: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    categoryIds: [],
  }
}

/**
 * Cuenta cuantos filtros (sin contar el texto libre) hay activos.
 * Se usa para pintar el badge "Filtros (N)".
 */
export function countActiveFilters(f) {
  let n = 0
  if (f.type && f.type !== 'all') n++
  if (f.dateFrom) n++
  if (f.dateTo) n++
  if (f.amountMin !== '' && f.amountMin != null) n++
  if (f.amountMax !== '' && f.amountMax != null) n++
  if (f.categoryIds && f.categoryIds.length > 0) n++
  return n
}

export default function MovementsFilters({ filter, onChange }) {
  const [open, setOpen] = useState(false)
  // Incluimos las archivadas para poder filtrar por categorias antiguas
  // (ej. un viaje que ya termino) sobre el historial de movimientos.
  const { data: categories = [] } = useCategories({ includeArchived: true })

  const activeCount = countActiveFilters(filter)
  const isDirty = activeCount > 0 || (filter.text && filter.text.length > 0)

  function patch(p) {
    onChange({ ...filter, ...p })
  }

  function toggleCategory(id) {
    const cur = filter.categoryIds ?? []
    const next = cur.includes(id)
      ? cur.filter((x) => x !== id)
      : [...cur, id]
    patch({ categoryIds: next })
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            inputMode="search"
            value={filter.text ?? ''}
            onChange={(e) => patch({ text: e.target.value })}
            placeholder="Buscar descripción o categoría…"
            // type="text" en vez de type="search" para evitar la X nativa
            // del navegador (tendríamos dos botones de borrar).
            className="w-full rounded-lg bg-bg-elevated px-3 py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/40 outline-none ring-1 ring-white/5 focus:ring-accent"
          />
          {filter.text && (
            <button
              type="button"
              onClick={() => patch({ text: '' })}
              aria-label="Limpiar búsqueda"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/50 hover:bg-white/5 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Botón abrir/cerrar panel de filtros */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={[
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm ring-1 transition',
            open || activeCount > 0
              ? 'bg-accent/10 text-accent ring-accent/30 hover:bg-accent/15'
              : 'bg-bg-elevated text-white/80 ring-white/5 hover:bg-white/5',
          ].join(' ')}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Resumen de filtros activos + botón limpiar todo */}
      {isDirty && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(emptyFilter())}
            className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X size={11} />
            Limpiar todo
          </button>
        </div>
      )}

      {/* Panel desplegable */}
      {open && (
        <div className="space-y-3 rounded-xl bg-bg-elevated p-3 ring-1 ring-white/5">
          {/* Tipo */}
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-white/50">
              Tipo
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-bg-card p-1">
              {[
                { v: 'all', label: 'Todos' },
                { v: 'expense', label: 'Gastos' },
                { v: 'income', label: 'Ingresos' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => patch({ type: opt.v })}
                  className={[
                    'rounded-md py-1.5 text-xs font-medium transition',
                    filter.type === opt.v
                      ? 'bg-accent text-white'
                      : 'text-white/60 hover:text-white',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-white/50">
              Fechas
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-0.5 block text-[10px] text-white/40">Desde</span>
                <input
                  type="date"
                  value={filter.dateFrom ?? ''}
                  onChange={(e) => patch({ dateFrom: e.target.value })}
                  className="w-full rounded-lg bg-bg-card px-2 py-1.5 text-xs text-white outline-none ring-1 ring-white/5 focus:ring-accent"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[10px] text-white/40">Hasta</span>
                <input
                  type="date"
                  value={filter.dateTo ?? ''}
                  onChange={(e) => patch({ dateTo: e.target.value })}
                  className="w-full rounded-lg bg-bg-card px-2 py-1.5 text-xs text-white outline-none ring-1 ring-white/5 focus:ring-accent"
                />
              </label>
            </div>
          </div>

          {/* Importe */}
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-white/50">
              Importe (€)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-0.5 block text-[10px] text-white/40">Mínimo</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={filter.amountMin ?? ''}
                  onChange={(e) => patch({ amountMin: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg bg-bg-card px-2 py-1.5 text-xs text-white outline-none ring-1 ring-white/5 focus:ring-accent"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[10px] text-white/40">Máximo</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={filter.amountMax ?? ''}
                  onChange={(e) => patch({ amountMax: e.target.value })}
                  placeholder="—"
                  className="w-full rounded-lg bg-bg-card px-2 py-1.5 text-xs text-white outline-none ring-1 ring-white/5 focus:ring-accent"
                />
              </label>
            </div>
          </div>

          {/* Categorías */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-white/50">
                Categorías
              </p>
              <div className="flex items-center gap-2">
                {filter.categoryIds?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => patch({ categoryIds: [] })}
                    className="text-[10px] text-white/40 hover:text-white"
                  >
                    Quitar todas
                  </button>
                )}
                <Link
                  to="/categorias"
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent hover:text-accent/80"
                >
                  <Plus size={11} />
                  Nueva
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.length === 0 && (
                <span className="text-xs text-white/40">Cargando…</span>
              )}
              {categories.map((c) => {
                const active = filter.categoryIds?.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    title={c.is_archived ? `${c.name} (archivada)` : c.name}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                      active
                        ? 'bg-accent text-white'
                        : 'bg-bg-card text-white/70 hover:bg-white/10 hover:text-white',
                      c.is_archived && !active ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color ?? '#94a3b8' }}
                    />
                    {c.name}
                    {c.is_archived && (
                      <Archive size={10} className="opacity-70" aria-label="Archivada" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Aplica el filtro `f` sobre el array `transactions`.
 * Devuelve un nuevo array con las que cumplen TODAS las condiciones.
 *
 * - text: case-insensitive, sin acentos, compara contra descripcion + nombre
 *   de categoria.
 * - dateFrom / dateTo: inclusive en ambos extremos (compara strings YYYY-MM-DD).
 * - amountMin / amountMax: inclusive, vacios = sin limite.
 * - categoryIds: si esta vacio, no filtra; si tiene ids, la transaccion debe
 *   tener una categoria que este en el set.
 * - type: 'all' no filtra.
 */
export function applyFilter(transactions, f) {
  if (!f) return transactions

  const text = (f.text ?? '').trim()
  const needle = text ? normalize(text) : ''
  const min = f.amountMin === '' || f.amountMin == null ? null : Number(f.amountMin)
  const max = f.amountMax === '' || f.amountMax == null ? null : Number(f.amountMax)
  const catSet = f.categoryIds?.length ? new Set(f.categoryIds) : null

  return transactions.filter((t) => {
    if (f.type && f.type !== 'all' && t.type !== f.type) return false
    if (f.dateFrom && t.occurred_on < f.dateFrom) return false
    if (f.dateTo && t.occurred_on > f.dateTo) return false
    if (min != null && Number(t.amount) < min) return false
    if (max != null && Number(t.amount) > max) return false
    if (catSet && !catSet.has(t.category?.id)) return false
    if (needle) {
      const desc = normalize(t.description ?? '')
      const cat = normalize(t.category?.name ?? '')
      if (!desc.includes(needle) && !cat.includes(needle)) return false
    }
    return true
  })
}

function normalize(s) {
  // Quitamos acentos: NFD descompone "á" en "a" + diacritico (́),
  // y luego eliminamos todo el rango de combining marks (̀-ͯ).
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
