import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle2, Upload as UploadIcon } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import FileUploader from '../components/import/FileUploader.jsx'
import ColumnMapper from '../components/import/ColumnMapper.jsx'
import ImportPreviewTable from '../components/import/ImportPreviewTable.jsx'
import { useCategories } from '../hooks/useCategories.js'
import { useBulkImportTransactions } from '../hooks/useBulkImportTransactions.js'
import {
  parseCsvFile,
  detectColumns,
  rowsToTransactions,
} from '../lib/csvParser.js'
import { suggestCategoryByDescription } from '../lib/categoryRules.js'
import { formatEuro } from '../lib/formatters.js'

/**
 * Flujo de importación de movimientos desde CSV.
 *
 * Estados:
 *  - 'upload'  → pantalla de subida
 *  - 'mapping' → mostrando mapeo de columnas + preview
 *  - 'done'    → importación completada
 */
export default function ImportPage() {
  const { data: categories = [] } = useCategories()
  const importMutation = useBulkImportTransactions()

  const [step, setStep] = useState('upload')
  const [csv, setCsv] = useState(null) // { headers, rows }
  const [mapping, setMapping] = useState({
    dateCol: null,
    amountCol: null,
    haberCol: null,
    debeCol: null,
    descCol: null,
  })
  const [items, setItems] = useState([]) // movimientos a importar (editables)
  const [error, setError] = useState(null)
  const [importedCount, setImportedCount] = useState(0)

  // Mapa nombre→id de categorías para resolver al final
  const categoryIdByName = useMemo(() => {
    const map = new Map()
    for (const c of categories) map.set(c.name, c.id)
    return map
  }, [categories])

  function applyAutoCategorization(transactions) {
    return transactions.map((it) => {
      if (it.category_id) return it
      // Solo sugerimos categoría a gastos. A ingresos, sin categoría.
      if (it.type !== 'expense') return it
      const suggested = suggestCategoryByDescription(it.description)
      if (suggested) {
        const id = categoryIdByName.get(suggested)
        if (id) return { ...it, category_id: id }
      }
      // Por defecto, asignar "Otros"
      const otrosId = categoryIdByName.get('Otros')
      return { ...it, category_id: otrosId ?? null }
    })
  }

  async function handleFile(file) {
    setError(null)
    try {
      const parsed = await parseCsvFile(file)
      if (!parsed.headers || parsed.headers.length === 0) {
        throw new Error('No se han detectado columnas. ¿El archivo tiene cabeceras?')
      }
      if (parsed.rows.length === 0) {
        throw new Error('El archivo no contiene filas de datos.')
      }

      const detected = detectColumns(parsed.headers, parsed.rows)
      const initialMapping = {
        dateCol: detected.dateCol,
        amountCol: detected.amountCol,
        haberCol: detected.haberCol,
        debeCol: detected.debeCol,
        descCol: detected.descCol,
      }

      const initialItems = applyAutoCategorization(
        rowsToTransactions(parsed.rows, initialMapping),
      )

      setCsv(parsed)
      setMapping(initialMapping)
      setItems(initialItems)
      setStep('mapping')
    } catch (err) {
      setError(err.message ?? 'Error al leer el archivo')
    }
  }

  function handleMappingChange(newMapping) {
    setMapping(newMapping)
    if (csv) {
      const refreshed = applyAutoCategorization(
        rowsToTransactions(csv.rows, newMapping),
      )
      setItems(refreshed)
    }
  }

  function handleItemsChange(newItems) {
    setItems(newItems)
  }

  async function handleImport() {
    setError(null)
    try {
      const res = await importMutation.mutateAsync(items)
      setImportedCount(res?.inserted ?? 0)
      setStep('done')
    } catch (err) {
      setError(err.message ?? 'No se pudo importar')
    }
  }

  function reset() {
    setStep('upload')
    setCsv(null)
    setItems([])
    setError(null)
    setImportedCount(0)
  }

  // Totales para mostrar arriba en la preview
  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const it of items) {
      if (it.type === 'income') income += Number(it.amount)
      else expense += Number(it.amount)
    }
    return { income, expense, count: items.length }
  }, [items])

  const mappingValid = mapping.dateCol && (mapping.amountCol || mapping.haberCol || mapping.debeCol)

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/ajustes"
          className="rounded-full p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
          aria-label="Volver a ajustes"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold">Importar movimientos</h1>
      </div>

      {step === 'upload' && (
        <>
          <p className="text-sm text-white/60">
            Sube un CSV con tus movimientos bancarios. Detectamos automáticamente
            las columnas y categorizamos los gastos según el comercio (Mercadona →
            Comida, Repsol → Transporte, etc.). Antes de importar nada, revisas y
            editas todo lo que quieras.
          </p>

          <FileUploader onFile={handleFile} />

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-sm text-white ring-1 ring-danger/20">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
              <p className="flex-1">{error}</p>
            </div>
          )}
        </>
      )}

      {step === 'mapping' && (
        <>
          {/* Resumen totales */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-bg-elevated p-3 text-center text-xs ring-1 ring-white/5">
            <div>
              <p className="text-white/50">Filas</p>
              <p className="mt-0.5 font-semibold text-white tabular-nums">
                {totals.count}
              </p>
            </div>
            <div>
              <p className="text-white/50">Ingresos</p>
              <p className="mt-0.5 font-semibold text-success tabular-nums">
                {formatEuro(totals.income)}
              </p>
            </div>
            <div>
              <p className="text-white/50">Gastos</p>
              <p className="mt-0.5 font-semibold text-danger tabular-nums">
                {formatEuro(totals.expense)}
              </p>
            </div>
          </div>

          {/* Mapeo de columnas (siempre visible para que el usuario pueda corregir) */}
          <ColumnMapper
            headers={csv.headers}
            mapping={mapping}
            onChange={handleMappingChange}
          />

          {!mappingValid && (
            <div className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-white ring-1 ring-warning/20">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
              <p className="flex-1">
                Necesitas asignar la columna de <strong>Fecha</strong> y al menos
                una columna de importe (Importe, o Haber/Debe) para continuar.
              </p>
            </div>
          )}

          {/* Preview editable */}
          {mappingValid && (
            <>
              <div>
                <h2 className="mb-2 text-sm font-semibold text-white">
                  Revisa y edita antes de importar
                </h2>
                <ImportPreviewTable
                  items={items}
                  categories={categories}
                  onChange={handleItemsChange}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-sm text-white ring-1 ring-danger/20">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
                  <p className="flex-1">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={reset}
                  disabled={importMutation.isPending}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={items.length === 0 || importMutation.isPending}
                  className="flex-1"
                >
                  <UploadIcon size={16} />
                  {importMutation.isPending
                    ? 'Importando…'
                    : `Importar ${items.length} movimientos`}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-success/10 p-8 text-center ring-1 ring-success/20">
          <div className="rounded-full bg-success/20 p-3">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            ¡Importación completada!
          </h2>
          <p className="text-sm text-white/70">
            Se han añadido <strong>{importedCount}</strong> movimientos a tu cuenta.
            Repártense por sus fechas reales en el calendario.
          </p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={reset}>
              Importar otro CSV
            </Button>
            <Link to="/">
              <Button>Ver Inicio</Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
