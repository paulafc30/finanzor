import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

/**
 * Tarjeta en Ajustes para alternar entre tema claro y oscuro.
 *
 * Es un segmented control de dos opciones — mas claro y rapido que un
 * switch porque siempre se ve cual es el modo activo y el otro tiene
 * etiqueta visible.
 */
export default function ThemeToggle() {
  const ctx = useTheme()
  if (!ctx) return null
  const { theme, setTheme } = ctx

  return (
    <div className="rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15">
          {theme === 'dark' ? (
            <Moon size={16} className="text-accent" />
          ) : (
            <Sun size={16} className="text-accent" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">Apariencia</h3>
          <p className="text-[11px] text-white/50">
            {theme === 'dark'
              ? 'Modo oscuro activo'
              : 'Modo claro activo'}
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Tema claro u oscuro"
        className="grid grid-cols-2 gap-1 rounded-lg bg-bg-card p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={theme === 'light'}
          onClick={() => setTheme('light')}
          className={[
            'inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition',
            theme === 'light'
              ? 'bg-accent text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          <Sun size={14} />
          Claro
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={theme === 'dark'}
          onClick={() => setTheme('dark')}
          className={[
            'inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition',
            theme === 'dark'
              ? 'bg-accent text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          <Moon size={14} />
          Oscuro
        </button>
      </div>
    </div>
  )
}
