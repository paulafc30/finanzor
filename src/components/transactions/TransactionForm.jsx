import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { format } from 'date-fns'
import { Repeat, Calculator, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import CalculatorPad from '../ui/CalculatorPad.jsx'
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
      .number({ invalid_type_error: 'Importe invalido' })
      .positive('El importe debe ser mayor que 0'),
    description: z.string().max(120).optional().or(z.literal('')),
    category_id: z.string().uuid().optional().or(z.literal('')),
    occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida'),
  })
  .refine(
    (v) => v.type === 'income' || (v.category_id && v.category_id.length > 0),
    { path: ['category_id'], message: 'Categoria obligatoria en gastos' },
  )

/**
 * Formulario para alta o edicion de un movimiento.
 * - Si recibe `transaction`, prellena y llama a useUpdateTransaction.
 * - Si no, crea con los defaults habituales.
 * - Si recibe `defaultDate` (string YYYY-MM-DD) y NO hay transaction,
 *   usa esa fecha en vez del default normal (util al anadir desde el calendario).
 */
export default function TransactionForm({ transaction, defaultDate: defaultDateProp, onSuccess }) {
  const isEdit = !!transaction
  const { data: categories = [] } = useCategories()
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const { month, rangeStart, rangeEnd } = useMonth()

  // Defaults: en edicion usamos los valores actuales; en creacion, hoy o
  // el primer dia del mes seleccionado si estas navegando otro mes.
  // Si nos pasan defaultDate explicito (calendario), tiene prioridad.
  const today = format(new Date(), 'yyyy-MM-dd')
  const computedDefaultDate = today >= rangeStart && today < rangeEnd ? today : rangeStart
  const defaultDate = defaultDateProp || computedDefaultDate

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

  // Si cambia el mes seleccionado mientras esta abierto el modal de creacion,
  // ajusta la fecha por defecto. En edicion no tocamos.
  useEffect(() => {
    if (!isEdit) setValue('occurred_on', defaultDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  // Re-inicializar si cambia la transaction (otro item) abierta
  useEffect(() => {
    reset(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction?.id])

  // Re-sincroniza la categoria cuando las categorias cargan tarde.
  // `register` deja el <select> uncontrolled, asi que si las <option> no
  // existen en el mount inicial el navegador deja el valor en "" y
  // react-hook-form se queda desincronizado del DOM. Al llegar las
  // categorias, forzamos el valor correcto.
  useEffect(() => {
    if (categories.length === 0) return
    if (isEdit) {
      setValue('category_id', transaction.category?.id ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, transaction?.id])

  const type = watch('type')
  const amount = watch('amount')
  const busy = createMutation.isPending || updateMutation.isPending
  const [calcOpen, setCalcOpen] = useState(false)

  async function onSubmit(values) {
    const parsed = schema.safeParse(values)
    if (!parsed.success) return

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: transaction.id, ...parsed.data })
        onSuccess?.()
      } else {
        await createMutation.mutateAsync(parsed.data)
        // Tras crear, dejamos el form listo para anadir otro: limpiamos campos
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
            concreto, no la configuracion del gasto fijo en si (eso se edita en
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
          Importe (EUR)
        </label>
        <div className="relative">
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
            className="w-full rounded-lg bg-bg-card px-3 py-2.5 pr-12 text-lg font-semibold text-white outline-none ring-1 ring-white/5 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => setCalcOpen(true)}
            aria-label="Abrir calculadora"
            title="Calculadora"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/60 hover:bg-white/5 hover:text-accent"
          >
            <Calculator size={18} />
          </button>
        </div>
        {errors.amount && (
          <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
        )}
      </div>

      <CalculatorPad
        open={calcOpen}
        initialValue={amount}
        onClose={() => setCalcOpen(false)}
        onAccept={(val) => {
          // Guardamos como string con punto decimal porque el input es type=number
          setValue('amount', String(val), { shouldValidate: true, shouldDirty: true })
          setCalcOpen(false)
        }}
      />

      {/* Descripcion */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
          Descripcion
        </label>
        <input
          type="text"
          maxLength={120}
          placeholder={type === 'expense' ? 'Mercadona, gasolina...' : 'Sueldo, regalo...'}
          {...register('description')}
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
      </div>

      {/* Categoria */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs uppercase tracking-wide text-white/50">
            Categoria {type === 'expense' && <span className="text-danger">*</span>}
          </label>
          <Link
            to="/categorias"
            onClick={() => onSuccess?.()}
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent hover:text-accent/80"
          >
            <Plus size={11} />
            Nueva
          </Link>
        </div>
        <select
          {...register('category_id', {
            validate: (v) =>
              type === 'income' || (v && v.length > 0) || 'Categoria obligatoria',
          })}
          className="w-full rounded-lg bg-bg-card px-3 py-2.5 text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        >
          <option value="">{type === 'income' ? 'Sin categoria' : 'Selecciona...'}</option>
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
          {busy ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
