# ADR-0001 — Stack: React + Vite + Supabase + Vercel

**Estado:** Aceptado.
**Fecha:** Inicio del proyecto (abril 2026).

## Contexto

Necesito una app de finanzas personales que pueda usar yo y mi familia.
Restricciones reales:

- **Sin presupuesto**: todo gratis (familia + uno mismo, no es producto
  comercial).
- **Una sola desarrolladora**: yo. Web dev, sin equipo móvil nativo.
- **Multi-usuario**: cada persona ve solo lo suyo, con login.
- **Datos en la nube**: nada de SQLite local: tiene que sincronizar entre
  móvil y portátil.
- **Futuro Play Store**: la versión web tiene que poder envolverse como PWA o
  TWA sin reescribir todo.

Empezamos un mock en una herramienta SaaS (Hercules App) que no dejaba
descargar el código sin pagar, así que se rehace desde cero con stack propio.

## Decisión

- **Frontend**: React 18 con Vite 5.
- **Estilos**: Tailwind CSS 3.
- **Backend-as-a-Service**: Supabase (Postgres + Auth + Row Level Security).
- **Hosting**: Vercel (auto-deploy desde GitHub).

## Consecuencias

✅ Stack que ya conozco (React) + dev server rapidísimo (Vite).
✅ Supabase tier gratis cubre con creces el uso de una familia.
✅ RLS sustituye al backend propio para autorización.
✅ Una PWA bien hecha puede empaquetarse como TWA para Play Store con
   Bubblewrap más adelante, sin reescribir.

❌ Acoplamiento fuerte a Supabase. Migrar a otra BBDD implicaría reescribir
   todas las queries (mitigación: queries encapsuladas en hooks de dominio
   en `src/hooks/`).
❌ Sin SSR. Para una app autenticada no importa, pero no es un blog.
❌ Tier gratis tiene límites de filas / Mb que en algún momento habrá que
   vigilar.

## Alternativas descartadas

- **Firebase**: más caro fuera del tier gratis y RLS de Postgres me parece
  más limpio que Security Rules.
- **Backend propio (Node/Express)**: triplica el trabajo para una sola
  persona.
- **App nativa Kotlin/Swift**: no llego ni a la primera versión sola.
