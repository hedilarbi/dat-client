import { canonicalPathFromPathname, getLocaleFromPath, localizedPath } from './routing';

const API_BASE_URL = '/api';

// Pages accessibles sans session valide : un 401/403 déclenché depuis l'une d'elles ne doit pas
// provoquer de redirection (déjà sur une page de connexion/accueil, ou pas encore de session
// à proprement parler pour /register en étape 1).
const AUTH_EXEMPT_PATHS = new Set([
  '/',
  '/login',
  '/login/acheteur',
  '/login/vendeur',
  '/register',
  '/register/acheteur',
  '/register/vendeur',
  '/forgot-password',
  '/forgot-password/reset',
  // Retour de la plateforme de signature : sans session, la page affiche une confirmation
  '/signature-terminee',
]);

/**
 * Custom fetch wrapper that handles credentials (cookies)
 */
export async function apiRequest(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  
  // Ensure headers include JSON contentType unless overridden
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Next.js client-side fetch credentials policy
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Crucial for sending/receiving JWT cookies
  };

  const response = await fetch(url, fetchOptions);
  
  let data: any = {};
  const responseText = await response.text();

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message: response.ok
          ? responseText
          : `Réponse serveur invalide (${response.status}). ${responseText.slice(0, 180)}`
      };
    }
  }

  if (!response.ok) {
    const isAuthenticationError =
      typeof data.error === 'string' && data.error.startsWith('auth.');

    // Seules une session invalide/expirée (401) ou un compte bloqué (403 auth.account_blocked)
    // renvoient vers la connexion, et uniquement avec un code `auth.*` : une API tierce peut aussi
    // renvoyer 401/403 (par exemple la recherche de plaque) sans que la session soit en cause.
    // Les autres 403 `auth.*` (auth.forbidden, auth.seller_not_validated, auth.account_suspended…)
    // signifient « connecté, mais pas autorisé ici » : la session reste valide, donc /login
    // renverrait aussitôt vers la page d'origine, qui referait le même appel — une boucle sans fin
    // entre /connexion et le tableau de bord (cas d'un vendeur suspendu sur son tableau de bord).
    if (
      ((response.status === 401) || (response.status === 403 && data.error === 'auth.account_blocked')) &&
      isAuthenticationError &&
      path !== '/auth/me' &&
      typeof window !== 'undefined'
    ) {
      const currentCanonicalPath = canonicalPathFromPathname(window.location.pathname);
      if (!AUTH_EXEMPT_PATHS.has(currentCanonicalPath)) {
        const language = getLocaleFromPath(window.location.pathname) || 'fr';
        const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.href = localizedPath(`/login?next=${encodeURIComponent(returnPath)}`, language);
      }
    }

    const error = new Error(data.message || 'Une erreur est survenue.');
    (error as any).code = data.error || 'api.error';
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return data;
}
