'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { localizedPath, useLanguage } from "./i18n";
import { formatTimeLeft, useCurrentSales } from "./lib/currentSales";
import { formatEuros } from "./lib/format";
import { isProfileReviewPending } from "./lib/userAccess";
import { DISPLAYED_STEP_COUNT, SELLER_DISPLAYED_STEP_COUNT, sellerStepDisplayNumber, stepDisplayNumber } from "./lib/saleSteps";
import { apiRequest } from "./api";
import { useUser } from "./components/LayoutWrapper";
import JsonLd from "./components/JsonLd";
import Spinner from "./components/Spinner";
import ShowcaseGallery from './components/ShowcaseGallery';
import { LotCards } from './components/ShowcaseLots';
import SalesFilterCard, { EMPTY_SALE_FILTERS, filtersToQueryString, type SaleFilters } from './components/SalesFilterCard';

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

interface HomeSaleReminder {
  id: string;
  amount: number | null;
  currentStep?: number | null;
  stepCount?: number | null;
  stepKey?: string | null;
  awaitingSeller?: boolean;
  vehicle: { brand?: string; model?: string; photoUrl?: string | null } | null;
  session: { name?: string | null } | null;
}

export default function Home() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [saleReminders, setSaleReminders] = useState<HomeSaleReminder[]>([]);
  // « Rechercher » ouvre la page des ventes en cours avec ces filtres déjà configurés
  const searchWithFilters = (selected: SaleFilters) => {
    const query = filtersToQueryString(selected);
    router.push(localizedPath(`/vehicules${query ? `?${query}` : ''}`, language));
  };
  // L'accueil ne montre que les 8 premiers lots : une seule page suffit. Les compteurs par marque
  // et le total viennent du serveur, qui les calcule sur l'ensemble des véhicules en session.
  const { vehicles, sessions, total, loading: salesLoading, error: salesError } = useCurrentSales({ pageSize: 8, enabled: !userLoading && Boolean(user) });
  const currentSession = sessions[0];
  // Le tag de session du hero n'existe que pour un utilisateur connecté. On ne conclut à « aucune
  // session » qu'une fois la réponse reçue (sinon le tag l'affichait pendant le chargement).
  const sessionReady = !userLoading && Boolean(user) && !salesLoading && !salesError;
  const currentSessionName = currentSession?.name || (language === 'fr' ? 'Aucune session ouverte' : 'No open session');
  const closingIn = formatTimeLeft(currentSession?.endDate);

  // Le français reste sur "/" (langue par défaut) ; l'anglais choisi précédemment
  // redirige automatiquement vers "/en" pour rester cohérent avec le reste du site.
  useEffect(() => {
    if (language === 'en') {
      router.replace('/en');
    }
  }, [language, router]);

  useEffect(() => {
    if (!user || (user.status !== 'valide' && !isProfileReviewPending(user)) || !['acheteur', 'vendeur'].includes(user.role)) {
      setSaleReminders([]);
      return;
    }

    const endpoint = user.role === 'vendeur' ? '/sales/seller' : '/sales/mine';
    apiRequest(endpoint)
      .then((res) => setSaleReminders((res.ongoing || []).slice(0, 3)))
      .catch(() => setSaleReminders([]));
  }, [user?._id, user?.role, user?.status]);

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
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": "https://dat-client.vercel.app/#organization",
            "name": "DealAutoPro",
            "url": "https://dat-client.vercel.app/",
            "logo": {
              "@type": "ImageObject",
              "url": "https://dat-client.vercel.app/assets/logo-dealautopro.png"
            }
          },
          {
            "@type": "WebSite",
            "@id": "https://dat-client.vercel.app/#website",
            "url": "https://dat-client.vercel.app/",
            "name": "DealAutoPro",
            "publisher": {"@id": "https://dat-client.vercel.app/#organization"},
            "inLanguage": ["fr-FR", "en"]
          }
        ]
      }} />
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
          {/* Tag de la session en cours : élément le plus visible du hero */}
          {user && <div className={`${sessionReady ? '' : 'invisible '}inline-flex max-w-full items-center gap-3 font-extrabold text-[13px] sm:text-[18px] leading-snug tracking-[0.1em] uppercase text-[#0c1626] bg-[#f0a067] px-4 sm:px-7 py-3 sm:py-4 rounded-[18px] sm:rounded-full w-fit mb-6 sm:mb-8 shadow-[0_0_0_4px_rgba(240,160,103,0.3),0_12px_32px_rgba(0,0,0,0.4)]`}>
            {currentSession && (
              <span className="relative flex h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0c1626] opacity-60" />
                <span className="relative inline-flex h-full w-full rounded-full bg-[#0c1626]" />
              </span>
            )}
            <span>{currentSession ? t('home.sessionStatus', { session: currentSessionName, time: closingIn }) : currentSessionName}</span>
          </div>}
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

      {user && (user.status === 'valide' || isProfileReviewPending(user)) && saleReminders.length > 0 && (
        <div className="px-4 sm:px-[40px] pt-8 sm:pt-10">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="font-semibold text-[11px] tracking-[0.18em] uppercase text-[#a3987f] mb-1.5">
                {language === 'fr' ? 'À reprendre' : 'To resume'}
              </div>
              <h2 className="font-bold text-[22px] sm:text-[26px] uppercase text-[#13243c] font-heading">
                {language === 'fr' ? 'Vos ventes en cours' : 'Your ongoing sales'}
              </h2>
            </div>
            <Link
              href={localizedPath(user.role === 'vendeur' ? '/vendeur/ventes' : '/acheteur/tableau-de-bord/mes-vehicules', language)}
              className="font-bold text-[13px] text-[#d9704f] whitespace-nowrap hover:underline"
            >
              {t('profil.viewAll')}
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {saleReminders.map((sale) => {
              const title = [sale.vehicle?.brand, sale.vehicle?.model].filter(Boolean).join(' ') || t('profil.vehicle');
              const href = user.role === 'vendeur'
                ? `/vendeur/ventes/${sale.id}`
                : `/acheteur/tableau-de-bord/mes-vehicules/${sale.id}`;
              const isActionExpected = user.role === 'vendeur' ? sale.awaitingSeller : [1, 3, 5, 6].includes(Number(sale.currentStep));
              return (
                <Link
                  key={sale.id}
                  href={localizedPath(href, language)}
                  className={`group flex items-center gap-4 rounded-[14px] border-2 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(19,36,60,.12)] ${isActionExpected ? 'border-[#d9704f]' : 'border-[#eceadf]'}`}
                >
                  <div className="h-[68px] w-[88px] shrink-0 overflow-hidden rounded-[9px] bg-[#13243c]">
                    {sale.vehicle?.photoUrl ? (
                      <img src={sale.vehicle.photoUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.04]" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-[15px] text-[#13243c]">{title}</div>
                    <div className="mt-1 truncate text-[12px] text-[#5a5e66]">{sale.session?.name || '—'}</div>
                    {sale.currentStep != null && sale.stepCount != null && (
                      <div className="mt-2 inline-flex rounded-full bg-[#f8f7f2] px-2.5 py-1 text-[11px] font-bold text-[#13243c]">
                        {user.role === 'vendeur'
                          ? t('dashboard.step', { current: sellerStepDisplayNumber(Number(sale.currentStep)), total: String(SELLER_DISPLAYED_STEP_COUNT) })
                          : t('dashboard.step', { current: stepDisplayNumber(Number(sale.currentStep)), total: String(DISPLAYED_STEP_COUNT) })}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[15px] font-bold text-[#13243c]">
                      {sale.amount != null ? formatEuros(sale.amount, language) : '—'}
                    </div>
                    <div className="mt-1 text-[11px] font-bold uppercase text-[#d9704f]">
                      {language === 'fr' ? 'Continuer' : 'Continue'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!userLoading && !user ? <ShowcaseGallery language={language} /> : <>
      {/* Session en cours : les premiers véhicules en vente ; sinon, la vitrine choisie par l'admin */}
      {salesLoading || currentSession ? (
        <>
          <div id="ventes-en-cours" className="scroll-mt-[70px] px-4 sm:px-[40px] pt-10 sm:pt-12 pb-5 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
            <div>
              <div className="font-semibold text-[11px] tracking-[0.18em] uppercase text-[#a3987f] mb-2">
                {currentSession ? t('home.sessionStatus', { session: currentSessionName, time: closingIn }) : ''}
              </div>
              <div className="font-bold text-2xl sm:text-[28px] uppercase text-[#13243c] font-heading">
                {t('home.lotsCount', { count: String(total) })}
              </div>
            </div>
            <Link href={localizedPath('/vehicules', language)} className="font-bold text-[13px] text-[#d9704f] whitespace-nowrap hover:underline">
              {t('home.viewAllVehicles')}
            </Link>
          </div>

          {/* Filtre, comme sur la page Véhicules : seulement quand une session est ouverte */}
          {currentSession && <SalesFilterCard filters={EMPTY_SALE_FILTERS} onApply={searchWithFilters} onReset={() => undefined} className="px-4 sm:px-[40px] pb-5" />}

          <div className="px-4 sm:px-[40px] pb-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {salesLoading && <div className="col-span-full flex justify-center py-10"><Spinner className="h-8 w-8 text-[#13243c]" /></div>}
            {!salesLoading && salesError && <div className="col-span-full rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">{salesError}</div>}
            {!salesLoading && !salesError && vehicles.length === 0 && <div className="col-span-full py-10 text-center text-sm text-[#5a5e66]">{t('home.noVehiclesInSession')}</div>}
            <LotCards lots={vehicles} language={language} />
          </div>
        </>
      ) : (
        // Connecté sans session en cours : « Prochainement à la vente »
        <ShowcaseGallery language={language} compact />
      )}
      </>}

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
            href={localizedPath('/vendre', language)}
            className="btn btn-secondary whitespace-nowrap shrink-0"
          >
            {t('home.sellerCta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
