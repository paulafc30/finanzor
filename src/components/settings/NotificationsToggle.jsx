import { Bell, BellOff, AlertTriangle, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNotifications } from '../../hooks/useNotifications.js'

/**
 * Tarjeta en Ajustes para activar/desactivar las notificaciones push diarias.
 * Maneja los casos:
 *  - Navegador sin soporte
 *  - OneSignal no configurado
 *  - Permiso denegado por el usuario
 *  - Activar / desactivar
 */
export default function NotificationsToggle() {
  const { t } = useTranslation('settings')
  const { supported, configured, subscribed, loading, error, subscribe, unsubscribe } =
    useNotifications()

  // === Casos especiales ===

  if (!supported) {
    return (
      <Wrapper>
        <Header subscribed={false} />
        <p className="mt-2 text-xs text-white/50">
          {t('notifications.unsupported')}
        </p>
      </Wrapper>
    )
  }

  if (!configured) {
    return (
      <Wrapper>
        <Header subscribed={false} />
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-warning/10 p-2 text-xs text-white ring-1 ring-warning/20">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-warning" />
          <p>
            {t('notifications.notConfigured')}
          </p>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <Header subscribed={subscribed} />

      <p className="mt-1.5 text-xs text-white/60">
        {t('notifications.descriptionBefore')}{' '}
        <strong className="text-white">{t('notifications.descriptionTime')}</strong>{' '}
        {t('notifications.descriptionAfter')}
      </p>

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-danger/10 p-2 text-xs text-white ring-1 ring-danger/20">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-danger" />
          <p>{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={[
          'mt-3 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
          subscribed
            ? 'bg-bg-card text-white hover:bg-bg-card/70'
            : 'bg-accent text-white hover:bg-accent-muted',
          loading ? 'opacity-50' : '',
        ].join(' ')}
      >
        {loading ? (
          <>…</>
        ) : subscribed ? (
          <>
            <BellOff size={15} />
            {t('notifications.disable')}
          </>
        ) : (
          <>
            <Bell size={15} />
            {t('notifications.enable')}
          </>
        )}
      </button>
    </Wrapper>
  )
}

function Wrapper({ children }) {
  return (
    <div className="rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      {children}
    </div>
  )
}

function Header({ subscribed }) {
  const { t } = useTranslation('settings')
  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          'flex h-9 w-9 items-center justify-center rounded-full',
          subscribed ? 'bg-accent' : 'bg-white/10',
        ].join(' ')}
      >
        {subscribed ? (
          <Bell size={16} className="text-white" />
        ) : (
          <Clock size={16} className="text-white/60" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white">
          {t('notifications.title')}
        </h3>
        <p className="text-[11px] text-white/50">
          {subscribed ? t('notifications.active') : t('notifications.inactive')}
        </p>
      </div>
    </div>
  )
}
