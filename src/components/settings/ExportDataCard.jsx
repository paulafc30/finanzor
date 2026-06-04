import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useSession } from '../../hooks/useSession.js'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

function pad(n) {
  return String(n).padStart(2, '0')
}

function buildRange(mode, state) {
  if (mode === 'dias') {
    return { from: state.dateFrom, to: state.dateTo }
  }
  if (mode === 'meses') {
    const from = `${state.yearFrom}-${pad(state.monthFrom + 1)}-01`
    // último día del mes "to"
    const lastDay = new Date(state.yearTo, state.monthTo + 1, 0).getDate()
    const to = `${state.yearTo}-${pad(state.monthTo + 1)}-${pad(lastDay)}`
    return { from, to }
  }
  // año
  return {
    from: `${state.year}-01-01`,
    to: `${state.year}-12-31`,
  }
}

function toCsv(rows) {
  const header = ['Fecha', 'Tipo', 'Importe', 'Categoría', 'Descripción']
  const lines = rows.map((r) => [
    r.occurred_on,
    r.type === 'income' ? 'Ingreso' : 'Gasto',
    r.amount.toFixed(2),
    r.category?.name ?? '',
    r.description ?? '',
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
  return [header.join(','), ...lines].join('\n')
}

function downloadCsv(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExportDataCard() {
  const { user } = useSession()
  const [mode, setMode] = useState('meses') // 'dias' | 'meses' | 'año'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const today = new Date()

  const [state, setState] = useState({
    // días
    dateFrom: `${today.getFullYear()}-01-01`,
    dateTo: today.toISOString().slice(0, 10),
    // meses
    monthFrom: 0,
    yearFrom: today.getFullYear(),
    monthTo: today.getMonth(),
    yearTo: today.getFullYear(),
    // año
    year: today.getFullYear(),
  })

  function set(key, value) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  async function handleExport() {
    setError(null)
    setLoading(true)
    try {
      const { from, to } = buildRange(mode, state)

      if (from > to) {
        setError('La fecha de inicio no puede ser posterior a la final.')
        setLoading(false)
        return
      }

      const { data, error: err } = await supabase
        .from('transactions')
        .select(`
          occurred_on,
          type,
          amount,
          description,
          category:categories(name)
        `)
        .eq('user_id', user.id)
        .gte('occurred_on', from)
        .lte('occurred_on', to)
        .order('occurred_on', { ascending: true })

      if (err) throw err
      if (!data || data.length === 0) {
        setError('No hay datos en el rango seleccionado.')
        setLoading(false)
        return
      }

      const csv = toCsv(data)
      downloadCsv(csv, `finanzor_${from}_${to}.csv`)
    } catch (e) {
      setError('Error al exportar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl bg-bg-elevated p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Download size={16} className="text-white/60" />
        <span className="text-sm font-medium text-white">Exportar datos</span>
      </div>

      {/* Selector de modo */}
      <div className="flex rounded-lg bg-white/5 p-0.5">
        {[
          { id: 'dias', label: 'Días' },
          { id: 'meses', label: 'Meses' },
          { id: 'año', label: 'Año' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              mode === id
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Controles según modo */}
      {mode === 'dias' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-xs text-white/50">Desde</span>
            <input
              type="date"
              value={state.dateFrom}
              onChange={(e) => set('dateFrom', e.target.value)}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/50">Hasta</span>
            <input
              type="date"
              value={state.dateTo}
              onChange={(e) => set('dateTo', e.target.value)}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]"
            />
          </label>
        </div>
      )}

      {mode === 'meses' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-white/50">Desde</span>
            <select
              value={state.monthFrom}
              onChange={(e) => set('monthFrom', Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 px-2 py-2 text-sm text-white"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i} className="bg-gray-900">{m}</option>
              ))}
            </select>
            <select
              value={state.yearFrom}
              onChange={(e) => set('yearFrom', Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 px-2 py-2 text-sm text-white"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-gray-900">{y}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-white/50">Hasta</span>
            <select
              value={state.monthTo}
              onChange={(e) => set('monthTo', Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 px-2 py-2 text-sm text-white"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i} className="bg-gray-900">{m}</option>
              ))}
            </select>
            <select
              value={state.yearTo}
              onChange={(e) => set('yearTo', Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 px-2 py-2 text-sm text-white"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-gray-900">{y}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {mode === 'año' && (
        <div className="space-y-1">
          <span className="text-xs text-white/50">Año</span>
          <select
            value={state.year}
            onChange={(e) => set('year', Number(e.target.value))}
            className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
          >
            {YEARS.map((y) => (
              <option key={y} value={y} className="bg-gray-900">{y}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Download size={15} />
        )}
        {loading ? 'Exportando…' : 'Exportar CSV'}
      </button>
    </div>
  )
}
