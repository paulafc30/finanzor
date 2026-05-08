import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Lightbulb,
  Bug,
  CheckCircle2,
  AlertTriangle,
  Mail,
  MailWarning,
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { useSession } from '../hooks/useSession.js'
import { useSubmitFeedback } from '../hooks/useSubmitFeedback.js'

const FEEDBACK_EMAIL = 'finanzorapp@gmail.com'

/**
 * Formulario para sugerencias y bugs.
 * Al enviar:
 *  - Guarda en tabla `feedback` (Supabase) — historial garantizado.
 *  - Lanza POST a Web3Forms para que llegue por email automáticamente al
 *    correo del equipo, sin que el usuario tenga que hacer nada extra.
 */
export default function FeedbackPage() {
  const { user } = useSession()
  const submit = useSubmitFeedback()

  const [type, setType] = useState('suggestion')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { emailSent, emailError } cuando done

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await submit.mutateAsync({ type, message, email })
      setResult({
        emailSent: res?.emailSent ?? false,
        emailError: res?.emailError ?? null,
      })
    } catch (err) {
      setError(err.message ?? 'No se pudo enviar')
    }
  }

  function reset() {
    setType('suggestion')
    setMessage('')
    setError(null)
    setResult(null)
  }

  // === Pantalla de éxito (con o sin email enviado) ===
  if (result) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            to="/ajustes"
            className="rounded-full p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
            aria-label="Volver a ajustes"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold">Sugerencias y fallos</h1>
        </div>

        {result.emailSent ? (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-success/10 p-8 text-center ring-1 ring-success/20">
            <div className="rounded-full bg-success/20 p-3">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h2 className="text-lg font-semibold text-white">¡Gracias por tu mensaje!</h2>
            <p className="text-sm text-white/70">
              Lo hemos recibido y lo revisaremos pronto. Si dejaste tu email de
              contacto, te responderemos por ahí.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-warning/10 p-8 text-center ring-1 ring-warning/20">
            <div className="rounded-full bg-warning/20 p-3">
              <MailWarning size={32} className="text-warning" />
            </div>
            <h2 className="text-lg font-semibold text-white">Mensaje guardado</h2>
            <p className="text-sm text-white/70">
              Tu feedback se ha guardado correctamente, pero no hemos podido
              enviarlo por email. El equipo lo verá igualmente cuando revise el
              historial. Si quieres asegurar que llegue, puedes copiarlo y
              enviarlo manualmente:
            </p>
            <a
              href={`mailto:${FEEDBACK_EMAIL}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-bg-card px-3 py-1.5 text-xs text-white/80 hover:text-white"
            >
              <Mail size={13} />
              {FEEDBACK_EMAIL}
            </a>
            {result.emailError && (
              <p className="text-[11px] text-white/40">
                Detalle técnico: {result.emailError}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center gap-2">
          <Button variant="secondary" onClick={reset}>
            Enviar otro
          </Button>
          <Link to="/">
            <Button>Volver a Inicio</Button>
          </Link>
        </div>
      </section>
    )
  }

  // === Formulario ===
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/ajustes"
          className="rounded-full p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
          aria-label="Volver a ajustes"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold">Sugerencias y fallos</h1>
      </div>

      <p className="text-sm text-white/60">
        ¿Has detectado un fallo o se te ocurre una mejora? Cuéntamelo. Lo
        guardamos y se envía automáticamente al correo del equipo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/50">
            Tipo
          </label>
          <div className="grid grid-cols-3 gap-2">
            <TypeButton
              active={type === 'suggestion'}
              onClick={() => setType('suggestion')}
              icon={Lightbulb}
              label="Sugerencia"
              tone="accent"
            />
            <TypeButton
              active={type === 'bug'}
              onClick={() => setType('bug')}
              icon={Bug}
              label="Fallo / Bug"
              tone="danger"
            />
            <TypeButton
              active={type === 'other'}
              onClick={() => setType('other')}
              icon={Mail}
              label="Otro"
              tone="info"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">
            Mensaje
          </label>
          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              type === 'bug'
                ? 'Describe qué ocurre, en qué pantalla y qué esperabas que pasara…'
                : type === 'suggestion'
                  ? '¿Qué te gustaría que tuviera Finanzor o cómo lo mejorarías?'
                  : 'Cuéntanos lo que necesites…'
            }
            required
            maxLength={2000}
            className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/5 focus:ring-accent"
          />
          <div className="mt-1 flex justify-between text-[11px] text-white/40">
            <span>Mínimo unas líneas. Máximo 2000 caracteres.</span>
            <span>{message.length}/2000</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">
            Email para responderte (opcional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/5 focus:ring-accent"
          />
          <p className="mt-1 text-[11px] text-white/40">
            Por defecto usaremos el email con el que iniciaste sesión.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-sm text-white ring-1 ring-danger/20">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={submit.isPending || !message.trim()}
          className="w-full"
        >
          {submit.isPending ? 'Enviando…' : 'Enviar feedback'}
        </Button>
      </form>
    </section>
  )
}

function TypeButton({ active, onClick, icon: Icon, label, tone }) {
  const tones = {
    accent: active ? 'bg-accent text-white ring-accent' : 'text-white/60',
    danger: active ? 'bg-danger text-white ring-danger' : 'text-white/60',
    info: active ? 'bg-info text-white ring-info' : 'text-white/60',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-xs font-medium ring-1 transition',
        active ? tones[tone] : 'bg-bg-card text-white/60 ring-white/5 hover:text-white',
      ].join(' ')}
    >
      <Icon size={18} />
      {label}
    </button>
  )
}
