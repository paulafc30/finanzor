import { createContext, useContext, useMemo, useState } from 'react'
import { firstDayOfMonth, firstDayOfNextMonth } from '../lib/formatters.js'

const MonthContext = createContext(null)

/**
 * Provee el "mes actualmente seleccionado" a toda la app.
 * - month: Date apuntando al primer día del mes seleccionado
 * - rangeStart / rangeEnd: strings YYYY-MM-DD para usar en queries SQL
 * - prev() / next(): navegar
 *
 * Importante: las queries deben filtrar por occurred_on >= rangeStart
 * y occurred_on < rangeEnd. Nunca por created_at.
 */
export function MonthProvider({ children }) {
  const today = new Date()
  const [month, setMonth] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1)
    return d
  })

  const value = useMemo(() => {
    const rangeStart = firstDayOfMonth(month)
    const rangeEnd = firstDayOfNextMonth(month)
    return {
      month,
      rangeStart,
      rangeEnd,
      prev: () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)),
      next: () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)),
      goToToday: () => setMonth(new Date(today.getFullYear(), today.getMonth(), 1)),
    }
  }, [month])

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}

export function useMonth() {
  const ctx = useContext(MonthContext)
  if (!ctx) throw new Error('useMonth debe usarse dentro de MonthProvider')
  return ctx
}
