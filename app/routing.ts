// Logique de routage localisé, sans dépendance React/Next côté client — importable
// aussi bien depuis le proxy (edge runtime) que depuis les composants de l'app.

export type Language = 'fr' | 'en';

export const supportedLanguages: Language[] = ['fr', 'en'];

// Chemin canonique (route interne Next.js réelle) -> slug public affiché par langue.
const ROUTE_SLUGS: Record<string, Record<Language, string>> = {
  '/login': { fr: 'connexion', en: 'login' },
  '/register': { fr: 'inscription', en: 'register' },
  '/forgot-password': { fr: 'mot-de-passe-oublie', en: 'forgot-password' },
  '/profil': { fr: 'profil', en: 'profile' },
  '/support': { fr: 'support', en: 'support' },
  '/vendeur/tableau-de-bord': { fr: 'vendeur/tableau-de-bord', en: 'seller/dashboard' },
  '/vendeur/dossiers': { fr: 'vendeur/dossiers', en: 'seller/files' },
};

export function getLocaleFromPath(pathname: string | null): Language | null {
  const segment = pathname?.split('/').filter(Boolean)[0];
  return supportedLanguages.includes(segment as Language) ? (segment as Language) : null;
}

export function stripLocaleFromPath(pathname: string | null): string {
  if (!pathname) return '/';
  const locale = getLocaleFromPath(pathname);
  if (!locale) return pathname;
  const stripped = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '');
  return stripped || '/';
}

function resolveLocalizedSlug(canonicalPath: string, language: Language): string {
  if (canonicalPath === '/' || canonicalPath === '') return '/';
  const slug = ROUTE_SLUGS[canonicalPath]?.[language];
  return slug ? `/${slug}` : canonicalPath;
}

function resolveCanonicalPath(localizedRemainder: string, language: Language): string {
  if (localizedRemainder === '/' || localizedRemainder === '') return '/';
  const clean = localizedRemainder.replace(/^\//, '');
  for (const canonical of Object.keys(ROUTE_SLUGS)) {
    if (ROUTE_SLUGS[canonical][language] === clean) return canonical;
  }
  return localizedRemainder;
}

/**
 * Construit l'URL localisée (préfixe de langue + slug traduit) pour un chemin donné.
 * Accepte un chemin canonique (ex: '/vendeur/tableau-de-bord', avec ou sans query string)
 * ou le pathname courant du navigateur, potentiellement déjà localisé (ex: '/fr/connexion').
 */
export function localizedPath(pathname: string | null, language: Language): string {
  if (!pathname) return `/${language}`;

  const oldLocale = getLocaleFromPath(pathname);
  const remainder = stripLocaleFromPath(pathname);
  const [remainderPath, query] = remainder.split('?');

  const canonicalPath = oldLocale ? resolveCanonicalPath(remainderPath, oldLocale) : remainderPath;
  const localizedSlugPath = resolveLocalizedSlug(canonicalPath, language);
  const finalPath = localizedSlugPath === '/' ? `/${language}` : `/${language}${localizedSlugPath}`;

  return query ? `${finalPath}?${query}` : finalPath;
}

/**
 * Résout le chemin canonique (route interne Next.js) à partir du pathname complet
 * affiché dans le navigateur (préfixe de langue + slug localisé).
 */
export function canonicalPathFromPathname(pathname: string | null): string {
  if (!pathname) return '/';
  const locale = getLocaleFromPath(pathname);
  const remainder = stripLocaleFromPath(pathname);
  return locale ? resolveCanonicalPath(remainder, locale) : remainder;
}

/**
 * Utilisé par le proxy de rewrite : à partir du chemin localisé restant (après retrait
 * du préfixe de langue) et de la langue détectée, retourne le chemin interne à servir.
 */
export function resolveInternalPath(localizedRemainder: string, language: Language): string {
  return resolveCanonicalPath(localizedRemainder, language);
}

/**
 * Page d'accueil propre à chaque rôle : le vendeur a un espace dédié sous /vendeur,
 * l'acheteur n'a pas de "dashboard" à proprement parler, juste sa page /profil.
 */
export function getRoleHomePath(role: 'acheteur' | 'vendeur' | string): string {
  return role === 'vendeur' ? '/vendeur/tableau-de-bord' : '/profil';
}
