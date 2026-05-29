# ADR-0008 — UI en español, mobile-first, dark mode por defecto

**Estado:** Aceptado.
**Fecha:** Inicio del proyecto.

## Contexto

- Los usuarios son hispanohablantes (yo y mi familia).
- El uso principal es **el móvil**: anotar un gasto al salir del super, no
  abrir el portátil en casa.
- Voy a usarla a diario, principalmente de noche → modo oscuro reduce
  cansancio visual.

## Decisión

- **Idioma**: todo en español. Textos hardcoded en castellano, sin
  i18n. Mensajes de error de Supabase traducidos en `src/lib/authErrors.js`.
- **Mobile-first**: clases base de Tailwind pensadas para pantallas
  ≤ 380 px, breakpoints `sm:` añaden mejoras para tablet/desktop. Modales
  son **bottom-sheets** en móvil y centrados en `sm+`.
- **Dark mode por defecto**: `<html class="dark">` fijo. Sin toggle a tema
  claro (no aporta valor en una app personal).
- Tipografía: la default del sistema (`-apple-system, BlinkMacSystemFont,
  Segoe UI, Roboto…`), no cargamos Google Fonts.

## Consecuencias

✅ Sin i18n = menos código, menos archivos de traducción, sin librerías.
✅ Layout que funciona pulgar-friendly (FAB inferior, BottomNav, modales
   desde abajo).
✅ Cero peso de fuentes externas → arranque rápido.

❌ Si en el futuro hay que internacionalizar (Play Store con usuarios
   ingleses), hay que sustituir todos los literales. Aceptable: el
   propósito explícito del proyecto es uso personal.
❌ Sin tema claro: alguien que prefiera fondo claro no lo tiene.

## Disparadores para reabrir

- Distribución pública en Play Store con usuarios fuera de hispanohablantes.
- Petición de tema claro razonable de algún familiar.
