'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { localizedPath, useLanguage } from "./i18n";
import { formatTimeLeft, useCurrentSales } from "./lib/currentSales";

const HERO_IMAGE = 'https://images.unsplash.com/photo-1714229157462-8b61df49e878?q=80&w=1800&auto=format&fit=crop';
const HOW_IT_WORKS_IMAGE = 'https://images.unsplash.com/photo-1772440223098-cc23f6f01209?q=80&w=1200&auto=format&fit=crop';
const CTA_IMAGE = 'https://images.unsplash.com/photo-1692807381316-e51140a7a00f?q=80&w=1600&auto=format&fit=crop';
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M9 12.5 11.2 15 16 9" />
      <circle cx="12" cy="12" r="9.2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.6" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
      <path d="M4 13.5a8 8 0 0 1 16 0" />
      <path d="M4 13.5v4a1.6 1.6 0 0 0 1.6 1.6H6a1.6 1.6 0 0 0 1.6-1.6v-2A1.6 1.6 0 0 0 6 13.9H4Z" />
      <path d="M20 13.5v4a1.6 1.6 0 0 1-1.6 1.6H18a1.6 1.6 0 0 1-1.6-1.6v-2a1.6 1.6 0 0 1 1.6-1.6H20Z" />
    </svg>
  );
}

