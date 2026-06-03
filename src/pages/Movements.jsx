import { useState } from 'react'
import Modal from '../components/ui/Modal.jsx'
import Fab from '../components/ui/Fab.jsx'
import TransactionForm from '../components/transactions/TransactionForm.jsx'
import TransactionList from '../components/transactions/TransactionList.jsx'
import MovementsFilters, {
  emptyFilter,
} from '../components/transactions/MovementsFilters.jsx'
import MovementsSummary from '../components/transactions/MovementsSummary.jsx'

export default function Movements() {
  // null = cerrado, 'new' = creando, transaction object = editando
  const [editing, setEditing] = useState(null)
  const open = editing !== null

  // Filtros locales (buscador + panel desplegable)
  const [filter, setFilter] = useState(emptyFilter())

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Movimientos</h1>

      <MovementsFilters filter={filter} onChange={setFilter} />

      {/* Banner de totales + diagnóstico por origen. Solo aparece si hay
          al menos un movimiento; permite auditar a ojo las sumas. */}
      <MovementsSummary filter={filter} />

      <TransactionList filter={filter} onEdit={(t) => setEditing(t)} />

      <Fab onClick={() => setEditing('new')} ariaLabel="Añadir movimiento" />

      <Modal
        open={open}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Nuevo movimiento' : 'Editar movimiento'}
      >
        <TransactionForm
          transaction={editing && editing !== 'new' ? editing : null}
          onSuccess={() => setEditing(null)}
        />
      </Modal>
    </section>
  )
}
