import { Link } from 'react-router-dom'
import { ChevronRight, Tags, LogOut, Upload, MessageCircle, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useSession } from '../hooks/useSession.js'
import { useOnboarding } from '../hooks/useOnboarding.jsx'
import NotificationsToggle from '../components/settings/NotificationsToggle.jsx'

export default function Settings() {
  const { user } = useSession()
  const { replay: replayOnboarding } = useOnboarding()

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

      <NotificationsToggle />

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
        <li className="border-t border-white/5">
          <Link
            to="/importar"
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5"
          >
            <Upload size={18} className="text-white/60" />
            <span className="flex-1 text-sm text-white">Importar desde CSV</span>
            <ChevronRight size={16} className="text-white/40" />
          </Link>
        </li>
        <li className="border-t border-white/5">
          <Link
            to="/feedback"
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5"
          >
            <MessageCircle size={18} className="text-white/60" />
            <span className="flex-1 text-sm text-white">Sugerencias y fallos</span>
            <ChevronRight size={16} className="text-white/40" />
          </Link>
        </li>
        <li className="border-t border-white/5">
          <button
            type="button"
            onClick={replayOnboarding}
            className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5"
          >
            <BookOpen size={18} className="text-white/60" />
            <span className="flex-1 text-left text-sm text-white">Ver tutorial de la app</span>
            <ChevronRight size={16} className="text-white/40" />
          </button>
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
