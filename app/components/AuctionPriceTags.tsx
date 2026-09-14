'use client';

import React from 'react';
import { useLanguage } from '../i18n';
import { formatEuros } from '../lib/format';

/**
 * Les deux repères d'un véhicule pendant sa session : la meilleure offre reçue et le prix
 * de réserve fixé par le vendeur. Deux couleurs les distinguent d'un coup d'œil — vert pour
 * ce que le marché propose, bleu pour le seuil du vendeur — sur le tableau de bord comme
 * sur la liste « mes véhicules en vente ».
 */
export default function AuctionPriceTags({
  bestOffer,
  reservePrice,
  className = '',
}: {
  bestOffer: number | null | undefined;
  reservePrice: number | null | undefined;
  className?: string;
}) {
  const { language, t } = useLanguage();

  return (
    <div className={`flex flex-wrap items-stretch gap-2 ${className}`}>
      <div className="rounded-[8px] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#15803d]">
          {t('sellerSales.bestOffer')}
        </div>
        <div className="font-mono text-[15px] font-bold text-[#16a34a]">
          {bestOffer != null ? formatEuros(bestOffer, language) : t('sellerSales.noOfferYet')}
        </div>
      </div>

      <div className="rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#1d4ed8]">
          {t('sellerSales.reservePrice')}
        </div>
        <div className="font-mono text-[15px] font-bold text-[#2563eb]">
          {reservePrice != null ? formatEuros(reservePrice, language) : '—'}
        </div>
      </div>
    </div>
  );
}
