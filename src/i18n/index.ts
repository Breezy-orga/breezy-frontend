import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import 'flag-icons/css/flag-icons.min.css';




i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationEN },
      fr: { translation: translationFR },
    },
    fallbackLng: 'fr',
    debug: process.env.NODE_ENV === 'development',
    detection: {
      order: ['localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'sessionStorage'],
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng'
    },
    supportedLngs: ['en', 'fr'],
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false
    }
  });

export default i18n;
