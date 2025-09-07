import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uzTranslation from './locales/uz/translation.json';
import ruTranslation from './locales/ru/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
        uz: { translation: uzTranslation },
        ru: { translation: ruTranslation }
    },
    fallbackLng: 'uz',
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
    }
  });

export default i18n;