export default function Home() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const { vehicles, sessions, loading: salesLoading, error: salesError } = useCurrentSales();
  const currentSession = sessions[0];
  const currentSessionName = currentSession?.name || (language === 'fr' ? 'Aucune session ouverte' : 'No open session');
  const closingIn = formatTimeLeft(currentSession?.endDate);
  const brands = Object.entries(vehicles.reduce<Record<string, number>>((counts, vehicle) => {
    if (vehicle.brand) counts[vehicle.brand] = (counts[vehicle.brand] || 0) + 1;
    return counts;
  }, {})).map(([name, count]) => ({ name, count }));

  // Le français reste sur "/" (langue par défaut) ; l'anglais choisi précédemment
  // redirige automatiquement vers "/en" pour rester cohérent avec le reste du site.
  useEffect(() => {
    if (language === 'en') {
      router.replace('/en');
    }
  }, [language, router]);

  const searchFilters = [
    { label: t('home.filterBrand'), value: t('home.filterBrandValue') },
    { label: t('home.filterYear'), value: t('home.filterYearValue') },
    { label: t('home.filterMileage'), value: t('home.filterMileageValue') },
  ];

  const trustPoints = [
    { icon: <CheckIcon />, label: t('home.trustVerified') },
    { icon: <LockIcon />, label: t('home.trustPayment') },
    { icon: <SupportIcon />, label: t('home.trustSupport') },
  ];

  const steps = [
    { n: 1, title: t('home.step1Title'), text: t('home.step1Text') },
    { n: 2, title: t('home.step2Title'), text: t('home.step2Text') },
    { n: 3, title: t('home.step3Title'), text: t('home.step3Text') },
  ];

  return (
    <div className="bg-white text-black font-sans">
      {/* Hero */}
      <div className="relative h-[420px] sm:h-[600px] overflow-hidden bg-[#0c1626]">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg,rgba(8,15,27,.55) 0%,rgba(8,15,27,.35) 38%,rgba(8,15,27,.97) 92%),linear-gradient(100deg,rgba(8,15,27,.96) 0%,rgba(8,15,27,.55) 46%,rgba(8,15,27,.1) 76%)',
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-[40px] pointer-events-none">
          <div className="inline-flex items-center gap-2 font-bold text-[11px] tracking-[0.28em] uppercase text-[#0c1626] bg-[#e2a175] px-4 py-2.5 rounded-full w-fit mb-5">
            ● {currentSession ? t('home.sessionStatus', { session: currentSessionName, time: closingIn }) : currentSessionName}
          </div>
          <h1 className="m-0 mb-5 font-extrabold text-[46px] sm:text-[76px] leading-[.94] uppercase text-white max-w-[840px] font-heading tracking-[-.01em]">
            {t('home.heroTitleLine1')}<br />{t('home.heroTitleLine2')}
          </h1>
          <div className="text-[15px] sm:text-[17px] leading-[1.55] text-[#c3cedd] max-w-[500px] mb-8">
            {t('home.heroSubtitle')}
          </div>
          <div className="flex flex-wrap gap-6 sm:gap-9">
            {trustPoints.map((pt, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-[22px] h-[22px] text-white shrink-0">{pt.icon}</div>
                <div className="font-semibold text-[12px] text-[#e6ebf2]">{pt.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 sm:px-[40px] -mt-8 sm:-mt-[42px] relative z-[2] mb-10 sm:mb-[52px]">
        <div className="bg-white border border-[#eceadf] rounded-[14px] shadow-[0_20px_44px_rgba(8,15,27,.22)] p-5 sm:p-[22px_26px] flex flex-wrap items-end gap-4">
          {searchFilters.map((filt, i) => (
            <div key={i} className="flex-1 min-w-[170px]">
              <div className="font-semibold text-[10px] text-[#5a5e66] uppercase tracking-[0.06em] mb-2">{filt.label}</div>
              <div className="h-12 border border-[#dcd7cb] rounded-[9px] flex items-center justify-between px-3.5 font-medium text-sm text-[#5a5e66]">
                <span>{filt.value}</span><span className="text-[#5a5e66] text-[11px]">▾</span>
              </div>
            </div>
          ))}
          <button type="button" className="h-12 px-8 rounded-[9px] bg-[#13243c] hover:bg-slate-800 text-white font-bold text-[13px] uppercase tracking-[0.03em] whitespace-nowrap transition cursor-pointer">
            {t('home.searchButton')}
          </button>
        </div>
      </div>

      {/* Brands */}
      <div className="px-4 sm:px-[40px] pb-6">
        <div className="font-semibold text-[11px] tracking-[0.2em] uppercase text-[#a3987f] mb-2.5">{t('home.brandsEyebrow')}</div>
        <div className="font-bold text-[26px] sm:text-[30px] uppercase text-[#13243c] mb-5 font-heading">{t('home.brandsTitle')}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {brands.map(brand => (
            <div key={brand.name} className="border border-[#eceadf] rounded-[14px] p-6 sm:p-[26px_16px] flex flex-col items-center gap-3">
              <div className="font-bold text-xl text-[#13243c] font-heading">{brand.name}</div>
              <div className="font-medium text-xs text-[#5a5e66]">{t('home.brandLots', { count: String(brand.count) })}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lots grid */}
      <div id="ventes-en-cours" className="scroll-mt-[70px] px-4 sm:px-[40px] pt-10 sm:pt-12 pb-5 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <div className="font-semibold text-[11px] tracking-[0.18em] uppercase text-[#a3987f] mb-2">
            {currentSession ? t('home.sessionStatus', { session: currentSessionName, time: closingIn }) : currentSessionName}
          </div>
          <div className="font-bold text-2xl sm:text-[28px] uppercase text-[#13243c] font-heading">
            {t('home.lotsCount', { count: String(vehicles.length) })}
          </div>
        </div>
        <Link href={localizedPath('/ventes-en-cours', language)} className="font-bold text-[13px] text-[#d9704f] whitespace-nowrap hover:underline">
          {t('home.viewAllVehicles')}
        </Link>
      </div>

      <div className="px-4 sm:px-[40px] pb-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {salesLoading && <div className="col-span-full py-10 text-center text-sm text-[#5a5e66]">Chargement des véhicules…</div>}
        {!salesLoading && salesError && <div className="col-span-full rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">{salesError}</div>}
        {!salesLoading && !salesError && vehicles.length === 0 && <div className="col-span-full py-10 text-center text-sm text-[#5a5e66]">Aucun véhicule dans une session en cours.</div>}
        {vehicles.slice(0, 8).map((lot) => (
          <div key={lot.id} className="border border-[#eceadf] rounded-[14px] overflow-hidden flex flex-col shadow-[0_2px_10px_rgba(19,36,60,.05)]">
            <div className="relative aspect-[4/3] bg-[#eef1f5] overflow-hidden">
              {lot.photoUrl ? <img src={lot.photoUrl} alt={`${lot.brand} ${lot.model}`} className="absolute inset-0 w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center font-heading text-2xl font-bold text-[#8ea0bd]">{lot.brand.slice(0, 2).toUpperCase()}</div>}
              <span className="absolute top-2.5 right-2.5 font-bold text-[11px] text-white bg-[rgba(19,36,60,.78)] px-2.5 py-1.5 rounded-[7px] font-mono">
                {formatTimeLeft(lot.session?.endDate)}
              </span>
            </div>
            <div className="p-4 pb-[18px] flex flex-col flex-1">
              <div className="font-bold text-[17px] uppercase text-[#13243c] mb-4 font-heading">{[lot.brand, lot.model].filter(Boolean).join(' ')}</div>
              <div className="mt-auto">
                <button type="button" className="w-full font-bold text-xs text-white bg-[#13243c] hover:bg-slate-800 py-[11px] px-4 rounded-[8px] uppercase tracking-[0.02em] transition cursor-pointer">
                  {t('home.bidButton')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div id="a-propos" className="scroll-mt-[70px] bg-[#f8f7f2] px-4 sm:px-[40px] py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8 sm:gap-[52px] items-center">
        <div>
          <div className="font-semibold text-[11px] tracking-[0.2em] uppercase text-[#a3987f] mb-2.5">{t('home.howEyebrow')}</div>
          <div className="font-bold text-[28px] sm:text-[36px] leading-[1.05] uppercase text-[#13243c] mb-6 font-heading">{t('home.howTitle')}</div>
          <div className="flex flex-col gap-5">
            {steps.map(step => (
              <div key={step.n} className="flex gap-4">
                <div className="w-[38px] h-[38px] shrink-0 rounded-[9px] bg-[#13243c] text-white flex items-center justify-center font-bold text-base font-heading">
                  {step.n}
                </div>
                <div>
                  <div className="font-bold text-base uppercase text-[#13243c] mb-1 font-heading">{step.title}</div>
                  <div className="text-[13px] leading-[1.55] text-[#5a5e66]">{step.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative rounded-[18px] overflow-hidden h-[280px] sm:h-[420px]">
          <img src={HOW_IT_WORKS_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(19,36,60,.08)] pointer-events-none" />
        </div>
      </div>

      {/* Seller CTA */}
      <div className="relative h-auto sm:h-[340px] overflow-hidden">
        <img src={CTA_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(100deg,rgba(11,20,35,.96) 0%,rgba(11,20,35,.85) 50%,rgba(11,20,35,.55) 100%)' }}
        />
        <div className="relative h-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 sm:gap-10 px-4 sm:px-[40px] py-12 sm:py-0">
          <div className="max-w-[560px]">
            <div className="font-bold text-xs tracking-[0.2em] uppercase text-[#e2a175] mb-3.5">{t('home.sellerEyebrow')}</div>
            <div className="font-bold text-[26px] sm:text-[34px] leading-[1.15] uppercase text-white mb-3.5 font-heading">{t('home.sellerTitle')}</div>
            <div className="text-sm leading-[1.6] text-[#c3cedd]">{t('home.sellerText')}</div>
          </div>
          <Link
            href={localizedPath('/vendre-avec-nous', language)}
            className="font-bold text-sm text-[#13243c] bg-white hover:bg-gray-100 px-8 py-4 rounded-[9px] uppercase tracking-[0.03em] whitespace-nowrap transition shrink-0"
          >
            {t('home.sellerCta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
