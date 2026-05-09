import { useEffect, useRef, useState } from 'react'
import {
  Wallet,
  Plus,
  PieChart,
  Repeat,
  PiggyBank,
  Calendar as CalendarIcon,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Button from '../ui/Button.jsx'

/**
 * Onboarding tipo "tour de bienvenida" — el típico carrusel de slides
 * que ves al abrir una app por primera vez.
 *
 * Cada slide tiene un icono grande, título y descripción. El usuario navega
 * con flechas o swipe. Indicadores de progreso abajo. Botón "Saltar" arriba.
 *
 * Llama a onComplete() cuando se termina o se salta.
 */
const SLIDES = [
  {
    icon: Wallet,
    color: 'danger',
    title: 'Bienvenido a Finanzor',
    body: 'Tu app personal para llevar control mes a mes de tus ingresos, gastos y ahorros. Sencilla, visual y diseñada para usar a diario.',
  },
  {
    icon: Plus,
    color: 'success',
    title: 'Registra tus movimientos',
    body: 'Pulsa el botón + de Inicio o Movimientos para añadir un ingreso o gasto. Categoría, importe, fecha — listo en segundos.',
  },
  {
    icon: PieChart,
    color: 'info',
    title: 'Ve dónde se va tu dinero',
    body: 'El Dashboard te muestra ingresos, gastos y saldo actual del mes, además de un gráfico circular con el reparto por categoría.',
  },
  {
    icon: Wallet,
    color: 'warning',
    title: 'Define tu presupuesto',
    body: 'Pon un límite por categoría. La barra se vuelve amarilla al 70% y roja al 90% para avisarte de que estás cerca del tope.',
  },
  {
    icon: Repeat,
    color: 'accent',
    title: 'Automatiza gastos fijos',
    body: 'Alquiler, gimnasio, Netflix... Configúralos una vez con el día del mes y se generan solos cada mes. Pausa o elimina cuando quieras.',
  },
  {
    icon: PiggyBank,
    color: 'success',
    title: 'Ahorra para tus metas',
    body: 'Crea metas (vacaciones, fondo de emergencia, una compra) y aporta poco a poco. La barra te muestra cuánto te falta.',
  },
  {
    icon: CalendarIcon,
    color: 'info',
    title: 'Navega entre meses',
    body: 'Usa las flechas del header para ir a meses anteriores o futuros. Los datos siempre se ordenan por la fecha real del movimiento.',
  },
  {
    icon: CheckCircle2,
    color: 'success',
    title: '¡Todo listo!',
    body: 'Empieza por añadir tu primer movimiento desde el botón + en Inicio. Si en algún momento quieres ver este tutorial otra vez, está en Ajustes.',
  },
]

const colorMap = {
  success: { bg: 'bg-success', tint: 'bg-success/15', text: 'text-success' },
  danger: { bg: 'bg-danger', tint: 'bg-danger/15', text: 'text-danger' },
  warning: { bg: 'bg-warning', tint: 'bg-warning/15', text: 'text-warning' },
  info: { bg: 'bg-info', tint: 'bg-info/15', text: 'text-info' },
  accent: { bg: 'bg-accent', tint: 'bg-accent/15', text: 'text-accent' },
}

export default function Onboarding({ open, onComplete }) {
  const [index, setIndex] = useState(0)
  const total = SLIDES.length
  const isLast = index === total - 1
  const isFirst = index === 0

  // Reset al abrirse
  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onComplete?.()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(total - 1, i + 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onComplete, total])

  // Swipe horizontal en móvil
  const touchStartX = useRef(null)
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  function handleTouchEnd(e) {
    if (touchStartX.current == null) return
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const dx = endX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return
    if (dx < 0) setIndex((i) => Math.min(total - 1, i + 1))
    else setIndex((i) => Math.max(0, i - 1))
  }

  if (!open) return null

  const slide = SLIDES[index]
  const Icon = slide.icon
  const colors = colorMap[slide.color] ?? colorMap.accent

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de Finanzor"
    >
      <div
        className="relative flex h-full w-full flex-col bg-bg-base sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Botón saltar arriba a la derecha */}
        <button
          type="button"
          onClick={onComplete}
          aria-label="Saltar tutorial"
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white"
        >
          Saltar
          <X size={12} />
        </button>

        {/* Contenido del slide */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center sm:py-10">
          <div
            className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full ${colors.tint}`}
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${colors.bg} shadow-lg`}
            >
              <Icon size={32} className="text-white" />
            </div>
          </div>

          <h2 className={`mb-3 text-2xl font-bold ${colors.text}`}>
            {slide.title}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-white/70">
            {slide.body}
          </p>
        </div>

        {/* Indicadores de progreso */}
        <div className="flex items-center justify-center gap-1.5 px-6 pb-3">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir al paso ${i + 1}`}
              className={[
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-6 bg-accent' : 'w-1.5 bg-white/20 hover:bg-white/40',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Navegación inferior */}
        <div className="flex items-center justify-between gap-2 px-6 pb-6 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className={isFirst ? 'invisible' : ''}
          >
            <ChevronLeft size={16} />
            Atrás
          </Button>

          <span className="text-[11px] text-white/40">
            {index + 1} / {total}
          </span>

          {isLast ? (
            <Button type="button" onClick={onComplete} size="sm">
              Comenzar
              <CheckCircle2 size={16} />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            >
              Siguiente
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
