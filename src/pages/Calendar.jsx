import { Calendar as CalendarIcon, Sparkles } from 'lucide-react'

export default function CalendarPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Calendario</h1>

      <div className="flex flex-col items-center gap-3 rounded-xl bg-bg-elevated p-8 text-center">
        <div className="rounded-full bg-accent/15 p-3">
          <CalendarIcon size={28} className="text-accent" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">
            Vista de calendario
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Estamos trabajando en una vista mensual donde verás tus ingresos y
            gastos por día y podrás añadir movimientos directamente desde
            cualquier fecha.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
          <Sparkles size={12} />
          Próximamente
        </span>
      </div>

      <p className="px-1 text-center text-xs text-white/40">
        Mientras tanto, puedes añadir movimientos con cualquier fecha desde
        Movimientos o desde el botón + en Inicio.
      </p>
    </section>
  )
}
