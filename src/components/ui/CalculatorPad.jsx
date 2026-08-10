import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Delete, X } from 'lucide-react'

/**
 * Mini-calculadora estilo iOS para introducir importes desde el formulario
 * de movimientos.
 *
 * Soporta +, −, ×, ÷ con dos operandos (no acumula precedencia: cada vez
 * que se pulsa un operador, si ya había uno pendiente, se evalúa antes).
 *
 * Props:
 *  - open: bool
 *  - initialValue: string|number — valor con el que arranca el display
 *  - onAccept(numero): se llama al pulsar "Aceptar" con el resultado
 *  - onClose(): cerrar sin aceptar
 */
export default function CalculatorPad({ open, initialValue = '', onAccept, onClose }) {
  const { t } = useTranslation('ui')
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [waitingNext, setWaitingNext] = useState(false)

  // Reiniciar al abrir
  useEffect(() => {
    if (!open) return
    const init = sanitizeIncoming(initialValue)
    setDisplay(init === '' ? '0' : init)
    setPrev(null)
    setOp(null)
    setWaitingNext(false)
  }, [open, initialValue])

  // Cierre con ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function pushDigit(d) {
    setDisplay((cur) => {
      if (waitingNext) {
        setWaitingNext(false)
        return d
      }
      if (cur === '0') return d
      // máximo 12 caracteres para no romper visualmente
      if (cur.length >= 12) return cur
      return cur + d
    })
  }

  function pushDot() {
    setDisplay((cur) => {
      if (waitingNext) {
        setWaitingNext(false)
        return '0,'
      }
      if (cur.includes(',')) return cur
      return cur + ','
    })
  }

  function backspace() {
    setDisplay((cur) => {
      if (waitingNext) return cur
      if (cur.length <= 1 || (cur.length === 2 && cur.startsWith('-'))) {
        return '0'
      }
      return cur.slice(0, -1)
    })
  }

  function clearAll() {
    setDisplay('0')
    setPrev(null)
    setOp(null)
    setWaitingNext(false)
  }

  function applyOperator(nextOp) {
    const current = parseDisplay(display)
    if (op != null && prev != null && !waitingNext) {
      const result = compute(prev, current, op)
      setPrev(result)
      setDisplay(formatNumber(result))
    } else {
      setPrev(current)
    }
    setOp(nextOp)
    setWaitingNext(true)
  }

  function equals() {
    if (op == null || prev == null) return
    const current = parseDisplay(display)
    const result = compute(prev, current, op)
    setDisplay(formatNumber(result))
    setPrev(null)
    setOp(null)
    setWaitingNext(true)
  }

  function accept() {
    // Si hay operación pendiente, evaluamos primero
    let final
    if (op != null && prev != null && !waitingNext) {
      final = compute(prev, parseDisplay(display), op)
    } else {
      final = parseDisplay(display)
    }
    // Redondeo a 2 decimales para importes
    final = Math.round(final * 100) / 100
    if (!Number.isFinite(final) || final < 0) {
      onClose?.()
      return
    }
    onAccept?.(final)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('calculator.dialogLabel')}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="w-full max-w-sm rounded-t-2xl bg-bg-elevated p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{t('calculator.title')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('calculator.close')}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Display */}
        <div className="mb-3 min-h-[64px] rounded-xl bg-bg-card px-4 py-3 ring-1 ring-white/5">
          <div className="text-right text-xs text-white/40 tabular-nums">
            {prev != null && op
              ? `${formatNumber(prev)} ${opLabel(op)}`
              : ' '}
          </div>
          <div className="text-right text-3xl font-semibold tabular-nums text-white">
            {display}
          </div>
        </div>

        {/* Teclado: 4x5 */}
        <div className="grid grid-cols-4 gap-2">
          <KeyBtn variant="util" onClick={clearAll}>{t('calculator.clear')}</KeyBtn>
          <KeyBtn variant="util" onClick={backspace} aria-label={t('calculator.backspace')}>
            <Delete size={18} />
          </KeyBtn>
          <KeyBtn variant="op" active={op === '÷' && waitingNext} onClick={() => applyOperator('÷')}>÷</KeyBtn>
          <KeyBtn variant="op" active={op === '×' && waitingNext} onClick={() => applyOperator('×')}>×</KeyBtn>

          <KeyBtn onClick={() => pushDigit('7')}>7</KeyBtn>
          <KeyBtn onClick={() => pushDigit('8')}>8</KeyBtn>
          <KeyBtn onClick={() => pushDigit('9')}>9</KeyBtn>
          <KeyBtn variant="op" active={op === '−' && waitingNext} onClick={() => applyOperator('−')}>−</KeyBtn>

          <KeyBtn onClick={() => pushDigit('4')}>4</KeyBtn>
          <KeyBtn onClick={() => pushDigit('5')}>5</KeyBtn>
          <KeyBtn onClick={() => pushDigit('6')}>6</KeyBtn>
          <KeyBtn variant="op" active={op === '+' && waitingNext} onClick={() => applyOperator('+')}>+</KeyBtn>

          <KeyBtn onClick={() => pushDigit('1')}>1</KeyBtn>
          <KeyBtn onClick={() => pushDigit('2')}>2</KeyBtn>
          <KeyBtn onClick={() => pushDigit('3')}>3</KeyBtn>
          <KeyBtn variant="op" onClick={equals}>=</KeyBtn>

          <KeyBtn className="col-span-2" onClick={() => pushDigit('0')}>0</KeyBtn>
          <KeyBtn onClick={pushDot}>,</KeyBtn>
          <KeyBtn variant="accent" onClick={accept}>{t('calculator.accept')}</KeyBtn>
        </div>
      </div>
    </div>
  )
}

