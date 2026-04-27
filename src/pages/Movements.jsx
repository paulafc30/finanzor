import { useState } from 'react'
import Modal from '../components/ui/Modal.jsx'
import Fab from '../components/ui/Fab.jsx'
import TransactionForm from '../components/transactions/TransactionForm.jsx'
import TransactionList from '../components/transactions/TransactionList.jsx'

export default function Movements() {
  const [open, setOpen] = useState(false)

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Movimientos</h1>

      <TransactionList />

      <Fab onClick={() => setOpen(true)} ariaLabel="Añadir movimiento" />

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo movimiento">
        <TransactionForm onSuccess={() => setOpen(false)} />
      </Modal>
    </section>
  )
}
