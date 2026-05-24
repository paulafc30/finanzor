import { createContext, useContext, useMemo, useRef, useState } from 'react'
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
 *  - 'month': rango = mes seleccionado (1-mes-AAAA -> 1-mes+1-AAAA)
 *  - 'year' : rango = año seleccionado  (1-ene-AAAA -> 1-ene-AAAA+1)
 *
 * En ambos casos, las queries deben filtrar por
 * `occurred_on >= rangeStart` y `occurred_on < rangeEnd`. Nunca por
 * `created_at`.
 *
 * Comportamiento al cambiar de vista:
 *  - Mes -> Año: recordamos el mes que estaba seleccionado para poder
 *    restaurarlo al volver. El cursor de año se posiciona en el año del
 *    mes que estabas viendo.
 *  - Año -> Mes: si veníamos de "Mes -> Año", restauramos el mes que
 *    estaba seleccionado entonces. Si no hay nada guardado, vamos al mes
 *    actual (no a enero del año seleccionado).
 */
export function MonthProvider({ children }) {
  const today = new Date()
  const [month, setMonth] = useState(() => {
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [viewMode, setViewModeState] = useState('month') // 'month' | 'year'

  // Mes que estaba activo justo antes de saltar a la vista anual.
  // Lo guardamos en un ref porque no necesita disparar re-render; solo
  // se consulta cuando el usuario vuelve a la vista mensual.
  const lastMonthRef = useRef(null)

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
      goToToday: () => {
        const now = new Date()
        setMonth(
          isYear
            ? new Date(now.getFullYear(), 0, 1)
            : new Date(now.getFullYear(), now.getMonth(), 1),
        )
      },
      // Saltar a un mes concreto (Date apuntando al dia 1).
      // Util para el selector tipo calendario.
      goToMonth: (date) => {
        const d = new Date(date)
        setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
      },
      // Saltar a un anio concreto (entero). En modo mes mantiene el mes actual.
      // En modo anio el cursor queda en 1-ene.
      goToYear: (year) => {
        setMonth((m) =>
          viewMode === 'year'
            ? new Date(year, 0, 1)
            : new Date(year, m.getMonth(), 1),
        )
      },
      setViewMode: (mode) => {
        if (mode === viewMode) return
        if (mode === 'year') {
          // Guardamos el mes actual para poder restaurarlo al volver,
          // y alineamos el cursor al 1 de enero del año correspondiente.
          lastMonthRef.current = month
          setMonth(new Date(month.getFullYear(), 0, 1))
        } else {
          // Volvemos a vista mensual: si recordamos el mes previo lo
          // restauramos; si no, vamos al mes actual real (no a enero).
          if (lastMonthRef.current) {
            setMonth(lastMonthRef.current)
            lastMonthRef.current = null
          } else {
            const now = new Date()
            setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
          }
        }
        setViewModeState(mode)
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
