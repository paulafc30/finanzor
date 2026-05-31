// Re-export del hook real del tema, que vive en src/context/ThemeContext.jsx.
// Este archivo queda solo para que las importaciones desde
// `src/hooks/useTheme.js` sigan funcionando, manteniendo la convencion del
// resto de hooks.
export { useTheme, ThemeProvider } from '../context/ThemeContext.jsx'
