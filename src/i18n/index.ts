import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import 'flag-icons/css/flag-icons.min.css';




i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationEN },
      fr: { translation: translationFR },
    },
    lng: typeof window !== 'undefined'
      ? localStorage.getItem('i18nextLng') ||
        (document.cookie.match(/(?:^|; )language=(fr|en)/)?.[1]) ||
        'fr'
      : 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
     detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'language',
      cookieMinutes: 1440,
     }
  });

export default i18n;
