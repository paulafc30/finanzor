import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { useDeleteAccount } from '../../hooks/useDeleteAccount.js'

/**
 * Tarjeta destructiva en Ajustes para borrar todos los datos del usuario.
 *
 * Doble confirmacion para evitar accidentes:
 *  1. Pulsar el boton rojo "Eliminar cuenta" abre un modal.
 *  2. Dentro del modal hay que escribir literalmente "BORRAR" para
 *     habilitar el boton final.
 *
 * Borra tambien el registro de auth.users (via Edge Function con
 * service_role): el usuario no puede volver a iniciar sesion con el mismo
 * email/Google despues de esto.
 */
export default function DeleteAccountCard() {
  const { t } = useTranslation('settings')
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const del = useDeleteAccount()

  const confirmWord = t('deleteAccount.confirmWord')
  const canConfirm = confirm.trim().toUpperCase() === confirmWord.toUpperCase()

  async function handleDelete() {
    if (!canConfirm) return
    setError(null)
    try {
      await del.mutateAsync()
      // No hace falta cerrar el modal: signOut desmonta toda la app y
      // RequireAuth redirige a /login.
    } catch (err) {
      setError(err.message ?? t('deleteAccount.errorFallback'))
    }
  }

  function handleClose() {
    if (del.isPending) return
    setOpen(false)
    setConfirm('')
    setError(null)
  }

  return (
    <>
      <div className="rounded-xl bg-danger/10 p-4 ring-1 ring-danger/20">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-danger">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white">
              {t('deleteAccount.title')}
            </h3>
            <p className="text-[11px] text-white/60">
              {t('deleteAccount.description')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-medium text-white hover:bg-danger/90"
        >
          <Trash2 size={14} />
          {t('deleteAccount.button')}
        </button>
      </div>

      <Modal
        open={open}
        onClose={handleClose}
        title={t('deleteAccount.confirmTitle')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-xs text-white/80 ring-1 ring-danger/20">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />
            <p>
              {t('deleteAccount.warningBefore')} <strong>{t('deleteAccount.warningAll')}</strong>{' '}
              {t('deleteAccount.warningAfter')}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              {t('deleteAccount.typeToConfirmBefore')}{' '}
              <span className="font-semibold text-danger">{confirmWord}</span>{' '}
              {t('deleteAccount.typeToConfirmAfter')}
            </label>
            <input
              type="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={confirmWord}
              disabled={del.isPending}
              className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-danger disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-danger/10 p-2 text-xs text-danger">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={del.isPending}
            >
              {t('deleteAccount.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              disabled={!canConfirm || del.isPending}
            >
              {del.isPending ? t('deleteAccount.deleting') : t('deleteAccount.confirmButton')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
