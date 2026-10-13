'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../api';
import { localizedPath, useLanguage } from '../i18n';
import { formatTimeLeft, type CurrentSaleVehicle } from '../lib/currentSales';
import { formatEuros } from '../lib/format';
import Spinner from './Spinner';

/**
 * Accueil d'un utilisateur connecté : « Notre vitrine ». Mêmes cartes que les ventes en cours,
 * mais avec les véhicules choisis par l'administrateur pour la vitrine. Un véhicule de la vitrine
 * n'est pas forcément dans une session : sans session, pas de compte à rebours et pas d'offre.
 */
export default function ShowcaseLots({ language }: { language: 'fr' | 'en' }) {
  const { t } = useLanguage();
  const [lots, setLots] = useState<CurrentSaleVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/public/showcase')
      .then((response) => setLots(Array.isArray(response.vehicles) ? response.vehicles : []))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : t('showcase.loadError')))
      .finally(() => setLoading(false));
    // Chargé une seule fois au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div id="ventes-en-cours" className="scroll-mt-[70px] px-4 sm:px-[40px] pt-10 sm:pt-12 pb-5 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <div className="font-semibold text-[11px] tracking-[0.18em] uppercase text-[#a3987f] mb-2">{t('showcase.eyebrow')}</div>
          <div className="font-bold text-2xl sm:text-[28px] uppercase text-[#13243c] font-heading">{t('showcase.title')}</div>
        </div>
        <Link href={localizedPath('/vehicules', language)} className="font-bold text-[13px] text-[#d9704f] whitespace-nowrap hover:underline">
          {t('home.viewAllVehicles')}
        </Link>
      </div>

      <div className="px-4 sm:px-[40px] pb-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading && <div className="col-span-full flex justify-center py-10"><Spinner className="h-8 w-8 text-[#13243c]" /></div>}
        {!loading && error && <div className="col-span-full rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">{error}</div>}
        {!loading && !error && lots.length === 0 && <div className="col-span-full py-10 text-center text-sm text-[#5a5e66]">{t('showcase.empty')}</div>}
    {lots.map((lot) => (
      <Link
        key={lot.id}
        href={localizedPath(`/vehicule/${lot.id}`, language)}
        className="group border border-[#eceadf] rounded-[14px] overflow-hidden flex flex-col shadow-[0_2px_10px_rgba(19,36,60,.05)] transition hover:shadow-[0_10px_26px_rgba(19,36,60,.14)]"
      >
        <div className="relative aspect-[4/3] bg-[#eef1f5] overflow-hidden">
          {lot.photoUrl ? <img src={lot.photoUrl} alt={`${lot.brand} ${lot.model}`} className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-[1.04]" /> : <div className="flex h-full items-center justify-center font-heading text-2xl font-bold text-[#8ea0bd]">{lot.brand.slice(0, 2).toUpperCase()}</div>}
          {lot.hasActiveOffer && <span className="absolute left-2.5 top-2.5 rounded-[7px] bg-[#e9f4ee] px-2.5 py-1.5 text-[11px] font-bold text-[#20754c] shadow-sm">✓ {t('vehicle.offerPlaced')}{lot.offerAmount != null ? ` · ${formatEuros(lot.offerAmount, language)}` : ''}</span>}
          {lot.session && (
            <span className="absolute top-2.5 right-2.5 font-bold text-[11px] text-white bg-[rgba(19,36,60,.78)] px-2.5 py-1.5 rounded-[7px] font-mono">
              {formatTimeLeft(lot.session?.endDate)}
            </span>
          )}
        </div>
        <div className="p-4 pb-[18px] flex flex-col flex-1">
          {lot.lotNumber && (
            <div className="mb-1.5">
              <span className="rounded-[5px] bg-[#faf1e4] px-2 py-0.5 font-mono text-[11px] font-bold text-[#b3893f]">
                {t('vehicle.lot', { number: String(lot.lotNumber) })}
              </span>
            </div>
          )}
          <div className="font-bold text-[17px] uppercase text-[#13243c] mb-4 font-heading">{[lot.brand, lot.model].filter(Boolean).join(' ')}</div>
          <div className="mt-auto">
            <span className="block w-full text-center font-bold text-xs text-white bg-[#13243c] group-hover:bg-slate-800 py-[11px] px-4 rounded-[8px] uppercase tracking-[0.02em] transition">
              {lot.session ? t('home.bidButton') : t('showcase.viewVehicle')}
            </span>
          </div>
        </div>
      </Link>
    ))}
      </div>
    </>
  );
}
