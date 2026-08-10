import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import i18next from '../i18n/index.js'

// El idioma cambia en caliente (LanguageToggle), asi que estas funciones
// leen i18next.language en cada llamada en lugar de fijarlo al importar.
export function currentLang() {
  return i18next.language?.startsWith('en') ? 'en' : 'es'
}

export function dateFnsLocale() {
  return currentLang() === 'en' ? enUS : es
}

/**
 * Formatea un número como divisa (EUR): 1234.5 -> "1.234,50 €" (es) /
 * "€1,234.50" (en). La moneda se mantiene en euros en ambos idiomas.
 */
export function formatEuro(value) {
  if (value == null || isNaN(value)) {
    return currentLang() === 'en' ? '€0.00' : '0,00 €'
  }
  const intlLocale = currentLang() === 'en' ? 'en-IE' : 'es-ES'
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) como "12 abr 2026" (es) / "12 Apr 2026" (en)
 */
export function formatDate(isoDate, fmt = "d MMM yyyy") {
  if (!isoDate) return ''
  const d = typeof isoDate === 'string' ? new Date(isoDate) : isoDate
  return format(d, fmt, { locale: dateFnsLocale() })
}

/**
 * Devuelve "abril 2026" / "April 2026" capitalizado para el selector de mes
 */
export function formatMonthLabel(date) {
  const label = format(date, 'LLLL yyyy', { locale: dateFnsLocale() })
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

/**
 * Devuelve el primer día del año (YYYY-01-01) como string YYYY-MM-DD
 */
export function firstDayOfYear(date) {
  const d = new Date(date)
  return format(new Date(d.getFullYear(), 0, 1), 'yyyy-MM-dd')
}

/**
 * Devuelve el primer día del año siguiente como string YYYY-MM-DD
 */
export function firstDayOfNextYear(date) {
  const d = new Date(date)
  return format(new Date(d.getFullYear() + 1, 0, 1), 'yyyy-MM-dd')
}

/**
 * Devuelve "2026" — etiqueta del selector en modo anual
 */
export function formatYearLabel(date) {
  return String(new Date(date).getFullYear())
}
