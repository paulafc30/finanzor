import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { STORAGE_KEY } from '../../i18n/index.js'

/**
 * Tarjeta en Ajustes para alternar entre espanol e ingles.
 *
 * Mismo patron que ThemeToggle: segmented control de dos opciones para que
 * siempre se vea cual idioma esta activo. i18next persiste la preferencia en
 * localStorage (clave STORAGE_KEY) via i18next-browser-languagedetector.
 */
export default function LanguageToggle() {
  const { t, i18n } = useTranslation('settings')
  const lang = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es'

  function changeLanguage(lng) {
    i18n.changeLanguage(lng)
    try {
      localStorage.setItem(STORAGE_KEY, lng)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-xl bg-bg-elevated p-4 ring-1 ring-white/5">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15">
          <Languages size={16} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{t('language.title')}</h3>
          <p className="text-[11px] text-white/50">
            {lang === 'es' ? t('language.activeEs') : t('language.activeEn')}
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label={t('language.title')}
        className="grid grid-cols-2 gap-1 rounded-lg bg-bg-card p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={lang === 'es'}
          onClick={() => changeLanguage('es')}
          className={[
            'inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition',
            lang === 'es'
              ? 'bg-accent text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          Español
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={lang === 'en'}
          onClick={() => changeLanguage('en')}
          className={[
            'inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition',
            lang === 'en'
              ? 'bg-accent text-white'
              : 'text-white/60 hover:text-white',
          ].join(' ')}
        >
          English
        </button>
      </div>
    </div>
  )
}
