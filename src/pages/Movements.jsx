export default function Movements() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Movimientos</h1>
      <p className="text-sm text-white/60">
        Lista ordenada por fecha, búsqueda, filtros por categoría y tipo. Botón
        para añadir ingreso o gasto. Cada movimiento usa <code>occurred_on</code>
        para asignarse al mes que el usuario indique.
      </p>
    </section>
  )
}
