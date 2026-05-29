# ADR-0007 — Auth: email/password + Google OAuth

**Estado:** Aceptado.
**Fecha:** Inicio del proyecto.

## Contexto

La app la van a usar yo y familiares con perfiles muy diferentes (yo,
desarrolladora; mi madre, que prefiere "entrar con Google" sin recordar
contraseña; mi hermano, que prefiere correo + contraseña). No quiero forzar
a nadie a un solo método.

Tampoco quiero implementar magic links porque Supabase los envía con un
remitente de Supabase que se ve raro en el inbox y, sin DNS propio
verificado, va a Spam.

## Decisión

Activar en Supabase Auth los siguientes proveedores:

- **Email / contraseña**: validación nativa, recuperación incluida.
- **Google OAuth**: cuenta con un click para quien tenga Google.

Ambos terminan en una sesión Supabase estándar. Para el cliente da igual cuál
se usó: `useSession` solo se preocupa de si hay usuario o no.

No se activan: Magic Link, GitHub, Apple, Facebook.

## Consecuencias

✅ Cubre los dos perfiles familiares sin código adicional.
✅ Google reduce fricción de onboarding al máximo.
✅ Si en el futuro alguien quiere Apple Sign-In (Play Store / iOS), se
   añade desde el panel sin tocar código.

❌ Mantener dos flujos en `Login.jsx` (`signInWithPassword` y
   `signInWithOAuth`). Mitigado: ambos son llamadas de una línea al SDK
   de Supabase.
❌ Hay que mantener las credenciales OAuth de Google Cloud vivas (revisar
   cada año por si Google cambia algo).

## Aplicación

- `src/pages/Login.jsx` — UI con dos botones.
- `src/lib/authErrors.js` — traduce mensajes de Supabase Auth al español
  para no mostrar "Invalid login credentials" a mi madre.
- `src/hooks/useSession.js` — escucha `onAuthStateChange` y expone el
  usuario actual.
