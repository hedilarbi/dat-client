// Logique de routage localisé, sans dépendance React/Next côté client — importable
// aussi bien depuis le proxy (edge runtime) que depuis les composants de l'app.

export type Language = 'fr' | 'en';

export const supportedLanguages: Language[] = ['fr', 'en'];

// Chemin canonique (route interne Next.js réelle) -> slug public affiché par langue.
const ROUTE_SLUGS: Record<string, Record<Language, string>> = {
  '/login': { fr: 'connexion', en: 'login' },
  '/login/acheteur': { fr: 'connexion/acheteur', en: 'login/buyer' },
  '/login/vendeur': { fr: 'connexion/vendeur', en: 'login/seller' },
  '/register': { fr: 'inscription', en: 'register' },
  '/register/acheteur': { fr: 'inscription/acheteur', en: 'register/buyer' },
  '/register/vendeur': { fr: 'inscription/vendeur', en: 'register/seller' },
  '/vendre-avec-nous': { fr: 'vendre-avec-nous', en: 'sell-with-us' },
  '/ventes-en-cours': { fr: 'ventes-en-cours', en: 'current-sales' },
  '/forgot-password': { fr: 'mot-de-passe-oublie', en: 'forgot-password' },
  '/forgot-password/reset': { fr: 'mot-de-passe-oublie/reinitialisation', en: 'forgot-password/reset' },
  '/acheteur/tableau-de-bord/profil': { fr: 'acheteur/tableau-de-bord/profil', en: 'buyer/dashboard/profile' },
  '/acheteur/tableau-de-bord/tampon': { fr: 'acheteur/tableau-de-bord/tampon', en: 'buyer/dashboard/stamp' },
  '/acheteur/tableau-de-bord/support': { fr: 'acheteur/tableau-de-bord/support', en: 'buyer/dashboard/support' },
  '/vendeur/tableau-de-bord/profil': { fr: 'vendeur/tableau-de-bord/profil', en: 'seller/dashboard/profile' },
  '/vendeur/tableau-de-bord/tampon': { fr: 'vendeur/tableau-de-bord/tampon', en: 'seller/dashboard/stamp' },
  '/vendeur/tableau-de-bord/support': { fr: 'vendeur/tableau-de-bord/support', en: 'seller/dashboard/support' },
  '/vendeur/tableau-de-bord': { fr: 'vendeur/tableau-de-bord', en: 'seller/dashboard' },
  '/vendeur/dossiers': { fr: 'vendeur/dossiers', en: 'seller/files' },
  '/vendeur/ventes': { fr: 'vendeur/ventes', en: 'seller/sales' },
  '/vendeur/en-vente': { fr: 'vendeur/en-vente', en: 'seller/for-sale' },
  '/vehicule': { fr: 'vehicule', en: 'vehicle' },
  '/acheteur/tableau-de-bord': { fr: 'acheteur/tableau-de-bord', en: 'buyer/dashboard' },
  '/acheteur/tableau-de-bord/mes-offres': { fr: 'acheteur/tableau-de-bord/mes-offres', en: 'buyer/dashboard/my-bids' },
  '/acheteur/tableau-de-bord/mes-vehicules': { fr: 'acheteur/tableau-de-bord/mes-vehicules', en: 'buyer/dashboard/my-vehicles' },
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

// Découpe un chemin en préfixes décroissants, du plus long au plus court, pour retrouver
// la route déclarée d'un chemin dynamique : '/vehicule/abc' -> préfixe '/vehicule' + reste 'abc'.
function splitOnKnownPrefix(
  segments: string[],
  match: (prefix: string) => string | undefined,
): { resolved: string; rest: string[] } | null {
  for (let index = segments.length - 1; index > 0; index--) {
    const resolved = match(segments.slice(0, index).join('/'));
    if (resolved) return { resolved, rest: segments.slice(index) };
  }
  return null;
}

function resolveLocalizedSlug(canonicalPath: string, language: Language): string {
  if (canonicalPath === '/' || canonicalPath === '') return '/';

  const slug = ROUTE_SLUGS[canonicalPath]?.[language];
  if (slug) return `/${slug}`;

  // Routes dynamiques (ex: /vehicule/[id]) : traduire le préfixe déclaré, garder le reste tel quel
  const match = splitOnKnownPrefix(
    canonicalPath.split('/').filter(Boolean),
    (prefix) => ROUTE_SLUGS[`/${prefix}`]?.[language],
  );
  return match ? `/${match.resolved}/${match.rest.join('/')}` : canonicalPath;
}

function resolveCanonicalPath(localizedRemainder: string, language: Language): string {
  if (localizedRemainder === '/' || localizedRemainder === '') return '/';
  const clean = localizedRemainder.replace(/^\//, '');

  const canonicalOf = (slug: string) =>
    Object.keys(ROUTE_SLUGS).find((canonical) => ROUTE_SLUGS[canonical][language] === slug);

  const exact = canonicalOf(clean);
  if (exact) return exact;

  const match = splitOnKnownPrefix(clean.split('/').filter(Boolean), canonicalOf);
  return match ? `${match.resolved}/${match.rest.join('/')}` : localizedRemainder;
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
 * l'acheteur a un espace dédié sous /acheteur/tableau-de-bord.
 */
export function getRoleHomePath(role: 'acheteur' | 'vendeur' | string): string {
  return role === 'vendeur' ? '/vendeur/tableau-de-bord' : '/acheteur/tableau-de-bord';
}

/**
 * Profil et support vivent sous l'espace du rôle depuis que /profil et /support ont été
 * démantelés : ces deux chemins n'ont plus de page et renverraient une 404.
 */
export function getRoleProfilePath(role: 'acheteur' | 'vendeur' | string): string {
  return `${getRoleHomePath(role)}/profil`;
}

export function getRoleSupportPath(role: 'acheteur' | 'vendeur' | string): string {
  return `${getRoleHomePath(role)}/support`;
}

/** Dépôt du tampon d'entreprise, sous l'espace du rôle comme le profil et le support. */
export function getRoleStampPath(role: 'acheteur' | 'vendeur' | string): string {
  return `${getRoleHomePath(role)}/tampon`;
}

/**
 * Connexion et inscription ont chacune une route dédiée par rôle (plus de ?role= en query) :
 * /login/acheteur, /login/vendeur, /register/acheteur, /register/vendeur.
 */
export function getRoleLoginPath(role: 'acheteur' | 'vendeur' | string): string {
  return role === 'vendeur' ? '/login/vendeur' : '/login/acheteur';
}

export function getRoleRegisterPath(role: 'acheteur' | 'vendeur' | string): string {
  return role === 'vendeur' ? '/register/vendeur' : '/register/acheteur';
}
