// El hook se trasladó a useOnboarding.jsx (necesitamos JSX porque el provider
// renderiza el modal de Onboarding). Este archivo solo re-exporta para mantener
// compatibilidad si alguien lo importa con la extensión .js.
//
// Puedes borrarlo manualmente cuando quieras — no se usa en ningún sitio.
export { useOnboarding, OnboardingProvider } from './useOnboarding.jsx'
