import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Cada feature tiene su propio archivo de traducciones (locales/{lang}/{ns}.json)
// para poder editarlos en paralelo sin pisarse. Aqui se combinan en un solo
// objeto de traduccion por idioma, bajo una clave de nivel superior por
// namespace (ej. t('dashboard.saldo')).
import esCommon from './locales/es/common.json'
import esAuth from './locales/es/auth.json'
import esSettings from './locales/es/settings.json'
import esFeedback from './locales/es/feedback.json'
import esDashboard from './locales/es/dashboard.json'
import esBudget from './locales/es/budget.json'
import esLayout from './locales/es/layout.json'
import esCategories from './locales/es/categories.json'
import esCalendar from './locales/es/calendar.json'
import esSavings from './locales/es/savings.json'
import esRecurring from './locales/es/recurring.json'
import esTransactions from './locales/es/transactions.json'
import esImport from './locales/es/import.json'
import esUi from './locales/es/ui.json'
import esOnboarding from './locales/es/onboarding.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enSettings from './locales/en/settings.json'
import enFeedback from './locales/en/feedback.json'
import enDashboard from './locales/en/dashboard.json'
import enBudget from './locales/en/budget.json'
import enLayout from './locales/en/layout.json'
import enCategories from './locales/en/categories.json'
import enCalendar from './locales/en/calendar.json'
import enSavings from './locales/en/savings.json'
import enRecurring from './locales/en/recurring.json'
import enTransactions from './locales/en/transactions.json'
import enImport from './locales/en/import.json'
import enUi from './locales/en/ui.json'
import enOnboarding from './locales/en/onboarding.json'

export const STORAGE_KEY = 'finanzor-lang'

const es = {
  common: esCommon,
  auth: esAuth,
  settings: esSettings,
  feedback: esFeedback,
  dashboard: esDashboard,
  budget: esBudget,
  layout: esLayout,
  categories: esCategories,
  calendar: esCalendar,
  savings: esSavings,
  recurring: esRecurring,
  transactions: esTransactions,
  import: esImport,
  ui: esUi,
  onboarding: esOnboarding,
}

const en = {
  common: enCommon,
  auth: enAuth,
  settings: enSettings,
  feedback: enFeedback,
  dashboard: enDashboard,
  budget: enBudget,
  layout: enLayout,
  categories: enCategories,
  calendar: enCalendar,
  savings: enSavings,
  recurring: enRecurring,
  transactions: enTransactions,
  import: enImport,
  ui: enUi,
  onboarding: enOnboarding,
}

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18next
