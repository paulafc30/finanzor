import { useState } from 'react'
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
 * El registro de auth.users no se borra: el usuario podria volver a
 * iniciar sesion con el mismo email, pero veria la app vacia.
 */
export default function DeleteAccountCard() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const del = useDeleteAccount()

  const canConfirm = confirm.trim().toUpperCase() === 'BORRAR'

  async function handleDelete() {
    if (!canConfirm) return
    setError(null)
    try {
      await del.mutateAsync()
      // No hace falta cerrar el modal: signOut desmonta toda la app y
      // RequireAuth redirige a /login.
    } catch (err) {
      setError(err.message ?? 'No se pudo eliminar la cuenta')
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
              Eliminar cuenta
            </h3>
            <p className="text-[11px] text-white/60">
              Borra todos tus movimientos, categorías, presupuestos, metas y
              gastos/ingresos fijos. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-medium text-white hover:bg-danger/90"
        >
          <Trash2 size={14} />
          Eliminar cuenta
        </button>
      </div>

      <Modal
        open={open}
        onClose={handleClose}
        title="¿Seguro que quieres eliminar tu cuenta?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-xs text-white/80 ring-1 ring-danger/20">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />
            <p>
              Se eliminarán <strong>todos</strong> tus datos: movimientos,
              categorías, presupuestos, metas, aportaciones, gastos fijos e
              ingresos fijos. Esta acción no se puede deshacer.
              <br />
              <br />
              Tu cuenta de inicio de sesión se mantiene; si quieres también
              borrar el acceso, hazlo desde el panel de Supabase.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              Escribe <span className="font-semibold text-danger">BORRAR</span> para confirmar
            </label>
            <input
              type="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="BORRAR"
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
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              disabled={!canConfirm || del.isPending}
            >
              {del.isPending ? 'Eliminando…' : 'Eliminar todo'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
