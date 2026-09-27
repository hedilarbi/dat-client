'use client';

import React from 'react';
import { formatEuros } from '../lib/format';

interface TopOffersProps {
  offers?: number[] | null;
  reservePrice?: number | null;
  language: 'fr' | 'en';
  label: string;
  emptyLabel: string;
  className?: string;
}

export default function TopOffers({
  offers,
  reservePrice,
  language,
  label,
  emptyLabel,
  className = '',
}: TopOffersProps) {
  // Défensif côté interface : même si l'API change d'ordre, seules les trois meilleures
  // restent visibles et elles sont toujours présentées dans l'ordre croissant demandé.
  const topOffers = [...(offers || [])]
    .filter((amount) => Number.isFinite(amount))
    .sort((a, b) => b - a)
    .slice(0, 3)
    .sort((a, b) => a - b);

  return (
    <div className={`min-w-0 text-center ${className}`}>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#7a756a]">
        {label}
      </div>
      {topOffers.length === 0 ? (
        <span className="text-xs text-[#8a8578]">{emptyLabel}</span>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {topOffers.map((amount, index) => {
            const isBelowReserve = reservePrice != null && amount < reservePrice;
            return (
              <span
                key={`${amount}-${index}`}
                className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold ${
                  isBelowReserve
                    ? 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]'
                    : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                }`}
              >
                {formatEuros(amount, language)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
