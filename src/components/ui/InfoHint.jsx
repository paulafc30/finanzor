import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, ChevronDown } from 'lucide-react'

/**
 * Desplegable "¿Cómo funciona?" con icono de info. Va al final de una
 * tarjeta y explica de dónde sale lo que se ve. Cerrado por defecto.
 */
export default function InfoHint({ children, className = '' }) {
  const { t } = useTranslation('ui')
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white"
      >
        <Info size={13} />
        {t('infoHint.label')}
        <ChevronDown size={12} className={['transition-transform', open ? 'rotate-180' : ''].join(' ')} />
      </button>
      {open && (
        <p id={panelId} className="mt-2 rounded-lg bg-bg-card p-3 text-xs leading-relaxed text-white/70">
          {children}
        </p>
      )}
    </div>
  )
}
