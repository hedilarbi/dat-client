'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import Spinner from './Spinner';

interface ShowcaseItem { id: string; imageUrl: string }

export default function ShowcaseGallery({ language, compact = false }: { language: 'fr' | 'en'; compact?: boolean }) {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/public/showcase')
      .then((response) => setItems(Array.isArray(response.vehicles) ? response.vehicles : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={`px-4 sm:px-10 ${compact ? 'py-10' : 'py-12 sm:py-16'}`}>
      <div className="mb-6"><div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3987f]">{language === 'fr' ? 'Sélection DealAutoPro' : 'DealAutoPro selection'}</div><h2 className="font-heading text-[28px] font-bold uppercase text-[#13243c] sm:text-[34px]">{language === 'fr' ? 'Notre vitrine' : 'Our showroom'}</h2></div>
      {loading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8 text-[#13243c]" /></div>}
      {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-[#5a5e66]">{language === 'fr' ? 'La vitrine sera bientôt disponible.' : 'The showroom will be available soon.'}</p>}
      {!loading && items.length > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((item) => <div key={item.id} className="aspect-[4/3] overflow-hidden rounded-[14px] bg-[#eef1f5] shadow-[0_5px_18px_rgba(19,36,60,.1)]"><img src={item.imageUrl} alt="" className="h-full w-full object-cover" /></div>)}</div>}
    </section>
  );
}