function KeyBtn({ variant = 'digit', active = false, className = '', children, ...rest }) {
  const base =
    'flex items-center justify-center rounded-xl py-3 text-lg font-medium transition active:scale-[0.97]'
  const styles = {
    digit: 'bg-bg-card text-white hover:bg-white/10',
    op: active
      ? 'bg-accent text-white'
      : 'bg-bg-card text-accent hover:bg-white/10',
    util: 'bg-bg-card text-white/70 hover:bg-white/10',
    accent: 'bg-accent text-white hover:bg-accent/90',
  }
  return (
    <button
      type="button"
      className={[base, styles[variant] ?? styles.digit, className].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}

// ---------- helpers ----------

function sanitizeIncoming(v) {
  if (v == null) return ''
  // Aceptamos string o number, normalizamos a string con coma decimal
  const s = String(v).replace('.', ',').trim()
  if (s === '' || s === '0' || s === '0,00' || s === '0,0') return ''
  // sólo dígitos y una coma
  const clean = s.replace(/[^\d,]/g, '').replace(/,+/g, ',')
  // máximo 2 decimales
  const [ent, dec = ''] = clean.split(',')
  if (dec) return `${ent || '0'},${dec.slice(0, 2)}`
  return ent || ''
}

function parseDisplay(s) {
  if (s == null || s === '') return 0
  const n = parseFloat(String(s).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function compute(a, b, op) {
  switch (op) {
    case '+':
      return a + b
    case '−':
      return a - b
    case '×':
      return a * b
    case '÷':
      return b === 0 ? 0 : a / b
    default:
      return b
  }
}

function opLabel(op) {
  return op
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return '0'
  // hasta 6 decimales internamente, mostramos sin trailing zeros
  const rounded = Math.round(n * 1e6) / 1e6
  const s = String(rounded).replace('.', ',')
  // si tiene decimales, recortar a 4 visibles máximo
  if (s.includes(',')) {
    const [a, b] = s.split(',')
    return `${a},${b.slice(0, 4)}`
  }
  return s
}
