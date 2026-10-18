import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Plus, Wand2 } from 'lucide-react'
import Button from '../ui/Button.jsx'
import {
  useCategoryRules,
  useCreateCategoryRule,
  useDeleteCategoryRule,
} from '../../hooks/useCategoryRules.js'
import { cleanKeyword } from '../../lib/categoryRules.js'

/**
 * Reglas automáticas del usuario: "si el concepto contiene X -> categoría Y".
 * Se aplican en la importación de CSV antes que las reglas fijas.
 */
export default function CategoryRulesCard({ categories }) {
  const { t } = useTranslation('categories')
  const { data: rules = [] } = useCategoryRules()
  const create = useCreateCategoryRule()
  const remove = useDeleteCategoryRule()
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState(null)

  const nameById = new Map(categories.map((c) => [c.id, c.name]))
  const canAdd = !!cleanKeyword(keyword) && !!categoryId

  async function handleAdd(e) {
    e.preventDefault()
    setError(null)
    try {
      await create.mutateAsync({ keyword, category_id: categoryId })
      setKeyword('')
    } catch (err) {
      setError(err.message ?? t('rules.error'))
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      <div className="flex items-center gap-2">
        <Wand2 size={16} className="text-accent" />
        <h2 className="text-sm font-semibold">{t('rules.title')}</h2>
      </div>
      <p className="text-xs text-white/50">{t('rules.hint')}</p>

      {rules.length > 0 && (
        <ul className="space-y-1.5">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-lg bg-bg-card px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                <strong className="font-medium">{r.keyword}</strong>
                <span className="text-white/40"> → </span>
                {nameById.get(r.category_id) ?? '—'}
              </span>
              <button
                type="button"
                onClick={() => remove.mutate(r.id)}
                aria-label={t('rules.delete')}
                className="rounded-md p-1 text-white/30 hover:bg-white/5 hover:text-danger"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={keyword}
          maxLength={60}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t('rules.keywordPlaceholder')}
          className="flex-1 rounded-md bg-bg-card px-2.5 py-1.5 text-sm text-white outline-none ring-1 ring-white/5 focus:ring-accent"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md bg-bg-card px-2.5 py-1.5 text-sm text-white outline-none ring-1 ring-white/5 focus:ring-accent sm:w-44"
        >
          <option value="">{t('rules.categoryPlaceholder')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={!canAdd || create.isPending}>
          <Plus size={14} />
          {t('rules.add')}
        </Button>
      </form>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
