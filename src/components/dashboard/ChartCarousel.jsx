import { useEffect, useRef, useState } from 'react'

/**
 * Carrusel horizontal por swipe (solo lo monta el padre en móvil, con
 * `lg:hidden`). Usa scroll-snap nativo: gestos táctiles gratis, sin
 * librerías nuevas. Los puntos reflejan el slide visible y también
 * permiten navegar con tap.
 */
export default function ChartCarousel({ children }) {
  const slides = Array.isArray(children) ? children.filter(Boolean) : [children]
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => {
      setActive(Math.round(el.scrollLeft / el.clientWidth))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (idx) => {
    trackRef.current?.scrollTo({ left: idx * trackRef.current.clientWidth, behavior: 'smooth' })
  }

  return (
    <div>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((child, idx) => (
          <div key={idx} className="w-full shrink-0 snap-center">
            {child}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => goTo(idx)}
              className={[
                'h-1.5 rounded-full transition-all',
                idx === active ? 'w-4 bg-accent' : 'w-1.5 bg-white/20',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
