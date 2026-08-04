'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '../i18n';
import { formatTimeLeft, useCurrentSales } from '../lib/currentSales';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1714229157462-8b61df49e878?q=80&w=1800&auto=format&fit=crop';
export default function CurrentSalesPage() {
  const { language, t } = useLanguage();
  const { vehicles, sessions, loading, error } = useCurrentSales();
  const [brand, setBrand] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [filters, setFilters] = useState({ brand: '', year: '', mileage: '' });
  const fr = language === 'fr';

  const lots = useMemo(() => vehicles.filter((lot) => {
    if (filters.brand && lot.brand !== filters.brand) return false;
    if (filters.year && (lot.year == null || lot.year < Number(filters.year))) return false;
    if (filters.mileage && (lot.mileage == null || lot.mileage > Number(filters.mileage))) return false;
    return true;
  }), [filters, vehicles]);
  const brands = [...new Set(vehicles.map((vehicle) => vehicle.brand).filter(Boolean))];
  const currentSession = sessions[0];
  const sessionName = currentSession?.name || (fr ? 'Aucune session ouverte' : 'No open session');
  const sessionTimeLeft = formatTimeLeft(currentSession?.endDate);

  return (
    <main className="min-h-screen bg-white font-sans text-black">
      <section className="relative h-[430px] sm:h-[460px] overflow-hidden bg-[#0b1423]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_IMAGE} alt="Véhicule proposé aux enchères" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,20,35,.94)_0%,rgba(11,20,35,.72)_42%,rgba(11,20,35,.18)_78%)]" />
        <div className="relative flex h-full flex-col justify-center px-4 pb-14 sm:px-10 sm:pb-[70px]">
          <p className="mb-[18px] text-[11px] font-bold uppercase tracking-[.3em] text-[#e2a175] sm:text-xs">
            {fr ? "Plateforme d'enchères B2B" : 'B2B auction platform'}
          </p>
          <h1 className="mb-[18px] max-w-[820px] font-heading text-[48px] font-extrabold uppercase leading-[.94] tracking-[-.01em] text-white sm:text-[76px]">
            {fr ? <>Roulez sur<br />de vraies affaires</> : <>Drive into<br />real opportunities</>}
          </h1>
          <p className="max-w-[500px] text-[15px] leading-6 text-[#c3cedd] sm:text-base">
            {fr
              ? 'Des véhicules professionnels vérifiés, mis aux enchères chaque semaine entre concessionnaires et casses agréées.'
              : 'Verified professional vehicles auctioned every week between dealers and approved dismantlers.'}
          </p>
        </div>
      </section>

      <section className="relative z-2 -mt-[38px] mb-5 px-4 sm:px-10">
        <div className="flex flex-wrap items-end gap-4 rounded-[14px] border border-[#eceadf] bg-white p-5 shadow-[0_16px_34px_rgba(19,36,60,.16)] sm:px-[26px] sm:py-[22px]">
          <Filter label={t('home.filterBrand')} value={brand} onChange={setBrand}>
            <option value="">{t('home.filterBrandValue')}</option>
            {brands.map((item) => <option key={item}>{item}</option>)}
          </Filter>
          <Filter label={t('home.filterYear')} value={year} onChange={setYear}>
            <option value="">{t('home.filterYearValue')}</option>
            <option value="2020">2020 et après</option>
            <option value="2018">2018 et après</option>
            <option value="2015">2015 et après</option>
          </Filter>
          <Filter label={t('home.filterMileage')} value={mileage} onChange={setMileage}>
            <option value="">{t('home.filterMileageValue')}</option>
            <option value="75000">75 000 km</option>
            <option value="100000">100 000 km</option>
            <option value="150000">150 000 km</option>
            <option value="200000">200 000 km</option>
          </Filter>
          <button
            type="button"
            onClick={() => setFilters({ brand, year, mileage })}
            className="h-12 rounded-[9px] bg-[#13243c] px-[30px] text-[13px] font-bold uppercase tracking-[.03em] text-white transition hover:bg-[#1a3050]"
          >
            {t('home.searchButton')}
          </button>
        </div>
      </section>

      <section className="flex items-end justify-between px-4 pb-[22px] pt-2 sm:px-10">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#a3987f]">
            {sessionName}{currentSession ? ` · ${fr ? 'clôture dans' : 'closes in'} ${sessionTimeLeft}` : ''}
          </p>
          <h2 className="font-heading text-[28px] font-bold uppercase leading-none text-[#13243c]">
            {fr ? `${lots.length} véhicules aux enchères` : `${lots.length} vehicles at auction`}
          </h2>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 px-4 pb-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
        {loading && <p className="col-span-full py-12 text-center text-sm text-[#5a5e66]">Chargement des véhicules…</p>}
        {!loading && error && <p className="col-span-full rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">{error}</p>}
        {!loading && !error && lots.length === 0 && <p className="col-span-full py-12 text-center text-sm text-[#5a5e66]">{fr ? 'Aucun véhicule dans une session en cours.' : 'No vehicles in an active session.'}</p>}
        {lots.map((lot) => (
          <article key={lot.id} className="flex flex-col overflow-hidden rounded-[14px] border border-[#eceadf] bg-white">
            <div className="relative aspect-4/3 bg-[#eef1f5]">
              {lot.photoUrl ? <img src={lot.photoUrl} alt={`${lot.brand} ${lot.model}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-heading text-2xl font-bold text-[#8ea0bd]">{lot.brand.slice(0, 2).toUpperCase()}</div>}
              <span className="absolute right-2.5 top-2.5 rounded-[7px] bg-[rgba(19,36,60,.78)] px-2.5 py-1.5 font-mono text-[11px] font-bold text-white">{formatTimeLeft(lot.session?.endDate)}</span>
            </div>
            <div className="flex flex-1 flex-col p-4 pb-[18px]">
              <p className="mb-1.5 text-[11px] font-semibold text-[#5a5e66]">{lot.session?.name}</p>
              <h3 className="mb-1 font-heading text-[17px] font-bold uppercase leading-tight text-[#13243c]">{[lot.brand, lot.model].filter(Boolean).join(' ')}</h3>
              <p className="mb-4 text-xs leading-[1.4] text-[#5a5e66]">
                {lot.year || '—'} · {lot.mileage != null ? `${lot.mileage.toLocaleString('fr-FR')} km` : '—'}
              </p>
              <button type="button" className="mt-auto w-full rounded-lg bg-[#13243c] px-4 py-[11px] text-xs font-bold uppercase tracking-[.02em] text-white transition hover:bg-[#1a3050]">
                {t('home.bidButton')}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="min-w-[170px] flex-1">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.06em] text-[#5a5e66]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-[9px] border border-[#dcd7cb] bg-white px-3.5 text-sm font-medium text-[#5a5e66] outline-none focus:border-[#13243c]">
        {children}
      </select>
    </label>
  );
}
