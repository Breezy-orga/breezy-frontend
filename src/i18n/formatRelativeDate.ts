import i18n from './index';
import { TFunction } from 'i18next';

/**
 * Formatte une date relative selon la langue courante i18n.
 * @param dateString Date ISO ou string
 * @param t Optionnel, fonction de traduction (useTranslation().t)
 * @returns string traduite
 */
export function formatRelativeDate(dateString: string, t?: TFunction): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  // Utilise la fonction t du contexte si fournie, sinon celle d'i18n
  const translate = t || i18n.t.bind(i18n);
  if (diffInSeconds < 60) return translate('post.just_now');
  if (diffInSeconds < 3600) return translate('post.minutes_ago', { count: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400) return translate('post.hours_ago', { count: Math.floor(diffInSeconds / 3600) });
  if (diffInSeconds < 604800) return translate('post.days_ago', { count: Math.floor(diffInSeconds / 86400) });
  // Date absolue formatée selon la langue courante
  const lang = i18n.resolvedLanguage || 'fr';
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
