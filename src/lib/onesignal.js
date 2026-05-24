/**
 * Inicialización y helpers de OneSignal Web Push.
 *
 * Necesita VITE_ONESIGNAL_APP_ID en .env.local y en Vercel.
 * El SDK se carga dinámicamente desde CDN cuando se invoca initOneSignal().
 */

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID

let initPromise = null
let scriptLoaded = false

/**
 * Carga el SDK de OneSignal (una sola vez).
 */
function loadScript() {
  if (scriptLoaded) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-onesignal-sdk]')
    if (existing) {
      scriptLoaded = true
      return resolve()
    }
    const s = document.createElement('script')
    s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    s.defer = true
    s.dataset.onesignalSdk = '1'
    s.onload = () => {
      scriptLoaded = true
      resolve()
    }
    s.onerror = () => reject(new Error('No se pudo cargar el SDK de OneSignal'))
    document.head.appendChild(s)
  })
}

/**
 * Inicializa OneSignal si no se ha hecho ya. Devuelve la instancia.
 * Si no hay APP_ID configurada, lanza error claro.
 */
export function initOneSignal() {
  if (!APP_ID) {
    return Promise.reject(
      new Error(
        'Falta VITE_ONESIGNAL_APP_ID. Configúrala en .env.local y en Vercel.',
      ),
    )
  }
  if (initPromise) return initPromise

  initPromise = (async () => {
    await loadScript()
    window.OneSignalDeferred = window.OneSignalDeferred || []
    return new Promise((resolve) => {
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.init({
          appId: APP_ID,
          // Pedimos el permiso solo cuando el usuario pulse el botón
          // (no en el primer render, para no asustarle).
          autoResubscribe: true,
          notifyButton: { enable: false },
          // Personalización del prompt nativo
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: 'push',
                  autoPrompt: false,
                  text: {
                    actionMessage:
                      '¿Quieres recibir un recordatorio diario para apuntar tus gastos?',
                    acceptButton: 'Sí, avísame',
                    cancelButton: 'Ahora no',
                  },
                },
              ],
            },
          },
        })
        resolve(window.OneSignal)
      })
    })
  })()

  return initPromise
}

/**
 * Devuelve si el navegador soporta Web Push.
 */
export function isPushSupported() {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Pide permiso y suscribe al usuario.
 */
export async function subscribeToPush() {
  const OneSignal = await initOneSignal()
  // Si el navegador ya tiene permiso denegado, no podemos hacer nada
  if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
    throw new Error(
      'Has bloqueado las notificaciones para esta web. Habilítalas desde la configuración del navegador.',
    )
  }
  await OneSignal.Notifications.requestPermission()
  await OneSignal.User.PushSubscription.optIn()
  return OneSignal.User.PushSubscription.optedIn
}

/**
 * Desuscribe al usuario (sin revocar permiso del navegador).
 */
export async function unsubscribeFromPush() {
  const OneSignal = await initOneSignal()
  await OneSignal.User.PushSubscription.optOut()
}

/**
 * Devuelve true si ahora mismo está suscrito al push.
 */
export async function isSubscribed() {
  if (!isPushSupported() || !APP_ID) return false
  try {
    const OneSignal = await initOneSignal()
    return Boolean(OneSignal.User?.PushSubscription?.optedIn)
  } catch {
    return false
  }
}

/**
 * Etiqueta al usuario en OneSignal con su user_id de Supabase y email.
 * Útil para luego segmentar envíos desde el panel.
 */
export async function identifyUser({ userId, email } = {}) {
  if (!userId) return
  try {
    const OneSignal = await initOneSignal()
    await OneSignal.login(userId)
    if (email) {
      await OneSignal.User.addEmail(email)
    }
  } catch {
    // ignorable
  }
}
