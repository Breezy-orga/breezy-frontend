'use client';

import { useTranslation } from 'react-i18next';
import 'flag-icons/css/flag-icons.min.css';

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();

    const current = i18n.resolvedLanguage === 'fr' ? 'fr' : 'en';
   const toggleLanguage = () => {
    i18n.changeLanguage(current === 'fr' ? 'en' : 'fr');
  };



  const label = current === 'fr' ? 'English' : 'Français';

   return (
    <button className={className} onClick={toggleLanguage}>
      <span className={`fi fi-${current === 'fr' ? 'gb' : 'fr'}`}></span>
      <span className="ml-2">{current === 'fr' ? 'English' : 'Français'}</span>
    </button>
  );
}
