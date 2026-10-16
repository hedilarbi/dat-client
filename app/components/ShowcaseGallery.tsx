'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../api';
import { localizedPath, useLanguage } from '../i18n';
import Spinner from './Spinner';

interface ShowcaseItem { id: string; imageUrl: string; brand?: string; model?: string; year?: number | null }

/**
 * Section « Prochainement à la vente » pour les visiteurs non connectés : les véhicules choisis par
 * l'administrateur. Chaque carte ouvre la fiche du véhicule, où aucune offre ne peut être déposée
 * sans compte.
 */
export default function ShowcaseGallery({ language, compact = false, hideWhenEmpty = false }: { language: 'fr' | 'en'; compact?: boolean; hideWhenEmpty?: boolean }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/public/showcase')
      .then((response) => setItems(Array.isArray(response.vehicles) ? response.vehicles : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Utilisateur connecté : la section ne s'affiche que s'il y a des véhicules annoncés
  if (hideWhenEmpty && (loading || items.length === 0)) return null;

  return (
    <section className={`px-4 sm:px-10 ${compact ? 'py-10' : 'py-12 sm:py-16'}`}>
      <div className="mb-6"><div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3987f]">{t('showcase.eyebrow')}</div><h2 className="font-heading text-[28px] font-bold uppercase text-[#13243c] sm:text-[34px]">{t('showcase.upcomingTitle')}</h2></div>
      {loading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8 text-[#13243c]" /></div>}
      {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-[#5a5e66]">{t('showcase.upcomingEmpty')}</p>}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Link key={item.id} href={localizedPath(`/vehicule/${item.id}`, language)} className="group block overflow-hidden rounded-[14px] bg-white shadow-[0_5px_18px_rgba(19,36,60,.1)] transition hover:shadow-[0_10px_26px_rgba(19,36,60,.18)]">
              <div className="aspect-[4/3] overflow-hidden bg-[#eef1f5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={[item.brand, item.model].filter(Boolean).join(' ')} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
              </div>
              <div className="flex items-center justify-between gap-3 p-3.5">
                <span className="truncate font-heading text-[16px] font-bold uppercase text-[#13243c]">{[item.brand, item.model].filter(Boolean).join(' ') || '—'}</span>
                <span className="shrink-0 text-[12px] font-bold text-[#d9704f]">{t('showcase.viewVehicle')} →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
