import { useState } from 'react'
import { Pencil, Trash2, Archive, ArchiveRestore, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import GoalForm from './GoalForm.jsx'
import ContributionForm from './ContributionForm.jsx'
import {
  useGoalContributions,
  useDeleteContribution,
} from '../../hooks/useGoalContributions.js'
import {
  useToggleArchiveGoal,
  useDeleteGoal,
} from '../../hooks/useGoals.js'
import { formatEuro, formatDate } from '../../lib/formatters.js'

/**
 * Modal con el detalle de una meta:
 * - Resumen (contribuido / objetivo, %, barra)
 * - Lista de aportaciones con borrado individual
 * - Acciones: aportar, editar meta, archivar, eliminar
 *
 * Internamente alterna entre tres vistas:
 *   detail (por defecto), edit (form de meta), contribute (form aportación)
 */
export default function GoalDetailModal({ goal, open, onClose }) {
  const { t } = useTranslation('savings')
  const [view, setView] = useState('detail')
  const { data: contributions = [], isLoading } = useGoalContributions(goal?.id)
  const archive = useToggleArchiveGoal()
  const remove = useDeleteGoal()
  const removeContribution = useDeleteContribution()

  if (!goal) return null

  const isComplete = goal.percentage >= 100

  function handleClose() {
    setView('detail')
    onClose?.()
  }

  async function handleArchive() {
    try {
      await archive.mutateAsync({ id: goal.id, is_archived: !goal.is_archived })
      handleClose()
    } catch (err) {
      alert(t('errors.actionFailed', { message: err.message ?? 'error' }))
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      t('confirmDeleteGoal', { name: goal.name }),
    )
    if (!ok) return
    try {
      await remove.mutateAsync(goal.id)
      handleClose()
    } catch (err) {
      alert(t('errors.deleteFailed', { message: err.message ?? 'error' }))
    }
  }

  async function handleDeleteContribution(c) {
    const ok = window.confirm(
      t('confirmDeleteContribution', { amount: formatEuro(c.amount) }),
    )
    if (!ok) return
    try {
      await removeContribution.mutateAsync({ id: c.id, goal_id: goal.id })
    } catch (err) {
      alert(t('errors.deleteFailed', { message: err.message ?? 'error' }))
    }
  }

  const widthPct = Math.min(100, Math.max(0, goal.percentage))

  const titles = {
    detail: goal.name,
    edit: t('editGoal'),
    contribute: t('newContribution'),
  }

  return (
    <Modal open={open} onClose={handleClose} title={titles[view]}>
      {view === 'edit' && (
        <GoalForm goal={goal} onSuccess={() => setView('detail')} />
      )}

      {view === 'contribute' && (
        <ContributionForm
          goalId={goal.id}
          onSuccess={() => setView('detail')}
        />
      )}

      {view === 'detail' && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="rounded-xl bg-bg-card p-4">
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="font-semibold text-white">
                {formatEuro(goal.contributed)}
              </span>
              <span className="text-white/50">
                {t('of')} {formatEuro(goal.target_amount)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/5">
              <div
                className={[
                  'h-full rounded-full transition-all',
                  isComplete ? 'bg-success' : 'bg-accent',
                ].join(' ')}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/40">
              <span>{t('progress', { percent: goal.percentage.toFixed(0) })}</span>
              {goal.target_date && <span>{t('targetDateFor', { date: formatDate(goal.target_date) })}</span>}
            </div>
            {goal.contributed < goal.target_amount && (
              <p className="mt-2 text-xs text-white/60">
                {t('remainingPrefix')}{' '}
                <strong className="text-white">
                  {formatEuro(goal.target_amount - goal.contributed)}
                </strong>{' '}
                {t('remainingSuffix')}
              </p>
            )}
          </div>

          {/* Botón aportar */}
          <Button onClick={() => setView('contribute')} className="w-full">
            <Plus size={16} />
            {t('addContribution')}
          </Button>

          {/* Lista de aportaciones */}
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-white/50">
              {t('contributionsTitle')} {contributions.length > 0 && `(${contributions.length})`}
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : contributions.length === 0 ? (
              <p className="rounded-lg bg-bg-card p-3 text-center text-xs text-white/50">
                {t('noContributions')}
              </p>
            ) : (
              <ul className="space-y-1">
                {contributions.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg bg-bg-card px-3 py-2"
                  >
                    <span className="text-sm text-white">
                      +{formatEuro(c.amount)}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-white/50">
                        {formatDate(c.contributed_on)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteContribution(c)}
                        aria-label={t('deleteContributionAria')}
                        className="rounded-md p-1 text-white/30 hover:bg-white/5 hover:text-danger"
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2 border-t border-white/5 pt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setView('edit')}
              className="flex-1"
            >
              <Pencil size={14} />
              {t('edit')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleArchive}
              disabled={archive.isPending}
              className="flex-1"
            >
              {goal.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {goal.is_archived ? t('unarchive') : t('archive')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={remove.isPending}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
