import { useTranslation } from 'react-i18next'

/**
 * Hucha de cerdito de trazo (outline), mirando hacia la derecha.
 *
 * Cuerpo redondeado de una sola curva continua con el hocico integrado,
 * oreja redondeada, cola en espiral, ojo y fositas, cuatro patitas que
 * nacen de la propia línea de la barriga, y una moneda a punto de caer
 * por la ranura.
 *
 * Dos modos:
 *  - Sin `amount` / `label`: dibuja el cerdito con la ranura abierta.
 *  - Con `amount` / `label`: escribe el importe dentro del cuerpo y oculta
 *    la ranura para que el dinero ocupe ese espacio.
 *
 * Hereda el color (`currentColor`) del contenedor para adaptarse al tema.
 * Las formas se comparten con `PiggyBrokenIcon` (mismo diseño, partido).
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
  const strokeWidth = size >= 120 ? 2.2 : 3

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
      {/* Cuerpo + hocico en un único contorno cerrado */}
      <path d="M 12 44 C 12 27, 30 14, 52 14 C 68 14, 82 20, 89 30 C 92 31.5, 94 33, 96 34 L 101 34 Q 105 34, 105 41 Q 105 48, 101 48 L 96 48 C 94 50, 92 54, 88 58 C 80 66, 66 68, 52 68 C 30 68, 12 60, 12 44 Z" />

      {/* Cuatro patitas redondeadas que salen de la barriga */}
      <path d="M 23 64 L 23 72 Q 23 75.5, 26.5 75.5 L 28.5 75.5 Q 32 75.5, 32 72 L 32 67" />
      <path d="M 39 67.8 L 39 73 Q 39 76.5, 42.5 76.5 L 44.5 76.5 Q 48 76.5, 48 73 L 48 68" />
      <path d="M 62 67.6 L 62 73 Q 62 76.5, 65.5 76.5 L 67.5 76.5 Q 71 76.5, 71 73 L 71 67.5" />
      <path d="M 76 65 L 76 72 Q 76 75.5, 79.5 75.5 L 81.5 75.5 Q 85 75.5, 85 72 L 85 62" />

      {/* Oreja redondeada */}
      <path d="M 66.5 15.6 Q 68 9.5, 72 8.6 Q 76 8.2, 77.6 12.4 L 80.8 20.4" />

      {/* Cola en espiral */}
      <path d="M 12.4 42 C 6.5 42.6, 3.6 37.2, 6.2 33.8 C 8.4 31, 12.4 32.2, 11.8 35.2 C 11.4 37, 9.2 37.2, 8.9 35.6" />

      {/* Ojo y fositas del hocico */}
      <circle cx="82" cy="31.5" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="101.2" cy="38" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="101.2" cy="44" r="1.1" fill="currentColor" stroke="none" />

      {/* Moneda sobre la ranura */}
      <circle cx="45" cy="7.2" r="5.2" />
      <circle cx="45" cy="7.2" r="2.4" />

      {/* Ranura (oculta si hay importe dentro, para no competir con el texto) */}
      {!hasContent && <path d="M 33 22 Q 45 19.5, 57 20.8" strokeWidth={strokeWidth + 0.8} />}

      {/* Importe + etiqueta centrados dentro del cuerpo */}
      {amount != null && (
        <text
          x="50"
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
          x="50"
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
