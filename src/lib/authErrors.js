/**
 * Traducción de mensajes de error comunes de Supabase Auth al idioma activo.
 *
 * Supabase devuelve los mensajes en inglés (no es localizable). Aquí mapeamos
 * los más típicos a textos comprensibles para el usuario final, usando
 * i18next (namespace "auth") para que el mensaje mostrado respete el idioma
 * elegido por el usuario.
 *
 * Uso:
 *   try { ... } catch (err) { setError(translateAuthError(err)) }
 *
 * Si no hay match exacto se devuelve un fallback genérico (no el mensaje
 * crudo en inglés).
 */
import i18next from '../i18n/index.js'

// Pares [patrón regex (inglés) → clave de traducción en auth.errors]
const RULES = [
  // Login
  [/invalid login credentials/i, 'errors.invalidCredentials'],
  [/email not confirmed/i, 'errors.emailNotConfirmed'],
  [/email link is invalid or has expired/i, 'errors.linkExpired'],
  [/token (has expired|is invalid)/i, 'errors.sessionExpired'],
  [/jwt expired/i, 'errors.sessionExpired'],

  // Signup
  [/user already registered/i, 'errors.alreadyRegistered'],
  [/email address.*already.*registered/i, 'errors.alreadyRegistered'],
  [/signup is disabled/i, 'errors.signupDisabled'],
  [/signups not allowed/i, 'errors.signupDisabled'],

  // Validaciones de email/contraseña
  [/unable to validate email address.*invalid format/i, 'errors.invalidEmailFormat'],
  [/invalid email/i, 'errors.invalidEmailFormat'],
  [
    /password should be at least (\d+) characters?/i,
    (m) => i18next.t('errors.passwordMinLength', { ns: 'auth', count: m[1] }),
  ],
  [/password is too weak/i, 'errors.passwordWeak'],
  [/new password should be different from the old/i, 'errors.passwordSameAsOld'],

  // Rate limiting
  [
    /for security purposes.*request this once every (\d+) seconds?/i,
    (m) => i18next.t('errors.rateLimitSeconds', { ns: 'auth', seconds: m[1] }),
  ],
  [/email rate limit exceeded/i, 'errors.emailRateLimit'],
  [/rate limit exceeded/i, 'errors.rateLimitExceeded'],

  // OAuth / proveedor externo
  [/oauth state not found or expired/i, 'errors.oauthExpired'],
  [/provider is not enabled/i, 'errors.providerNotEnabled'],

  // Red / conexión
  [/network|failed to fetch|networkerror/i, 'errors.network'],
]

/**
 * Devuelve un mensaje traducido a partir de un error (Error, string o
 * { message }).
 */
export function translateAuthError(err) {
  const raw =
    typeof err === 'string'
      ? err
      : err?.message ??
        err?.error_description ??
        err?.error ??
        ''

  if (!raw) return i18next.t('errors.empty', { ns: 'auth' })

  for (const [pattern, replacement] of RULES) {
    const match = raw.match(pattern)
    if (match) {
      return typeof replacement === 'function'
        ? replacement(match)
        : i18next.t(replacement, { ns: 'auth' })
    }
  }

  // Fallback genérico — no exponemos el inglés al usuario final
  return i18next.t('errors.generic', { ns: 'auth' })
}
