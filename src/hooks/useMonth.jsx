import { createContext, useContext, useMemo, useState } from 'react'
import {
  firstDayOfMonth,
  firstDayOfNextMonth,
  firstDayOfYear,
  firstDayOfNextYear,
} from '../lib/formatters.js'

const MonthContext = createContext(null)

/**
 * Provee el "rango de fecha seleccionado" a toda la app.
 *
 * El usuario puede alternar entre dos modos:
 *  - 'month': rango = mes seleccionado (1-mes-AAAA → 1-mes+1-AAAA)
 *  - 'year' : rango = año seleccionado  (1-ene-AAAA → 1-ene-AAAA+1)
 *
 * En ambos casos, las queries deben filtrar por
 * `occurred_on >= rangeStart` y `occurred_on < rangeEnd`. Nunca por
 * `created_at`.
 *
 * `month` sigue exponiéndose siempre como el primer día del mes / año
 * seleccionado para los componentes que necesitan formatearlo (p. ej.
 * MonthSwitcher).
 */
export function MonthProvider({ children }) {
  const today = new Date()
  const [month, setMonth] = useState(() => {
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [viewMode, setViewMode] = useState('month') // 'month' | 'year'

  const value = useMemo(() => {
    const isYear = viewMode === 'year'
    const rangeStart = isYear ? firstDayOfYear(month) : firstDayOfMonth(month)
    const rangeEnd = isYear ? firstDayOfNextYear(month) : firstDayOfNextMonth(month)

    return {
      month,
      viewMode,
      isYearView: isYear,
      rangeStart,
      rangeEnd,
      prev: () =>
        setMonth((m) =>
          isYear
            ? new Date(m.getFullYear() - 1, 0, 1)
            : new Date(m.getFullYear(), m.getMonth() - 1, 1),
        ),
      next: () =>
        setMonth((m) =>
          isYear
            ? new Date(m.getFullYear() + 1, 0, 1)
            : new Date(m.getFullYear(), m.getMonth() + 1, 1),
        ),
      goToToday: () =>
        setMonth(
          isYear
            ? new Date(today.getFullYear(), 0, 1)
            : new Date(today.getFullYear(), today.getMonth(), 1),
        ),
      setViewMode: (mode) => {
        setViewMode(mode)
        // Al cambiar a vista anual, alineamos al 1 de enero del año actual
        // del cursor para que el rango sea predecible.
        setMonth((m) =>
          mode === 'year'
            ? new Date(m.getFullYear(), 0, 1)
            : new Date(m.getFullYear(), m.getMonth(), 1),
        )
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, viewMode])

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}

export function useMonth() {
  const ctx = useContext(MonthContext)
  if (!ctx) throw new Error('useMonth debe usarse dentro de MonthProvider')
  return ctx
}
