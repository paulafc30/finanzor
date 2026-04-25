import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea un número como euros: 1234.5 -> "1.234,50 €"
 */
export function formatEuro(value) {
  if (value == null || isNaN(value)) return '0,00 €'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) como "12 abr 2026"
 */
export function formatDate(isoDate, fmt = "d MMM yyyy") {
  if (!isoDate) return ''
  const d = typeof isoDate === 'string' ? new Date(isoDate) : isoDate
  return format(d, fmt, { locale: es })
}

/**
 * Devuelve "abril 2026" capitalizado para el selector de mes
 */
export function formatMonthLabel(date) {
  const label = format(date, 'LLLL yyyy', { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Devuelve el primer día del mes como string YYYY-MM-DD
 */
export function firstDayOfMonth(date) {
  const d = new Date(date)
  d.setDate(1)
  return format(d, 'yyyy-MM-dd')
}

/**
 * Devuelve el primer día del mes siguiente como string YYYY-MM-DD
 */
export function firstDayOfNextMonth(date) {
  const d = new Date(date)
  d.setDate(1)
  d.setMonth(d.getMonth() + 1)
  return format(d, 'yyyy-MM-dd')
}
