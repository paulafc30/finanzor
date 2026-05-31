# ADR-0008 — UI en español, mobile-first, dark mode por defecto + claro opcional

**Estado:** Aceptado. *Actualizado en mayo 2026: se añade tema claro como
opción del usuario (antes era dark-only).*
**Fecha:** Inicio del proyecto / revisado mayo 2026.

## Contexto

- Los usuarios son hispanohablantes (yo y mi familia).
- El uso principal es **el móvil**: anotar un gasto al salir del super, no
  abrir el portátil en casa.
- Yo prefiero modo oscuro por uso de noche; mi madre prefiere modo claro de
  día. Forzar uno solo no encaja.

## Decisión

- **Idioma**: todo en español. Textos hardcoded en castellano, sin
  i18n. Mensajes de error de Supabase traducidos en `src/lib/authErrors.js`.
- **Mobile-first**: clases base de Tailwind pensadas para pantallas
  ≤ 380 px, breakpoints `sm:` añaden mejoras para tablet/desktop. Modales
  son **bottom-sheets** en móvil y centrados en `sm+`.
- **Dark mode por defecto, claro opcional**:
  - Default = oscuro al primer arranque.
  - El usuario alterna desde Ajustes (`ThemeToggle` segmented control
    Claro / Oscuro).
  - La preferencia se persiste en `localStorage` bajo
    `finanzor-theme`.
  - Provider: `src/context/ThemeContext.jsx`. Aplica/quita la clase
    `.dark` al `<html>` y actualiza `<meta name="theme-color">` para que
    la barra del navegador en móviles combine con el fondo.
  - **Anti-flash**: un mini script en `index.html` aplica la clase
    `.dark` antes de que React monte, leyendo `localStorage` directamente.
- **Implementación de los estilos del tema claro**: variables CSS en
  `:root` (claro) y `.dark` (oscuro) más un bloque de overrides en
  `src/styles/index.css` que reescribe `text-white/N`, `bg-white/N`,
  `border-white/N`, `ring-white/N`, placeholders y overlays según el
  modo activo. Así no hay que duplicar `dark:` en cada componente.
- Tipografía: Inter + fallback del sistema. No cargamos Google Fonts
  bloqueantes.

## Consecuencias

✅ Sin i18n = menos código, menos archivos de traducción.
✅ Layout que funciona pulgar-friendly (FAB inferior, BottomNav, modales
   desde abajo).
✅ Tema claro disponible sin tocar cada componente: los overrides en
   `index.css` convierten las clases `*-white/N` al equivalente oscuro
   en modo claro.
✅ Sin flash al primer pintado gracias al script inline.

❌ Si en el futuro hay que internacionalizar (Play Store con usuarios fuera
   de hispanohablantes), hay que sustituir todos los literales.
❌ El sistema de overrides es funcional pero implícito: si se introducen
   nuevas opacidades (`text-white/35` por ejemplo), pueden hacer falta
   nuevas reglas en `index.css`. Documentar en `STYLE_GUIDE.md`.

## Aplicación

- `tailwind.config.js` — `darkMode: 'class'` + tokens `bg.base`,
  `bg.elevated`, `bg.card` via variables CSS.
- `src/styles/index.css` — variables y overrides de tema claro.
- `src/context/ThemeContext.jsx` — provider con `theme`, `toggleTheme`,
  `setTheme`.
- `src/hooks/useTheme.js` — re-export por consistencia con la convención
  de hooks.
- `src/components/settings/ThemeToggle.jsx` — segmented control en
  Ajustes.
- `index.html` — script anti-flash + meta theme-color que el provider
  actualiza dinámicamente.

## Disparadores para reabrir

- Distribución pública en Play Store con usuarios fuera de hispanohablantes.
- Aparición de un tercer tema (alto contraste / accesibilidad).
