'use client';

import { useEffect, useState } from 'react';
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
  bodyType: string;
  photoUrl: string | null;
  session: CurrentSaleSession | null;
}

export function formatTimeLeft(endDate?: string) {
  if (!endDate) return '00:00:00';
  const remaining = Math.max(0, new Date(endDate).getTime() - Date.now());
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function useCurrentSales() {
  const [vehicles, setVehicles] = useState<CurrentSaleVehicle[]>([]);
  const [sessions, setSessions] = useState<CurrentSaleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setClock] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest('/public/current-sales')
      .then((data) => {
        if (!active) return;
        setVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Chargement impossible.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return { vehicles, sessions, loading, error };
}
