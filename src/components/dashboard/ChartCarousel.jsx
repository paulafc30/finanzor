import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Carrusel horizontal por swipe (solo lo monta el padre en móvil, con
 * `lg:hidden`). Usa scroll-snap nativo: gestos táctiles gratis, sin
 * librerías nuevas. Los puntos reflejan el slide visible y también
 * permiten navegar con tap.
 *
 * El alto del carrusel se ajusta al slide activo (no al más alto de
 * todos): por defecto un flex-row estira cada slide a la altura del
 * hermano más grande, y eso dejaba un hueco vacío debajo de tarjetas
 * más bajas (p. ej. el donut junto a la comparativa, mucho más alta).
 */
export default function ChartCarousel({ children }) {
  const slides = Array.isArray(children) ? children.filter(Boolean) : [children]
  const trackRef = useRef(null)
  const slideRefs = useRef([])
  const [active, setActive] = useState(0)
  const [trackHeight, setTrackHeight] = useState(null)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => {
      setActive(Math.round(el.scrollLeft / el.clientWidth))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Medimos el slide activo cada vez que cambia (o al montar, o si el
  // contenido cambia de tamaño, p.ej. al cargar datos) y aplicamos esa
  // altura al carril. Los demás slides quedan con su altura natural.
  useLayoutEffect(() => {
    const node = slideRefs.current[active]
    if (!node) return
    const measure = () => setTrackHeight(node.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [active, slides.length])

  const goTo = (idx) => {
    trackRef.current?.scrollTo({ left: idx * trackRef.current.clientWidth, behavior: 'smooth' })
  }

  return (
    <div>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth transition-[height] duration-200 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={trackHeight ? { height: trackHeight } : undefined}
      >
        {slides.map((child, idx) => (
          <div
            key={idx}
            ref={(node) => { slideRefs.current[idx] = node }}
            className="h-fit w-full shrink-0 snap-center"
          >
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
