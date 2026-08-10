import { useTranslation } from 'react-i18next'

/**
 * Cerdito de ahorros estilo outline, mirando hacia la derecha.
 *
 * Versión más fiel a la referencia: cuerpo redondo, hocico que sobresale
 * a la derecha con sus fositas, orejita arriba, ranura para monedas,
 * 4 patitas cortas y la cola en espiral atrás.
 *
 * Acepta dos modos:
 *  - Sin `amount` / `label`: dibuja el cerdito completo con la ranura.
 *  - Con `amount` / `label`: renderiza el importe dentro del cuerpo y
 *    oculta la ranura para que el dinero ocupe ese espacio.
 *
 * Hereda el color (`currentColor`) del contenedor para adaptarse al tema.
 */
export default function PiggyIcon({
  size = 24,
  amount = null,
  label = null,
  className = '',
  ...rest
}) {
  const { t } = useTranslation('savings')
  const hasContent = amount != null || label != null
  // Grosor proporcional: más fino a tamaño grande para que no quede tosco.
  const strokeWidth = size >= 120 ? 2 : 2.8

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * (84 / 110)}
      viewBox="0 0 110 84"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label={
        amount != null ? t('piggyWithAmount', { amount }) : t('piggyAlt')
      }
      {...rest}
    >
      {/* Cuerpo + hocico en un único path cerrado, dibujado en sentido
          horario desde el lateral izquierdo. */}
      <path
        d="M 8 46
           Q 8 18, 36 14
           L 52 12
           L 80 18
           Q 92 22, 94 32
           Q 105 32, 105 42
           Q 105 52, 94 52
           Q 90 60, 82 64
           Q 50 74, 20 64
           Q 8 58, 8 46 Z"
      />

      {/* Oreja: triangulito arriba */}
      <path d="M 54 14 L 63 5 L 70 17" />

      {/* Ranura para monedas en lo alto del cuerpo (oculta si hay
          importe dentro, así no compite visualmente con el texto). */}
      {!hasContent && <path d="M 30 24 L 60 24" />}

      {/* Ojo */}
      <circle cx="78" cy="32" r="1.4" fill="currentColor" stroke="none" />

      {/* Fositas del hocico */}
      <circle cx="99" cy="38" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="99" cy="44" r="1.1" fill="currentColor" stroke="none" />

      {/* 4 patitas cortas — rectángulos redondeados bajo el cuerpo */}
      <rect x="22" y="64" width="7" height="9" rx="1.5" />
      <rect x="38" y="68" width="7" height="7" rx="1.5" />
      <rect x="60" y="68" width="7" height="7" rx="1.5" />
      <rect x="76" y="64" width="7" height="9" rx="1.5" />

      {/* Cola en espiral atrás (lado izquierdo del cuerpo) */}
      <path
        d="M 8 38
           c -4 -2 -4 -7 0 -7
           c 2.5 0 2.5 4 0 4.5"
      />

      {/* Importe + etiqueta centrados dentro del cuerpo, evitando
          oreja y hocico. */}
      {amount != null && (
        <text
          x="46"
          y="40"
          textAnchor="middle"
          dominantBaseline="middle"
          stroke="none"
          fill="currentColor"
          fontSize="11"
          fontWeight="800"
          style={{ letterSpacing: '-0.4px' }}
        >
          {amount}
        </text>
      )}
      {label && (
        <text
          x="46"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          stroke="none"
          fill="currentColor"
          fontSize="4"
          fontWeight="700"
          letterSpacing="0.7"
          opacity="0.7"
        >
          {label}
        </text>
      )}
    </svg>
  )
}
