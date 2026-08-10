import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
const SLIDE_ICONS = [Wallet, Plus, PieChart, Wallet, Repeat, PiggyBank, CalendarIcon, CheckCircle2]
const SLIDE_COLORS = ['danger', 'success', 'info', 'warning', 'accent', 'success', 'info', 'success']

const colorMap = {
  success: { bg: 'bg-success', tint: 'bg-success/15', text: 'text-success' },
  danger: { bg: 'bg-danger', tint: 'bg-danger/15', text: 'text-danger' },
  warning: { bg: 'bg-warning', tint: 'bg-warning/15', text: 'text-warning' },
  info: { bg: 'bg-info', tint: 'bg-info/15', text: 'text-info' },
  accent: { bg: 'bg-accent', tint: 'bg-accent/15', text: 'text-accent' },
}

export default function Onboarding({ open, onComplete }) {
  const { t } = useTranslation('onboarding')
  const rawSlides = t('slides', { returnObjects: true })
  const SLIDES = (Array.isArray(rawSlides) ? rawSlides : []).map((slide, i) => ({
    ...slide,
    icon: SLIDE_ICONS[i],
    color: SLIDE_COLORS[i],
  }))
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
      aria-label={t('dialogLabel')}
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
          aria-label={t('skipAria')}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white"
        >
          {t('skip')}
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
              aria-label={t('stepAria', { step: i + 1 })}
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
            {t('back')}
          </Button>

          <span className="text-[11px] text-white/40">
            {index + 1} / {total}
          </span>

          {isLast ? (
            <Button type="button" onClick={onComplete} size="sm">
              {t('start')}
              <CheckCircle2 size={16} />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            >
              {t('next')}
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
