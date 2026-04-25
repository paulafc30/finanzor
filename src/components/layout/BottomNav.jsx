import { NavLink } from 'react-router-dom'
import { Home, ListOrdered, Calendar, PiggyBank, Wallet } from 'lucide-react'

const items = [
  { to: '/', icon: Home, label: 'Inicio', end: true },
  { to: '/movimientos', icon: ListOrdered, label: 'Movs.' },
  { to: '/calendario', icon: Calendar, label: 'Calendario' },
  { to: '/presupuesto', icon: Wallet, label: 'Presup.' },
  { to: '/ahorro', icon: PiggyBank, label: 'Ahorro' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-white/5 bg-bg-elevated/95 backdrop-blur">
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {items.map(({ to, icon: Icon, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-0.5 py-2.5 text-[11px]',
                  isActive ? 'text-accent' : 'text-white/60 hover:text-white',
                ].join(' ')
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
