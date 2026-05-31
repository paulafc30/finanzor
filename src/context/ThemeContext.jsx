import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'finanzor-theme'
const ThemeContext = createContext()

/**
 * Provee el tema (`'dark' | 'light'`) a toda la app y lo persiste en
 * localStorage.
 *
 * Al montar:
 *  - Si hay un valor guardado, se respeta.
 *  - Si no, default = 'dark' (la app nacio dark-only; el claro es opcional).
 *
 * Se aplica la clase `.dark` al <html> para que Tailwind active los
 * overrides definidos en `src/styles/index.css`. Tambien actualiza el
 * <meta name="theme-color"> para que la barra del navegador en moviles
 * combine con el fondo.
 *
 * NOTA: en `index.html` hay un mini script que aplica la clase antes de
 * que React monte, para evitar el "flash" de tema incorrecto en el primer
 * pintado.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readStored())

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }

    // Actualiza la barra del navegador en moviles. Oscuro: mismo color de
    // fondo del logo (#0c0d12). Claro: blanco roto que casa con --bg-base.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0c0d12' : '#f4f6fb')
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const setThemeExplicit = (t) => {
    if (t === 'dark' || t === 'light') setTheme(t)
  }

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme: setThemeExplicit }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return 'dark'
}
