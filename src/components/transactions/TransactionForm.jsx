import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { format } from 'date-fns'
import Button from '../ui/Button.jsx'
import { useCategories } from '../../hooks/useCategories.js'
import { useCreateTransaction } from '../../hooks/useTransactions.js'
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
 * Formulario para alta de un movimiento.
 * Por defecto: tipo "expense", fecha = primer día del mes seleccionado o hoy
 * (lo que sea más reciente, para que al cambiar de mes la fecha por defecto
 * caiga dentro del mes que estás viendo).
 */
export default function TransactionForm({ onSuccess }) {
  const { data: categories = [] } = useCategories()
  const createMutation = useCreateTransaction()
  const { month, rangeStart, rangeEnd } = useMonth()

  // Fecha por defecto: hoy si está dentro del mes seleccionado, si no el día 1 del mes seleccionado
  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultDate = today >= rangeStart && today < rangeEnd ? today : rangeStart

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      type: 'expense',
      amount: '',
      description: '',
      category_id: '',
      occurred_on: defaultDate,
    },
  })

  // Si cambia el mes seleccionado mientras el modal está abierto, ajusta la fecha por defecto
  useEffect(() => {
    setValue('occurred_on', defaultDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  const type = watch('type')

  async function onSubmit(values) {
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      // los errores de zod los puede pintar el usuario manualmente, pero RHF
      // ya gestiona los required/min básicos. Para mantenerlo simple:
      return
    }
    try {
      await createMutation.mutateAsync(parsed.data)
      reset({
        type: parsed.data.type, // mantener el tipo para añadir varios seguidos
        amount: '',
        description: '',
        category_id: '',
        occurred_on: parsed.data.occurred_on,
      })
      onSuccess?.()
    } catch (err) {
      alert('No se pudo guardar: ' + (err.message ?? 'error desconocido'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          disabled={isSubmitting || createMutation.isPending}
          className="flex-1"
        >
          {createMutation.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
