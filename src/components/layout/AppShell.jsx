import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { UserCircle2 } from 'lucide-react'
import MonthSwitcher from './MonthSwitcher.jsx'
import BottomNav from './BottomNav.jsx'

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-bg-base/80 px-4 py-3 backdrop-blur">
        <MonthSwitcher />
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
