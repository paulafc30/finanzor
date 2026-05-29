# Architecture Decision Records

Cada archivo numerado registra **una decisión técnica importante** del proyecto.
El formato es el clásico de Michael Nygard, simplificado:

- **Contexto** — qué problema o disyuntiva había.
- **Decisión** — qué se eligió.
- **Consecuencias** — qué implica (bueno y malo).

Si vas a tomar una decisión nueva que cambia algo aquí, **no edites el ADR
existente**: crea uno nuevo con un número mayor y marca el anterior como
"Reemplazado por ADR-XXXX".

## Índice

- [ADR-0001 — Stack: React + Vite + Supabase + Vercel](0001-stack-react-vite-supabase-vercel.md)
- [ADR-0002 — JavaScript en vez de TypeScript](0002-javascript-en-vez-de-typescript.md)
- [ADR-0003 — Filtrar por `occurred_on`, no por `created_at`](0003-filtrar-por-occurred-on.md)
- [ADR-0004 — Presupuestos por mes copiados, no plantilla única](0004-presupuestos-por-mes-copiados.md)
- [ADR-0005 — Categorías por defecto no se borran](0005-categorias-default-no-se-borran.md)
- [ADR-0006 — Archivar categorías custom en vez de borrar](0006-archivar-categorias-en-vez-de-borrar.md)
- [ADR-0007 — Auth: email/password + Google OAuth](0007-auth-email-y-google.md)
- [ADR-0008 — UI en español, mobile-first, dark mode](0008-ui-espanol-mobile-first-dark.md)
- [ADR-0009 — Notificaciones via OneSignal, oculto hasta config](0009-notificaciones-onesignal.md)
- [ADR-0010 — React Query como única fuente de cache cliente](0010-react-query-cache.md)
