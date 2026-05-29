# ADR-0009 — Notificaciones via OneSignal, ocultas hasta configurar

**Estado:** Aceptado parcialmente. Componente implementado, **oculto en UI
hasta tener cuenta y App ID configurada**.
**Fecha:** Inicio del proyecto / revisada mayo 2026.

## Contexto

Quiero un recordatorio diario a las 22:00 para anotar los gastos del día.
Sin notificaciones la app se olvida y los datos quedan incompletos.

Opciones consideradas:

- **Web Push nativo + service worker propio**: requiere VAPID, manejar
  endpoints, lanzador en backend para cron. Demasiado para el alcance
  actual.
- **OneSignal**: SaaS gratis hasta cierto volumen, gestiona los endpoints y
  ofrece programación de notificaciones. Tiene SDK para web.
- **Telegram bot**: cómodo pero no instala bien en una PWA destinada a
  Play Store en el futuro.

## Decisión

- Integrar **OneSignal Web Push v16**.
- `src/lib/onesignal.js` carga el SDK dinámicamente desde la CDN.
- `src/hooks/useNotifications.js` expone `subscribed`, `subscribe`,
  `unsubscribe`, `loading`, `error`.
- `src/components/settings/NotificationsToggle.jsx` renderiza la tarjeta en
  Ajustes con estados: navegador no soportado / OneSignal no configurado /
  permiso denegado / activar / desactivar.
- **Oculto en `Settings.jsx`** hasta tener `VITE_ONESIGNAL_APP_ID`
  configurada en `.env.local` y Vercel. El import y el `<NotificationsToggle/>`
  están comentados, no eliminados.
- `public/OneSignalSDKWorker.js` referencia al worker de OneSignal.

## Consecuencias

✅ Cero coste en backend.
✅ La infraestructura ya está lista; solo falta el App ID para activarla.
✅ Si se decide migrar a Web Push nativo más adelante, los hooks pueden
   reescribirse sin cambiar la UI.

❌ Acoplamiento a un proveedor externo (mitigado por encapsulación en
   `lib/onesignal.js`).
❌ Hay que crear las notificaciones programadas en el panel de OneSignal, no
   las gestiona el código todavía.

## Para activarlo

1. Crear app en OneSignal y obtener `App ID`.
2. Añadir `VITE_ONESIGNAL_APP_ID=<id>` a `.env.local` y al panel de
   Environment Variables de Vercel.
3. En `src/pages/Settings.jsx`, descomentar:
   ```jsx
   import NotificationsToggle from '../components/settings/NotificationsToggle.jsx'
   ...
   <NotificationsToggle />
   ```
4. Crear la notificación programada diaria en el panel de OneSignal.
