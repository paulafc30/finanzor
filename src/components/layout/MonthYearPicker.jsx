import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * Selector tipo calendario para elegir mes y anio (o solo anio).
 *
 * Props:
 *  - open: bool
 *  - mode: 'month' (elige mes + anio) | 'year' (elige solo anio)
 *  - value: Date — el mes/anio actualmente seleccionado
 *  - onSelect(date): se llama con un Date apuntando al dia 1 del mes elegido,
 *    o al 1 de enero del anio elegido en modo 'year'.
 *  - onClose(): cerrar sin cambios
 *
 * En movil aparece como bottom-sheet; en sm+ como modal centrado.
 */
export default function MonthYearPicker({ open, mode = 'month', value, onSelect, onClose }) {
  const { t } = useTranslation('layout')
  const MONTHS_SHORT = t('picker.monthsShort', { returnObjects: true })
  const MONTHS_FULL = t('picker.monthsFull', { returnObjects: true })
  const now = new Date()
  const selDate = value instanceof Date ? value : new Date()

  // En modo 'month' navegamos por anio (anio currentyear visible en el header).
  // En modo 'year' navegamos por bloques de 12 anios.
  const [cursorYear, setCursorYear] = useState(selDate.getFullYear())

  // Reset del cursor cuando se abre o cambia el valor
  useEffect(() => {
    if (open) setCursorYear(selDate.getFullYear())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value])

  // Cierre con ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Bloque de 12 anios para modo 'year' (anclado al cursor)
  const yearBlock = useMemo(() => {
    if (mode !== 'year') return null
    const blockStart = Math.floor(cursorYear / 12) * 12
    return Array.from({ length: 12 }, (_, i) => blockStart + i)
  }, [mode, cursorYear])

  if (!open) return null

  function selectMonth(monthIdx) {
    onSelect?.(new Date(cursorYear, monthIdx, 1))
  }

  function selectYear(y) {
    onSelect?.(new Date(y, 0, 1))
  }

  function prev() {
    setCursorYear((y) => (mode === 'year' ? y - 12 : y - 1))
  }

  function next() {
    setCursorYear((y) => (mode === 'year' ? y + 12 : y + 1))
  }

  function jumpToToday() {
    if (mode === 'year') {
      selectYear(now.getFullYear())
    } else {
      onSelect?.(new Date(now.getFullYear(), now.getMonth(), 1))
    }
  }

  const headerLabel =
    mode === 'year'
      ? `${yearBlock[0]} – ${yearBlock[yearBlock.length - 1]}`
      : String(cursorYear)

  // IMPORTANTE: renderizamos el modal via React Portal en `document.body`
  // porque el header del AppShell usa `backdrop-blur` (CSS backdrop-filter),
  // que rompe `position: fixed` de los hijos. Sin portal, el modal queda
  // atrapado dentro del header sticky en lugar de cubrir toda la pantalla.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('picker.selectMonthYear')}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      {/*
        Posicionamiento del modal:
        - Movil: anclado al fondo de la pantalla (bottom-sheet). Usamos
          posicion absoluta inset-x-0 bottom-0 para que siempre se vea
          arrancando desde la parte inferior, sin depender de flex+min-h
          que algunos navegadores moviles calculan mal.
        - sm+: centrado tanto vertical como horizontalmente.
        Damos al modal max-h-[85vh] y overflow-y-auto para que, si el
        contenido excede la pantalla, scrollee dentro de si mismo sin
        salirse del viewport.
      */}
      <div
        className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose?.()
        }}
      >
        <div className="mx-auto w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg-elevated p-4 shadow-xl sm:rounded-2xl">
        {/* Header: navegacion + cerrar */}
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            aria-label={mode === 'year' ? t('picker.prevBlock') : t('picker.prevYear')}
            className="rounded-full p-2 text-white/70 hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-white tabular-nums">
              {headerLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={next}
            aria-label={mode === 'year' ? t('picker.nextBlock') : t('picker.nextYear')}
            className="rounded-full p-2 text-white/70 hover:bg-white/5 hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('picker.close')}
            className="ml-1 rounded-full p-2 text-white/60 hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Grid principal */}
        {mode === 'year' ? (
          <div className="grid grid-cols-3 gap-2">
            {yearBlock.map((y) => {
              const isSelected = y === selDate.getFullYear()
              const isCurrent = y === now.getFullYear()
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => selectYear(y)}
                  className={cellClass(isSelected, isCurrent)}
                >
                  {y}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {MONTHS_SHORT.map((m, idx) => {
              const isSelected =
                selDate.getMonth() === idx && selDate.getFullYear() === cursorYear
              const isCurrent =
                now.getMonth() === idx && now.getFullYear() === cursorYear
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectMonth(idx)}
                  title={`${MONTHS_FULL[idx]} ${cursorYear}`}
                  className={cellClass(isSelected, isCurrent)}
                >
                  {m}
                </button>
              )
            })}
          </div>
        )}

        {/* Acceso rapido a hoy */}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={jumpToToday}
            className="rounded-full bg-bg-card px-3 py-1 text-[11px] font-medium text-white/70 ring-1 ring-white/5 hover:text-white"
          >
            {mode === 'year' ? t('picker.currentYear') : t('picker.currentMonth')}
          </button>
        </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function cellClass(isSelected, isCurrent) {
  return [
    'rounded-lg py-3 text-sm font-medium tabular-nums transition',
    isSelected
      ? 'bg-accent text-white'
      : isCurrent
      ? 'bg-bg-card text-accent ring-1 ring-accent/30 hover:bg-white/10'
      : 'bg-bg-card text-white/80 hover:bg-white/10',
  ].join(' ')
}
