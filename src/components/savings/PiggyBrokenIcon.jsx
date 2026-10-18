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
.pgb-left{transform-origin:12px 60px;transform:translate(-9px,5px) rotate(-12deg);animation:pgb-left 3.6s ease-out both}
.pgb-right{transform-origin:105px 60px;transform:translate(9px,5px) rotate(10deg);animation:pgb-right 3.6s ease-out both}
.pgb-coin{transform:translate(var(--dx),var(--dy));animation:pgb-coin 3.6s ease-in both;animation-delay:var(--delay)}
@keyframes pgb-left{0%{transform:none}4%{transform:translate(-1px,0) rotate(-1.5deg)}8%{transform:translate(1px,0) rotate(1deg)}12%{transform:translate(-1px,0) rotate(-1deg)}16%{transform:none}30%{transform:translate(-9px,5px) rotate(-12deg)}100%{transform:translate(-9px,5px) rotate(-12deg)}}
@keyframes pgb-right{0%{transform:none}4%{transform:translate(1px,0) rotate(1.5deg)}8%{transform:translate(-1px,0) rotate(-1deg)}12%{transform:translate(1px,0) rotate(1deg)}16%{transform:none}30%{transform:translate(9px,5px) rotate(10deg)}100%{transform:translate(9px,5px) rotate(10deg)}}
@keyframes pgb-coin{0%{transform:translate(0,0);opacity:0}16%{transform:translate(0,0);opacity:0}18%{opacity:1}52%{transform:translate(var(--dx),var(--dy))}58%{transform:translate(var(--dx),calc(var(--dy) - 4px))}64%{transform:translate(var(--dx),var(--dy))}100%{transform:translate(var(--dx),var(--dy));opacity:1}}
@media (prefers-reduced-motion:reduce){.pgb-left,.pgb-right,.pgb-coin{animation:none}}
`

// dx/dy: dónde cae cada moneda (px del viewBox); delay: salida escalonada.
const COINS = [
  { dx: -26, dy: 45, delay: '.14s' },
  { dx: -17, dy: 42, delay: '0s' },
  { dx: -8, dy: 46, delay: '.08s' },
  { dx: 1, dy: 43, delay: '.16s' },
  { dx: 10, dy: 46, delay: '.05s' },
  { dx: 19, dy: 42, delay: '.12s' },
  { dx: 28, dy: 45, delay: '.2s' },
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
      strokeWidth={size >= 120 ? 2.2 : 3}
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
        <path d="M 12 44 C 12 27, 30 14, 52 14 L 47 25 L 56 35 L 47 46 L 56 57 L 52 68 C 30 68, 12 60, 12 44 Z" />
        <path d="M 23 64 L 23 72 Q 23 75.5, 26.5 75.5 L 28.5 75.5 Q 32 75.5, 32 72 L 32 67" />
        <path d="M 39 67.8 L 39 73 Q 39 76.5, 42.5 76.5 L 44.5 76.5 Q 48 76.5, 48 73 L 48 68" />
        <path d="M 12.4 42 C 6.5 42.6, 3.6 37.2, 6.2 33.8 C 8.4 31, 12.4 32.2, 11.8 35.2 C 11.4 37, 9.2 37.2, 8.9 35.6" />
      </g>

      {/* Mitad derecha: oreja, ojo, hocico y dos patitas */}
      <g className="pgb-right">
        <path d="M 52 14 C 68 14, 82 20, 89 30 C 92 31.5, 94 33, 96 34 L 101 34 Q 105 34, 105 41 Q 105 48, 101 48 L 96 48 C 94 50, 92 54, 88 58 C 80 66, 66 68, 52 68 L 56 57 L 47 46 L 56 35 L 47 25 Z" />
        <path d="M 62 67.6 L 62 73 Q 62 76.5, 65.5 76.5 L 67.5 76.5 Q 71 76.5, 71 73 L 71 67.5" />
        <path d="M 76 65 L 76 72 Q 76 75.5, 79.5 75.5 L 81.5 75.5 Q 85 75.5, 85 72 L 85 62" />
        <path d="M 66.5 15.6 Q 68 9.5, 72 8.6 Q 76 8.2, 77.6 12.4 L 80.8 20.4" />
        <circle cx="82" cy="31.5" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="101.2" cy="38" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="101.2" cy="44" r="1.1" fill="currentColor" stroke="none" />
      </g>

      {/* Monedas que caen desde el interior */}
      {COINS.map((c, i) => (
        <g
          key={i}
          className="pgb-coin"
          style={{ '--dx': `${c.dx}px`, '--dy': `${c.dy}px`, '--delay': c.delay }}
        >
          <circle cx="52" cy="40" r="3.2" />
          <path d="M 50.6 40 h 2.8" />
        </g>
      ))}
    </svg>
  )
}
