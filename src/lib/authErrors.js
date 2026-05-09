/**
 * Traducción de mensajes de error comunes de Supabase Auth al español.
 *
 * Supabase devuelve los mensajes en inglés (no es localizable). Aquí mapeamos
 * los más típicos a textos comprensibles para el usuario final.
 *
 * Uso:
 *   try { ... } catch (err) { setError(translateAuthError(err)) }
 *
 * Si no hay match exacto se devuelve un fallback genérico (no el mensaje
 * crudo en inglés).
 */

// Pares [patrón regex (inglés) → mensaje en español]
const RULES = [
  // Login
  [
    /invalid login credentials/i,
    'Email o contraseña incorrectos. Si no tienes cuenta, puedes crear una con este email.',
  ],
  [/email not confirmed/i, 'Tu email aún no está confirmado. Revisa tu correo (y la carpeta de spam).'],
  [/email link is invalid or has expired/i, 'El enlace ha caducado. Pide uno nuevo.'],
  [/token (has expired|is invalid)/i, 'Tu sesión ha caducado. Vuelve a iniciar sesión.'],
  [/jwt expired/i, 'Tu sesión ha caducado. Vuelve a iniciar sesión.'],

  // Signup
  [
    /user already registered/i,
    'Este email ya está registrado. Si has olvidado tu contraseña, contacta con soporte.',
  ],
  [
    /email address.*already.*registered/i,
    'Este email ya está registrado. Si has olvidado tu contraseña, contacta con soporte.',
  ],
  [/signup is disabled/i, 'El registro está desactivado por el administrador.'],
  [/signups not allowed/i, 'El registro está desactivado por el administrador.'],

  // Validaciones de email/contraseña
  [
    /unable to validate email address.*invalid format/i,
    'El email no tiene un formato válido.',
  ],
  [/invalid email/i, 'El email no tiene un formato válido.'],
  [
    /password should be at least (\d+) characters?/i,
    (m) => `La contraseña debe tener al menos ${m[1]} caracteres.`,
  ],
  [/password is too weak/i, 'La contraseña es demasiado débil. Usa una más larga o con más variedad.'],
  [
    /new password should be different from the old/i,
    'La nueva contraseña tiene que ser distinta de la anterior.',
  ],

  // Rate limiting
  [
    /for security purposes.*request this once every (\d+) seconds?/i,
    (m) => `Por seguridad, espera ${m[1]} segundos antes de volver a intentarlo.`,
  ],
  [
    /email rate limit exceeded/i,
    'Has pedido demasiados correos en poco tiempo. Espera unos minutos.',
  ],
  [/rate limit exceeded/i, 'Demasiadas peticiones seguidas. Espera un momento e inténtalo de nuevo.'],

  // OAuth / proveedor externo
  [/oauth state not found or expired/i, 'La sesión de Google ha caducado. Vuelve a intentarlo.'],
  [/provider is not enabled/i, 'Este método de inicio de sesión no está disponible.'],

  // Red / conexión
  [/network|failed to fetch|networkerror/i, 'Problema de conexión. Comprueba tu internet e inténtalo de nuevo.'],
]

/**
 * Devuelve un mensaje en español a partir de un error (Error, string o
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

  if (!raw) return 'Algo no fue bien. Inténtalo de nuevo.'

  for (const [pattern, replacement] of RULES) {
    const match = raw.match(pattern)
    if (match) {
      return typeof replacement === 'function' ? replacement(match) : replacement
    }
  }

  // Fallback genérico — no exponemos el inglés al usuario final
  return 'Ha ocurrido un error. Si vuelve a pasar, prueba a recargar la página.'
}
