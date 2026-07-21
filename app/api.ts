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
    // Session invalide/expirée (401) ou compte suspendu/bloqué (403) : ces deux statuts ne sont
    // renvoyés par le serveur que par le middleware d'authentification (`protect`), donc sans
    // ambiguïté ici. Sans ce renvoi, une session expirée en cours de navigation (sans rechargement
    // de page, donc sans repasser par UserProvider) laisse l'utilisateur bloqué sur une page qui
    // échoue silencieusement au lieu d'être renvoyé vers la connexion — /auth/me est exclu car il
    // échoue normalement pour tout visiteur non connecté et est déjà géré par UserProvider.
    if (
      (response.status === 401 || response.status === 403) &&
      path !== '/auth/me' &&
      typeof window !== 'undefined'
    ) {
      const currentCanonicalPath = canonicalPathFromPathname(window.location.pathname);
      if (!AUTH_EXEMPT_PATHS.has(currentCanonicalPath)) {
        const language = getLocaleFromPath(window.location.pathname) || 'fr';
        window.location.href = localizedPath('/login', language);
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
