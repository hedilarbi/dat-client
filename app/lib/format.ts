import type { Language } from '../routing';

const LOCALES: Record<Language, string> = { fr: 'fr-FR', en: 'en-GB' };

export const formatEuros = (value: number, language: Language) =>
  new Intl.NumberFormat(LOCALES[language], {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);

export const formatNumber = (value: number, language: Language) =>
  new Intl.NumberFormat(LOCALES[language]).format(value);
