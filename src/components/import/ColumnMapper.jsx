import { useTranslation } from 'react-i18next'

/**
 * UI para que el usuario asigne columnas del CSV cuando la detección automática
 * no las encuentra todas. Recibe los headers detectados y el mapping inicial.
 *
 * Llama a onChange con el mapping actualizado al cambiar cualquier select.
 */
export default function ColumnMapper({ headers, mapping, onChange }) {
  const { t } = useTranslation('import')

  function set(key, value) {
    onChange({ ...mapping, [key]: value || null })
  }

  return (
    <div className="space-y-3 rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      <div>
        <h3 className="text-sm font-semibold text-white">{t('mapping.title')}</h3>
        <p className="mt-0.5 text-xs text-white/50">
          {t('mapping.description')}
        </p>
      </div>

      <Field
        label={t('mapping.date')}
        required
        value={mapping.dateCol}
        headers={headers}
        onChange={(v) => set('dateCol', v)}
        noUseLabel={t('mapping.noUse')}
      />
      <Field
        label={t('mapping.amount')}
        value={mapping.amountCol}
        headers={headers}
        onChange={(v) => set('amountCol', v)}
        noUseLabel={t('mapping.noUse')}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={t('mapping.haber')}
          value={mapping.haberCol}
          headers={headers}
          onChange={(v) => set('haberCol', v)}
          noUseLabel={t('mapping.noUse')}
        />
        <Field
          label={t('mapping.debe')}
          value={mapping.debeCol}
          headers={headers}
          onChange={(v) => set('debeCol', v)}
          noUseLabel={t('mapping.noUse')}
        />
      </div>
      <Field
        label={t('mapping.desc')}
        required
        value={mapping.descCol}
        headers={headers}
        onChange={(v) => set('descCol', v)}
        noUseLabel={t('mapping.noUse')}
      />
    </div>
  )
}

function Field({ label, value, headers, onChange, required, noUseLabel }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-bg-card px-3 py-2 text-sm text-white outline-none ring-1 ring-white/5 focus:ring-accent"
      >
        <option value="">{noUseLabel}</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  )
}
