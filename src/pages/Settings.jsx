import { Link } from 'react-router-dom'
import { ChevronRight, Tags, LogOut } from 'lucide-react'
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

      <ul className="overflow-hidden rounded-xl bg-bg-elevated">
        <li>
          <Link
            to="/categorias"
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5"
          >
            <Tags size={18} className="text-white/60" />
            <span className="flex-1 text-sm text-white">Gestionar categorías</span>
            <ChevronRight size={16} className="text-white/40" />
          </Link>
        </li>
      </ul>

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-bg-elevated px-4 py-3 text-sm text-white hover:bg-bg-card"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>

      <p className="px-1 text-xs text-white/40">
        Próximamente: umbral de alertas, exportar datos, eliminar cuenta.
      </p>
    </section>
  )
}
