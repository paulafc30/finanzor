import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { format } from 'date-fns'
import { Repeat } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { useCategories } from '../../hooks/useCategories.js'
import {
  useCreateTransaction,
  useUpdateTransaction,
} from '../../hooks/useTransactions.js'
import { useMonth } from '../../hooks/useMonth.jsx'

const schema = z
  .object({
    type: z.enum(['expense', 'income']),
    amount: z.coerce
      .number({ invalid_type_error: 'Importe inválido' })
      .positive('El importe debe ser mayor que 0'),
    description: z.string().max(120).optional().or(z.literal('')),
    category_id: z.string().uuid().optional().or(z.literal('')),
    occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  })
  .refine(
    (v) => v.type === 'income' || (v.category_id && v.category_id.length > 0),
    { path: ['category_id'], message: 'Categoría obligatoria en gastos' },
  )

/**
 * Formulario para alta o edición de un movimiento.
 * - Si recibe `transaction`, prellena y llama a useUpdateTransaction.
 * - Si no, crea con los defaults habituales.
 */
export default function TransactionForm({ transaction, onSuccess }) {
  const isEdit = !!transaction
  const { data: categories = [] } = useCategories()
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const { month, rangeStart, rangeEnd } = useMonth()

  // Defaults: en edición usamos los valores actuales; en creación, hoy o
  // el primer día del mes seleccionado si estás navegando otro mes.
  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultDate = today >= rangeStart && today < rangeEnd ? today : rangeStart

  const initial = isEdit
    ? {
        type: transaction.type,
        amount: String(transaction.amount),
        description: transaction.description ?? '',
        category_id: transaction.category?.id ?? '',
        occurred_on: transaction.occurred_on,
      }
    : {
        type: 'expense',
        amount: '',
        description: '',
        category_id: '',
        occurred_on: defaultDate,
      }

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: initial })

  // Si cambia el mes seleccionado mientras está abierto el modal de creación,
  // ajusta la fecha por defecto. En edición no tocamos.
  useEffect(() => {
    if (!isEdit) setValue('occurred_on', defaultDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  // Re-inicializar si cambia la transaction (otro item) abierta
  useEffect(() => {
    reset(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction?.id])

  const type = watch('type')
  const busy = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values) {
    const parsed = schema.safeParse(values)
    if (!parsed.success) return

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: transaction.id, ...parsed.data })
        onSuccess?.()
      } else {
        await createMutation.mutateAsync(parsed.data)
        // Tras crear, dejamos el form listo para añadir otro: limpiamos campos
        // pero conservamos tipo y fecha para encadenar varios.
        reset({
          type: parsed.data.type,
          amount: '',
          description: '',
          category_id: '',
          occurred_on: parsed.data.occurred_on,
        })
        onSuccess?.()
      }
    } catch (err) {
      alert('No se pudo guardar: ' + (err.message ?? 'error desconocido'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Aviso si es un movimiento recurrente */}
      {isEdit && transaction.recurring_id && (
        <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-2.5 text-xs text-white/80 ring-1 ring-accent/20">
          <Repeat size={14} className="mt-0.5 shrink-0 text-accent" />
          <p>
            Este movimiento viene de un gasto fijo. Editarlo solo cambia este mes
            concreto, no la configuración del gasto fijo en sí (eso se edita en
            Presupuesto).
          </p>
        </div>
      )}

      {/* Toggle tipo */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-bg-card p-1">
        <button
          type="button"
          onClick={() => setValue('type', 'expense')}
          className={[
            'rounded-md py-2 text-sm font-medium transition',
            type === 'expense'
              ? 'bg-danger text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setValue('type', 'income')}
          className={[
            'rounded-md py-2 text-sm font-medium transition',
            type === 'income'
              ? 'bg-success text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          Ingreso
        </button>
      </div>

      {/* Importe */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Importe (€)
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          autoFocus
          placeholder="0,00"
          {...register('amount', {
            required: 'Importe obligatorio',
            min: { value: 0.01, message: 'Mayor que 0' },
          })}
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-lg font-semibold text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Descripción
        </label>
        <input
          type="text"
          maxLength={120}
          placeholder={type === 'expense' ? 'Mercadona, gasolina…' : 'Sueldo, regalo…'}
          {...register('description')}
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      {/* Categoría */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Categoría {type === 'expense' && <span className="text-danger">*</span>}
        </label>
        <select
          {...register('category_id', {
            validate: (v) =>
              type === 'income' || (v && v.length > 0) || 'Categoría obligatoria',
          })}
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        >
          <option value="">{type === 'income' ? 'Sin categoría' : 'Selecciona…'}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="mt-1 text-xs text-danger">{errors.category_id.message}</p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Fecha
        </label>
        <input
          type="date"
          {...register('occurred_on', { required: 'Fecha obligatoria' })}
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
        {errors.occurred_on && (
          <p className="mt-1 text-xs text-danger">{errors.occurred_on.message}</p>
        )}
        <p className="mt-1 text-xs text-white/40">
          Cuenta para el mes de la fecha que pongas, no para hoy.
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || busy}
          className="flex-1"
        >
          {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
