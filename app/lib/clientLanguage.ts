import { getLocaleFromPath, type Language } from '../routing';

/**
 * Langue active hors composant React (couche API, helpers) : celle de l'URL, sinon la dernière
 * langue choisie par l'utilisateur, sinon le français.
 */
export function getClientLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';
  const fromPath = getLocaleFromPath(window.location.pathname);
  if (fromPath) return fromPath;
  try {
    const stored = window.localStorage.getItem('language');
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    // stockage indisponible : on retombe sur le français
  }
  return 'fr';
}

/** Choisit le texte selon la langue active, pour les messages produits hors des composants. */
export function tr(fr: string, en: string): string {
  return getClientLanguage() === 'en' ? en : fr;
}
