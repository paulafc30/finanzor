import { NavLink } from 'react-router-dom'
import { Home, ListOrdered, Calendar, PiggyBank, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const items = [
  { to: '/', icon: Home, labelKey: 'bottomNav.home', end: true },
  { to: '/movimientos', icon: ListOrdered, labelKey: 'bottomNav.movements' },
  { to: '/calendario', icon: Calendar, labelKey: 'bottomNav.calendar' },
  { to: '/presupuesto', icon: Wallet, labelKey: 'bottomNav.budget' },
  { to: '/ahorro', icon: PiggyBank, labelKey: 'bottomNav.savings' },
]

export default function BottomNav() {
  const { t } = useTranslation('layout')

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-white/5 bg-bg-elevated/95 backdrop-blur">
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {items.map(({ to, icon: Icon, labelKey, end }) => (
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
              <span>{t(labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
