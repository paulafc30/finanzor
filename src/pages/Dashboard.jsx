import { useMonth } from '../hooks/useMonth.jsx'

export default function Dashboard() {
  const { rangeStart, rangeEnd } = useMonth()

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Inicio</h1>
      <p className="text-sm text-white/60">
        Aquí irán los KPIs (ingresos, gastos, saldo, tasa de ahorro), la barra de
        presupuesto del mes, la donut por categorías y la comparativa con el mes
        anterior.
      </p>
      <div className="rounded-xl bg-bg-elevated p-4 text-xs text-white/40">
        Mes en curso: <code>{rangeStart}</code> → <code>{rangeEnd}</code>
        <br />
        (Filtro que usarán las queries: <code>occurred_on &gt;= start AND &lt; end</code>)
      </div>
    </section>
  )
}
