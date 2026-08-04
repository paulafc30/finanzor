import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'
import { useMonth } from './useMonth.jsx'

/**
 * Compara gastos por categoria entre el periodo actual y un periodo
 * anterior de referencia.
 *
 * Reglas segun el `viewMode` de useMonth():
 *  - 'month' (mes seleccionado vs media de los 3 meses anteriores):
 *      current  = suma de gastos por categoria del mes seleccionado.
 *      previous = media mensual de los 3 meses anteriores. Asi una
 *      categoria que en febrero gastas 90 y antes solia gastar 100 sale
 *      "ahorrando 10", no se distorsiona por meses muy gordos puntuales.
 *  - 'year' (anio seleccionado vs anio anterior):
 *      current  = suma de gastos por categoria del anio seleccionado.
 *      previous = suma del anio anterior completo.
 *
 * Devuelve la lista ordenada de mayor a menor `current`, ya enriquecida
 * con el nombre y color de la categoria (no filas con id pelado). Las
 * categorias sin gasto en ninguno de los dos periodos quedan fuera para
 * no contaminar la grafica.
 *
 * IMPORTANTE: filtrado por `occurred_on` (fecha real del movimiento),
 * nunca por `created_at`. Ver docs/adr/0003.
 */
export function useExpenseComparison() {
  const { user } = useSession()
  const { month, viewMode, rangeStart, rangeEnd } = useMonth()

  // Calculamos el rango "anterior" segun el viewMode.
  const previous = computePreviousRange(month, viewMode)

  return useQuery({
    queryKey: [
      'expense-comparison',
      user?.id,
      viewMode,
      rangeStart,
      rangeEnd,
      previous.from,
      previous.to,
      previous.monthsCount,
    ],
    enabled: !!user,
    queryFn: async () => {
      // 1) Categorias (incluidas archivadas, para no perder "Viaje Madrid"
      //    del mes pasado al pintar la grafica).
      const { data: cats, error: catsErr } = await supabase
        .from('categories')
        .select('id, name, color, is_archived')
        .eq('user_id', user.id)
      if (catsErr) throw catsErr

      // 2) Movimientos del rango actual.
      const { data: rowsNow, error: e1 } = await supabase
        .from('transactions')
        .select('amount, category_id, occurred_on, type')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('occurred_on', rangeStart)
        .lt('occurred_on', rangeEnd)
      if (e1) throw e1

      // 3) Movimientos del rango anterior.
      const { data: rowsPrev, error: e2 } = await supabase
        .from('transactions')
        .select('amount, category_id, occurred_on, type')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('occurred_on', previous.from)
        .lt('occurred_on', previous.to)
      if (e2) throw e2

      // 4) Agregar por categoria.
      const sumNow = sumByCategory(rowsNow)
      const sumPrev = sumByCategory(rowsPrev)

      // En modo mes, previous es la media mensual: dividimos entre nº meses
      // del periodo anterior. En modo anio, previous es total anual y se
      // usa tal cual.
      const divisor = viewMode === 'year' ? 1 : previous.monthsCount || 1

      const byId = new Map(cats.map((c) => [c.id, c]))

      const items = []
      const allIds = new Set([...sumNow.keys(), ...sumPrev.keys()])
      for (const id of allIds) {
        const cat = byId.get(id)
        if (!cat) continue // huerfana: la saltamos
        const current = sumNow.get(id) ?? 0
        const previousValue = (sumPrev.get(id) ?? 0) / divisor
        if (current === 0 && previousValue === 0) continue
        items.push({
          categoryId: id,
          name: cat.name,
          color: cat.color ?? '#94a3b8',
          isArchived: cat.is_archived,
          current,
          previous: previousValue,
          diff: current - previousValue,
        })
      }
      items.sort((a, b) => b.current - a.current)

      return {
        viewMode,
        items,
        previousLabel:
          viewMode === 'year'
            ? `Año ${previous.label}`
            : `Media últimos ${previous.monthsCount} meses`,
        currentLabel:
          viewMode === 'year' ? `Año ${currentYearLabel(month)}` : 'Mes actual',
      }
    },
  })
}

// ---------- helpers ----------

function sumByCategory(rows) {
  const map = new Map()
  for (const r of rows ?? []) {
    if (!r.category_id) continue
    map.set(r.category_id, (map.get(r.category_id) ?? 0) + Number(r.amount))
  }
  return map
}

function computePreviousRange(month, viewMode) {
  if (viewMode === 'year') {
    const y = month.getFullYear() - 1
    return {
      from: format(new Date(y, 0, 1), 'yyyy-MM-dd'),
      to: format(new Date(y + 1, 0, 1), 'yyyy-MM-dd'),
      monthsCount: 12,
      label: String(y),
    }
  }
  // Mes: media de los 3 meses anteriores al seleccionado.
  const y = month.getFullYear()
  const m = month.getMonth()
  return {
    from: format(new Date(y, m - 3, 1), 'yyyy-MM-dd'),
    to: format(new Date(y, m, 1), 'yyyy-MM-dd'),
    monthsCount: 3,
    label: '',
  }
}

function currentYearLabel(date) {
  return String(date.getFullYear())
}
