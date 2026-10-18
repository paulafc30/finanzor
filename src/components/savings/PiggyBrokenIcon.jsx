import { useTranslation } from 'react-i18next'

/**
 * Hucha de cerdito ROTA con monedas cayendo (animación de ~3,6 s).
 *
 * Mismo trazo y proporciones que `PiggyIcon`, pero el cuerpo se parte en
 * dos mitades por una grieta en zigzag que se separan, y las monedas caen
 * al suelo. El estado base de cada pieza es el FINAL de la animación, así
 * que con `prefers-reduced-motion` se ve directamente rota y quieta.
 *
 * El viewBox es más ancho que el de `PiggyIcon` (las mitades se abren hacia
 * los lados), por eso el ancho se escala con `size` para mantener el mismo
 * tamaño visual del cerdito.
 */
const CSS = `
.pgb-left{transform-origin:8px 60px;transform:translate(-9px,5px) rotate(-12deg);animation:pgb-left 3.6s ease-out both}
.pgb-right{transform-origin:105px 60px;transform:translate(9px,5px) rotate(10deg);animation:pgb-right 3.6s ease-out both}
.pgb-coin{transform:translate(var(--dx),var(--dy));animation:pgb-coin 3.6s ease-in both;animation-delay:var(--delay)}
@keyframes pgb-left{0%{transform:none}4%{transform:translate(-1px,0) rotate(-1.5deg)}8%{transform:translate(1px,0) rotate(1deg)}12%{transform:translate(-1px,0) rotate(-1deg)}16%{transform:none}30%{transform:translate(-9px,5px) rotate(-12deg)}100%{transform:translate(-9px,5px) rotate(-12deg)}}
@keyframes pgb-right{0%{transform:none}4%{transform:translate(1px,0) rotate(1.5deg)}8%{transform:translate(-1px,0) rotate(-1deg)}12%{transform:translate(1px,0) rotate(1deg)}16%{transform:none}30%{transform:translate(9px,5px) rotate(10deg)}100%{transform:translate(9px,5px) rotate(10deg)}}
@keyframes pgb-coin{0%{transform:translate(0,0);opacity:0}16%{transform:translate(0,0);opacity:0}18%{opacity:1}52%{transform:translate(var(--dx),var(--dy))}58%{transform:translate(var(--dx),calc(var(--dy) - 4px))}64%{transform:translate(var(--dx),var(--dy))}100%{transform:translate(var(--dx),var(--dy));opacity:1}}
@media (prefers-reduced-motion:reduce){.pgb-left,.pgb-right,.pgb-coin{animation:none}}
`

// dx/dy: dónde cae cada moneda (px del viewBox); delay: salida escalonada.
const COINS = [
  { dx: -16, dy: 34, delay: '0s' },
  { dx: -8, dy: 38, delay: '.08s' },
  { dx: -1, dy: 35, delay: '.16s' },
  { dx: 6, dy: 38, delay: '.05s' },
  { dx: 13, dy: 34, delay: '.12s' },
  { dx: 20, dy: 37, delay: '.2s' },
  { dx: -22, dy: 37, delay: '.14s' },
]

export default function PiggyBrokenIcon({ size = 24, className = '', ...rest }) {
  const { t } = useTranslation('savings')

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size * (138 / 110)}
      height={size * (92 / 110)}
      viewBox="-14 0 138 92"
      fill="none"
      stroke="currentColor"
      strokeWidth={size >= 120 ? 2 : 2.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label={t('piggyBrokenAlt')}
      {...rest}
    >
      <style>{CSS}</style>

      {/* Mitad izquierda: cola y dos patitas */}
      <g className="pgb-left">
        <path d="M 8 46 Q 8 18, 36 14 L 52 12 L 47 24 L 55 34 L 46 46 L 54 57 L 50.5 69 Q 35 69, 20 64 Q 8 58, 8 46 Z" />
        <rect x="22" y="64" width="7" height="9" rx="1.5" />
        <rect x="38" y="68" width="7" height="7" rx="1.5" />
        <path d="M 8 38 c -4 -2 -4 -7 0 -7 c 2.5 0 2.5 4 0 4.5" />
      </g>

      {/* Mitad derecha: oreja, ojo, hocico y dos patitas */}
      <g className="pgb-right">
        <path d="M 52 12 L 80 18 Q 92 22, 94 32 Q 105 32, 105 42 Q 105 52, 94 52 Q 90 60, 82 64 Q 66 69, 50.5 69 L 54 57 L 46 46 L 55 34 L 47 24 Z" />
        <path d="M 54 14 L 63 5 L 70 17" />
        <circle cx="78" cy="32" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="99" cy="38" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="99" cy="44" r="1.1" fill="currentColor" stroke="none" />
        <rect x="60" y="68" width="7" height="7" rx="1.5" />
        <rect x="76" y="64" width="7" height="9" rx="1.5" />
      </g>

      {/* Monedas que caen desde el interior */}
      {COINS.map((c, i) => (
        <g
          key={i}
          className="pgb-coin"
          style={{ '--dx': `${c.dx}px`, '--dy': `${c.dy}px`, '--delay': c.delay }}
        >
          <circle cx="50" cy="40" r="3.2" />
          <path d="M 48.6 40 h 2.8" />
        </g>
      ))}
    </svg>
  )
}
