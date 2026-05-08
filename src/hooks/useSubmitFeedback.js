import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useSession } from './useSession.js'

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

const TYPE_LABELS = {
  suggestion: 'Sugerencia',
  bug: 'Bug',
  other: 'Feedback',
}

/**
 * Envío de feedback en dos pasos:
 *  1. Inserta una fila en `feedback` de Supabase (historial garantizado).
 *  2. Hace POST a Web3Forms para que llegue por email a finanzorapp@gmail.com.
 *     Si Web3Forms falla (red, key inválida, etc.), el feedback ya quedó
 *     guardado y devolvemos { emailSent: false, emailError } para informar
 *     al usuario sin bloquear el flujo.
 */
export function useSubmitFeedback() {
  const { user } = useSession()

  return useMutation({
    mutationFn: async ({ type, message, email }) => {
      if (!message || !message.trim()) throw new Error('El mensaje es obligatorio')
      if (!['suggestion', 'bug', 'other'].includes(type)) {
        throw new Error('Tipo inválido')
      }

      const trimmed = message.trim()
      const replyEmail = email?.trim() || user?.email || null
      const userAgent =
        typeof navigator !== 'undefined' ? navigator.userAgent : null

      // 1. Insert en Supabase
      const { data: row, error } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id ?? null,
          type,
          message: trimmed,
          email: replyEmail,
          user_agent: userAgent,
          app_version: '0.1.0',
        })
        .select()
        .single()

      if (error) throw error

      // 2. Envío por email vía Web3Forms (best-effort)
      let emailSent = false
      let emailError = null

      if (!WEB3FORMS_KEY) {
        emailError = 'No hay VITE_WEB3FORMS_KEY configurada'
      } else {
        try {
          const typeLabel = TYPE_LABELS[type]
          const subject = `[Finanzor] ${typeLabel}`
          const fromName = `Finanzor — ${typeLabel}`
          const bodyText = [
            `Tipo: ${typeLabel}`,
            `Usuario: ${user?.email ?? 'anónimo'}`,
            replyEmail ? `Responder a: ${replyEmail}` : null,
            '',
            'Mensaje:',
            trimmed,
            '',
            '---',
            `User Agent: ${userAgent ?? 'n/a'}`,
            `Feedback ID: ${row?.id ?? 'n/a'}`,
          ]
            .filter(Boolean)
            .join('\n')

          const res = await fetch(WEB3FORMS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              access_key: WEB3FORMS_KEY,
              subject,
              from_name: fromName,
              // Web3Forms reenvía a la dirección que configuraste al registrarte.
              // El campo "email" lo trata como reply-to si lo soporta.
              email: replyEmail || 'noreply@finanzor.app',
              message: bodyText,
              // Honeypot anti-spam (vacío)
              botcheck: '',
            }),
          })

          const json = await res.json().catch(() => ({}))
          if (res.ok && json.success) {
            emailSent = true
          } else {
            emailError = json.message ?? `HTTP ${res.status}`
          }
        } catch (err) {
          emailError = err?.message ?? 'Error de red'
        }
      }

      return { row, emailSent, emailError }
    },
  })
}
