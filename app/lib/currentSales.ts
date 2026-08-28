'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../api';

export interface CurrentSaleSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface CurrentSaleVehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  fuelType: string;
  energyLabel: string;
  procedure: string;
  gearbox: string;
  registrationCardAvailable: boolean | null;
  bodyType: string;
  /** Numéro de lot attribué à la publication dans la session */
  lotNumber: number | null;
  photoUrl: string | null;
  session: CurrentSaleSession | null;
}

export interface CurrentSaleBrand {
  name: string;
  count: number;
}

export interface CurrentSalesFilters {
  brand?: string;
  model?: string;
  energy?: string;
  procedure?: string;
  gearbox?: string;
  registrationCardAvailable?: string;
  yearFrom?: string;
  yearTo?: string;
  mileageFrom?: string;
  mileageTo?: string;
}

/**
 * Pourquoi le catalogue s'arrête à la première page :
 * - `ok` : aucun blocage, l'utilisateur peut tout parcourir
 * - `anonymous` : visiteur non connecté
 * - `account_not_validated` : compte vendeur/acheteur pas encore validé
 */
export type SalesAccessReason = 'ok' | 'anonymous' | 'account_not_validated';

export function formatTimeLeft(endDate?: string) {
  if (!endDate) return '00:00:00';
  const remaining = Math.max(0, new Date(endDate).getTime() - Date.now());
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

const buildQueryString = (filters: CurrentSalesFilters | undefined, pageSize: number | undefined) => {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (pageSize) params.set('limit', String(pageSize));
  return params.toString();
};

interface UseCurrentSalesOptions {
  filters?: CurrentSalesFilters;
  pageSize?: number;
}

/**
 * Charge les ventes en cours page par page. La première page arrive au montage (et à chaque
 * changement de filtres) ; `loadMore` ajoute la suivante à la liste déjà affichée.
 */
export function useCurrentSales({ filters, pageSize }: UseCurrentSalesOptions = {}) {
  const [vehicles, setVehicles] = useState<CurrentSaleVehicle[]>([]);
  const [sessions, setSessions] = useState<CurrentSaleSession[]>([]);
  const [brands, setBrands] = useState<CurrentSaleBrand[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [accessReason, setAccessReason] = useState<SalesAccessReason>('ok');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [, setClock] = useState(0);

  const queryString = useMemo(() => buildQueryString(filters, pageSize), [filters, pageSize]);
  // Jeu de filtres auquel correspondent les données affichées : tant qu'il diffère de la requête
  // courante, on est en chargement. État dérivé plutôt que setState synchrone dans l'effet.
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const loading = loadedQuery !== queryString;

  const pageRef = useRef(1);
  // Garde de dernier recours contre les fermetures périmées. `loadMore` capture `canLoadMore`
  // au moment où il est créé ; or il existe un instant, entre `setHasMore(true)` et
  // `setCanLoadMore(false)`, où la sentinelle peut être montée et observée avec une version
  // de `loadMore` qui croit encore l'accès ouvert. Un rappel d'IntersectionObserver déjà mis
  // en file s'exécute même après `disconnect()` : la valeur lue dans une ref, elle, est
  // toujours la valeur courante.
  // Fermé par défaut : tant que le serveur n'a pas répondu, on ne présume pas de l'accès.
  const canLoadMoreRef = useRef(false);
  // Identifie la requête en cours : une réponse tardive d'un jeu de filtres abandonné est ignorée
  const requestRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestRef.current;
    pageRef.current = 1;
    canLoadMoreRef.current = false;

    apiRequest(`/public/current-sales${queryString ? `?${queryString}` : ''}`)
      .then((data) => {
        if (requestRef.current !== requestId) return;
        setError('');
        setVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
        setBrands(Array.isArray(data.brands) ? data.brands : []);
        setTotal(data.pagination?.total ?? 0);
        canLoadMoreRef.current = data.access?.canLoadMore !== false;
        setHasMore(Boolean(data.pagination?.hasMore));
        setCanLoadMore(canLoadMoreRef.current);
        setAccessReason(data.access?.reason || 'ok');
        setLoadedQuery(queryString);
      })
      .catch((requestError) => {
        if (requestRef.current !== requestId) return;
        setError(requestError instanceof Error ? requestError.message : 'Chargement impossible.');
        setLoadedQuery(queryString);
      });
  }, [queryString]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || !canLoadMore) return;
    // La ref prime sur la valeur capturée : elle seule reflète l'état au moment de l'appel.
    if (!canLoadMoreRef.current) return;

    const requestId = requestRef.current;
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);

    apiRequest(`/public/current-sales?${queryString ? `${queryString}&` : ''}page=${nextPage}`)
      .then((data) => {
        // Les filtres ont changé entre-temps : cette page appartient à une liste abandonnée
        if (requestRef.current !== requestId) return;
        pageRef.current = nextPage;
        const incoming: CurrentSaleVehicle[] = Array.isArray(data.vehicles) ? data.vehicles : [];
        setVehicles((current) => {
          const known = new Set(current.map((vehicle) => vehicle.id));
          return [...current, ...incoming.filter((vehicle) => !known.has(vehicle.id))];
        });
        setTotal(data.pagination?.total ?? 0);
        canLoadMoreRef.current = data.access?.canLoadMore !== false;
        setHasMore(Boolean(data.pagination?.hasMore));
        setCanLoadMore(canLoadMoreRef.current);
        setAccessReason(data.access?.reason || 'ok');
      })
      .catch((requestError) => {
        if (requestRef.current !== requestId) return;
        setError(requestError instanceof Error ? requestError.message : 'Chargement impossible.');
      })
      .finally(() => {
        if (requestRef.current === requestId) setLoadingMore(false);
      });
  }, [canLoadMore, hasMore, loading, loadingMore, queryString]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    vehicles,
    sessions,
    brands,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    canLoadMore,
    accessReason,
    loadMore,
  };
}
