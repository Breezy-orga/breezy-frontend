"use client";

import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();

    const current = i18n.resolvedLanguage === 'fr' ? 'fr' : 'en';
   const toggleLanguage = () => {
    i18n.changeLanguage(current === 'fr' ? 'en' : 'fr');
  };


   const flag = current === 'fr' ? '🇬🇧' : '🇫🇷';
  const label = current === 'fr' ? 'English' : 'Français';

   return (
    <button className={className} onClick={toggleLanguage}>
    <span className="text-xl mr-2">{flag}</span>
    {label}
    </button>
  );
}
