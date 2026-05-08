import { Outlet, Link, useLocation } from 'react-router-dom'
import { UserCircle2 } from 'lucide-react'
import MonthSwitcher from './MonthSwitcher.jsx'
import BottomNav from './BottomNav.jsx'

// Rutas donde NO tiene sentido el selector de mes (ajustes, gestión de
// categorías, etc.) — son configuración, no datos del mes.
const HIDE_MONTH_SWITCHER_ON = ['/ajustes', '/categorias', '/importar', '/feedback']

export default function AppShell() {
  const location = useLocation()
  const showMonthSwitcher = !HIDE_MONTH_SWITCHER_ON.includes(location.pathname)

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-bg-base/80 px-4 py-3 backdrop-blur">
        {showMonthSwitcher ? (
          <MonthSwitcher />
        ) : (
          <span className="text-sm font-semibold text-white/80">Finanzor</span>
        )}
        <Link
          to="/ajustes"
          aria-label="Ajustes"
          className="rounded-full p-2 hover:bg-white/5"
        >
          <UserCircle2 size={22} />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
