import Papa from 'papaparse'
import { parse as parseDate, isValid as isValidDate, format as formatDate } from 'date-fns'

// Palabras clave que típicamente aparecen en una cabecera de CSV bancario.
// Si una línea contiene 2+ de estas palabras, asumimos que es la fila de headers.
const HEADER_KEYWORDS = /\b(fecha|date|importe|amount|concepto|descripc|detalle|operaci[oó]n|haber|debe|cargo|abono|movimiento)\b/gi

/**
 * Detecta en qué línea empieza la tabla real de movimientos.
 * Algunos bancos (CaixaBank, BBVA…) anteponen un preámbulo con datos de la
 * cuenta (titular, IBAN, periodo, saldo) antes de la cabecera real.
 */
function findHeaderLineIndex(lines) {
  for (let i = 0; i < lines.length; i++) {
    const matches = lines[i].toLowerCase().match(HEADER_KEYWORDS)
    if (matches && matches.length >= 2) return i
  }
  return 0
}

/**
 * Parsea un archivo CSV/TSV usando PapaParse.
 * - Soporta el preámbulo de bancos como CaixaBank: detecta automáticamente la
 *   primera línea que parezca cabecera real (con al menos 2 palabras clave).
 * - Quita BOM UTF-8 si lo hay.
 *
 * Devuelve { headers, rows } donde rows es array de objetos { col: valor }.
 */
export async function parseCsvFile(file) {
  const rawText = await file.text()
  // Quitar BOM si existe
  const text = rawText.replace(/^﻿/, '')
  const lines = text.split(/\r?\n/)

  const headerIdx = findHeaderLineIndex(lines)
  const cleanText = lines.slice(headerIdx).join('\n')

  return new Promise((resolve, reject) => {
    Papa.parse(cleanText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const rows = results.data.filter((r) =>
          Object.values(r).some((v) => v != null && String(v).trim() !== ''),
        )
        const headers = results.meta.fields ?? []
        resolve({ headers, rows })
      },
      error: (err) => reject(err),
    })
  })
}

const DATE_FORMATS = [
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'dd/MM/yy',
  'dd-MM-yy',
  'd/M/yyyy',
  'd-M-yyyy',
]

/**
 * Intenta convertir un string en YYYY-MM-DD probando varios formatos típicos.
 * Devuelve null si no consigue.
 */
export function tryParseDate(value) {
  if (!value) return null
  const s = String(value).trim()

  // ISO ya válido
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00')
    if (isValidDate(d)) return s
  }

  for (const fmt of DATE_FORMATS) {
    const d = parseDate(s, fmt, new Date())
    if (isValidDate(d)) return formatDate(d, 'yyyy-MM-dd')
  }
  return null
}

/**
 * Convierte un string de importe a número.
 * Acepta formatos europeos (1.234,56) y americanos (1,234.56).
 * Mantiene el signo (negativo = gasto).
 */
export function tryParseAmount(value) {
  if (value == null) return null
  let s = String(value).trim()
  if (!s) return null

  // Quitar símbolo €, espacios, etc.
  s = s.replace(/[€$\s]/g, '')

  // Detectar formato
  const hasDot = s.includes('.')
  const hasComma = s.includes(',')
  if (hasDot && hasComma) {
    // El separador decimal es el último que aparece
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // formato europeo: 1.234,56
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // formato US: 1,234.56
      s = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    // Solo coma → asumimos decimal europeo
    s = s.replace(',', '.')
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/**
 * Heurística de detección de columnas a partir de los headers
 * y de las primeras filas. Devuelve los nombres de columna detectados
 * (no los índices) o null si no encuentra alguna.
 */
export function detectColumns(headers, rows) {
  const headersLow = headers.map((h) => h.toLowerCase())
  const sample = rows.slice(0, 8)

  // Patrones por tipo
  const datePatterns = /fecha|date|valor|f\.\s*operac|f\.\s*valor/i
  const amountPatterns = /importe|amount|cantidad|monto|movimiento/i
  // En España algunos bancos separan "haber/debe" — los soportamos como amount también
  const haberPatterns = /haber|ingreso|abono|cr[eé]dito/i
  const debePatterns = /debe|gasto|cargo|d[eé]bito/i
  const descPatterns = /concepto|descripc|detalle|operaci[oó]n|movimiento|texto|nombre/i

  function findByHeader(regex) {
    const idx = headersLow.findIndex((h) => regex.test(h))
    return idx >= 0 ? headers[idx] : null
  }

  function findByContent(testFn) {
    for (const h of headers) {
      const allValid = sample.every((r) => testFn(r[h]))
      const someValid = sample.some((r) => testFn(r[h]))
      if (allValid && someValid) return h
    }
    return null
  }

  let dateCol = findByHeader(datePatterns)
  if (!dateCol) dateCol = findByContent((v) => v && tryParseDate(v))

  let amountCol = findByHeader(amountPatterns)
  if (!amountCol) amountCol = findByContent((v) => v && tryParseAmount(v) !== null)

  let haberCol = findByHeader(haberPatterns)
  let debeCol = findByHeader(debePatterns)

  let descCol = findByHeader(descPatterns)
  if (!descCol) {
    // fallback: la columna de texto más larga en promedio
    let bestLen = 0
    for (const h of headers) {
      if (h === dateCol || h === amountCol || h === haberCol || h === debeCol) continue
      const avg =
        sample.reduce((acc, r) => acc + String(r[h] ?? '').length, 0) /
        Math.max(1, sample.length)
      if (avg > bestLen) {
        bestLen = avg
        descCol = h
      }
    }
  }

  return { dateCol, amountCol, haberCol, debeCol, descCol }
}

/**
 * Convierte las filas de CSV en movimientos listos para mostrar en la preview.
 * Cada movimiento: { id (local), type, amount, description, occurred_on, raw }
 */
export function rowsToTransactions(rows, mapping) {
  const out = []
  let counter = 0

  for (const row of rows) {
    const dateRaw = mapping.dateCol ? row[mapping.dateCol] : null
    const occurred_on = tryParseDate(dateRaw)
    if (!occurred_on) continue

    let amount = null
    let type = 'expense'

    if (mapping.amountCol) {
      const n = tryParseAmount(row[mapping.amountCol])
      if (n != null) {
        amount = Math.abs(n)
        type = n >= 0 ? 'income' : 'expense'
      }
    } else if (mapping.haberCol || mapping.debeCol) {
      const haber = mapping.haberCol ? tryParseAmount(row[mapping.haberCol]) : null
      const debe = mapping.debeCol ? tryParseAmount(row[mapping.debeCol]) : null
      if (haber && haber > 0) {
        amount = haber
        type = 'income'
      } else if (debe && debe !== 0) {
        amount = Math.abs(debe)
        type = 'expense'
      }
    }

    if (amount == null || amount <= 0) continue

    const description = mapping.descCol
      ? String(row[mapping.descCol] ?? '').trim()
      : ''

    counter += 1
    out.push({
      _id: `csv-${counter}`,
      type,
      amount,
      description,
      occurred_on,
      raw: row,
    })
  }

  return out
}
