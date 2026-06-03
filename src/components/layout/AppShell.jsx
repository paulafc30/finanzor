import { Outlet, Link, useLocation } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
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
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/5 bg-bg-base/80 px-2 py-2 backdrop-blur sm:px-4 sm:py-3">
        {showMonthSwitcher ? (
          <MonthSwitcher />
        ) : (
          <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <img
              src="/favicon.ico?v=2"
              alt=""
              aria-hidden="true"
              className="h-6 w-6 rounded-md"
            />
            Finanzor
          </span>
        )}
        <Link
          to="/ajustes"
          aria-label="Ajustes"
          className="shrink-0 rounded-full p-1.5 hover:bg-white/5 sm:p-2"
        >
          <SettingsIcon size={22} />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 pb-24 pt-4 sm:px-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
