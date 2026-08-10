import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'

/**
 * Botón flotante (FAB) abajo a la derecha.
 * Posicionado para no chocar con la BottomNav (bottom-20).
 */
export default function Fab({ onClick, ariaLabel }) {
  const { t } = useTranslation('ui')
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? t('fab.add')}
      className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent-muted active:scale-95"
    >
      <Plus size={26} />
    </button>
  )
}
