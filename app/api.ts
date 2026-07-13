const API_BASE_URL = '/api';

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
    const error = new Error(data.message || 'Une erreur est survenue.');
    (error as any).code = data.error || 'api.error';
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return data;
}
