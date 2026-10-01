'use client';

import { useEffect } from 'react';
import { apiRequest } from '../api';

/**
 * Tient l'étape 3 à jour sans rechargement : l'autre partie peut déposer son tampon, valider les
 * documents ou signer à tout moment, et la signature se fait dans un autre onglet. La vente est
 * relue à l'affichage, au retour sur l'onglet, puis toutes les 30 secondes tant que la page est
 * visible. L'appel de synchronisation relit aussi la signature sur OpenAPI quand elle est en cours.
 */
export function useSaleAutoRefresh(saleId: string | undefined, active: boolean, refresh: () => Promise<unknown>) {
  useEffect(() => {
    if (!saleId || !active) return;
    let running = false;

    const sync = () => {
      if (running || document.visibilityState !== 'visible') return;
      running = true;
      apiRequest(`/sales/${saleId}/esignature/sync`, { method: 'POST' })
        .then(() => refresh())
        // En cas d'échec, la page garde le dernier état connu et réessaie au prochain passage.
        .catch(() => {})
        .finally(() => { running = false; });
    };

    sync();
    const timer = window.setInterval(sync, 30_000);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, [saleId, active, refresh]);
}
