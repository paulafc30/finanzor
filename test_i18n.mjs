import i18next from 'i18next';
import { readFileSync } from 'fs';
const rd = (p) => JSON.parse(readFileSync(p, 'utf8'));
const esCommon = rd('./src/i18n/locales/es/common.json');
const esAuth = rd('./src/i18n/locales/es/auth.json');
const esOnboarding = rd('./src/i18n/locales/es/onboarding.json');

const es = { common: esCommon, auth: esAuth, onboarding: esOnboarding };
const ns = Object.keys(es);

await i18next.init({
  resources: { es },
  ns,
  defaultNS: 'common',
  lng: 'es',
  fallbackLng: 'es',
});

const tAuth = i18next.getFixedT('es', 'auth');
console.log('auth login.appName ->', tAuth('login.appName'));

const tOnb = i18next.getFixedT('es', 'onboarding');
const slides = tOnb('slides', { returnObjects: true });
console.log('onboarding slides is array?', Array.isArray(slides), 'length:', slides.length);
