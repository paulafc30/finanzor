import { supabase } from '../lib/supabase.js'
import { useSession } from '../hooks/useSession.js'

export default function Settings() {
  const { user } = useSession()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Ajustes</h1>
      <div className="rounded-xl bg-bg-elevated p-4 text-sm">
        <p className="text-white/60">Sesión iniciada como</p>
        <p className="text-white">{user?.email ?? '—'}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg bg-bg-elevated px-4 py-2 text-sm text-white hover:bg-bg-card"
      >
        Cerrar sesión
      </button>
      <p className="text-xs text-white/40">
        Aquí irán también: gestión de categorías, color/icono por categoría,
        umbral de alertas, exportar datos, eliminar cuenta.
      </p>
    </section>
  )
}
