'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatEuros } from '../lib/format';
import { localizedPath, useLanguage } from '../i18n';
import { formatTimeLeft, useCurrentSales, type SalesAccessReason } from '../lib/currentSales';
import { useUser } from '../components/LayoutWrapper';
import SalesAccessBanner from '../components/SalesAccessBanner';
import SalesAccessModal from '../components/SalesAccessModal';
import SalesFilterCard, { filtersFromSearchParams, type SaleFilters } from '../components/SalesFilterCard';
import Spinner from '../components/Spinner';
import JsonLd from '../components/JsonLd';
import ShowcaseGallery from '../components/ShowcaseGallery';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1714229157462-8b61df49e878?q=80&w=1800&auto=format&fit=crop';

// Filtres préparés ailleurs (accueil) : la page s'ouvre déjà filtrée, ex. /vehicules?brand=Renault&yearFrom=2018
export default function CurrentSalesPageWithFilters() {
  return (
    <Suspense fallback={null}>
      <CurrentSalesPage />
    </Suspense>
  );
}

function CurrentSalesPage() {
  const { language, t } = useLanguage();
  const { user, loading: userLoading } = useUser();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SaleFilters>(() => filtersFromSearchParams(searchParams));
  const fr = language === 'fr';

  // Le filtrage est appliqué en base : sans ça il ne porterait que sur les pages déjà chargées.
  const {
    vehicles: lots, sessions, total, loading, loadingMore, error, hasMore, canLoadMore, loadMore,
  } = useCurrentSales({ filters, enabled: !userLoading && Boolean(user) });

  // Le droit de charger la suite se décide sur la session, comme l'affichage des boutons
  // dans l'en-tête : `user` est connu dès le premier rendu, alors que `access` du serveur
  // n'arrive qu'avec la réponse. Tant que la session est en cours de chargement, on refuse —
  // un doute doit fermer l'accès, jamais l'ouvrir.
  const sessionAllowsMore = !userLoading
    && Boolean(user)
    && (user?.role === 'admin' || user?.status === 'valide');

  // Les deux conditions doivent tenir : la session côté client, et l'autorisation du serveur.
  const mayLoadMore = sessionAllowsMore && canLoadMore;

  // Le motif affiché se déduit de la MÊME source que la garde. `accessReason` vient de la
  // réponse serveur et vaut 'ok' tant qu'elle n'est pas arrivée : s'y fier affichait
  // « compte en cours de validation » à un visiteur qui n'a pas de compte du tout.
  const lockedReason: SalesAccessReason = user ? 'account_not_validated' : 'anonymous';

  // Sentinelle de bas de liste : dès qu'elle entre dans le viewport, la page suivante est chargée
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || !mayLoadMore) return;

    const observer = new IntersectionObserver((entries) => {
      // Revérifié à l'instant du déclenchement : un rappel déjà en file s'exécute même
      // après `disconnect()`.
      if (!sessionAllowsMore) return;
      if (entries.some((entry) => entry.isIntersecting)) loadMore();
    }, { rootMargin: '320px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mayLoadMore, sessionAllowsMore, hasMore, loadMore]);

  // Accès restreint : la même sentinelle, mais elle ouvre la modale d'inscription au lieu
  // de charger la page suivante. Elle n'apparaît qu'une fois par consultation — la rouvrir
  // à chaque passage transformerait le défilement en harcèlement.
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const accessModalShownRef = useRef(false);
  const gateRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const gate = gateRef.current;
    if (!gate || mayLoadMore || !hasMore || loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      if (accessModalShownRef.current) return;
      accessModalShownRef.current = true;
      setAccessModalOpen(true);
    }, { rootMargin: '160px' });

    observer.observe(gate);
    return () => observer.disconnect();
  }, [mayLoadMore, hasMore, loading]);

  // Un changement de filtres reconstitue une liste : la modale redevient pertinente.
  useEffect(() => {
    accessModalShownRef.current = false;
  }, [filters]);

  const currentSession = sessions[0];
  const sessionName = currentSession?.name || (fr ? 'Aucune session ouverte' : 'No open session');
  const sessionTimeLeft = formatTimeLeft(currentSession?.endDate);

  return (
    <main className="min-h-screen bg-white font-sans text-black">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Véhicules accidentés et sinistrés disponibles",
        "description": "Consultez les véhicules accidentés, sinistrés ou non roulants disponibles.",
        "url": "https://dat-client.vercel.app/fr/vehicules"
      }} />
      <section className="relative h-[430px] sm:h-[460px] overflow-hidden bg-[#0b1423]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_IMAGE} alt="Véhicule proposé à la vente" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,20,35,.94)_0%,rgba(11,20,35,.72)_42%,rgba(11,20,35,.18)_78%)]" />
        <div className="relative flex h-full flex-col justify-center px-4 pb-14 sm:px-10 sm:pb-[70px]">
          <p className="mb-[18px] text-[11px] font-bold uppercase tracking-[.3em] text-[#e2a175] sm:text-xs">
            {fr ? "Plateforme d'offres B2B" : 'B2B offer platform'}
          </p>
          <h1 className="mb-[18px] max-w-[820px] font-heading text-[48px] font-extrabold uppercase leading-[.94] tracking-[-.01em] text-white sm:text-[76px]">
            {fr ? <>Roulez sur<br />de vraies affaires</> : <>Drive into<br />real opportunities</>}
          </h1>
          <p className="max-w-[500px] text-[15px] leading-6 text-[#c3cedd] sm:text-base">
            {fr
              ? 'Des véhicules professionnels vérifiés, proposés chaque semaine entre concessionnaires et casses agréées.'
              : 'Verified professional vehicles offered every week between dealers and approved dismantlers.'}
          </p>
        </div>
      </section>

      {!userLoading && !user && <ShowcaseGallery language={language} compact />}

      <div className={!userLoading && !user ? 'hidden' : undefined}>
      <SalesFilterCard filters={filters} onApply={setFilters} className="relative z-2 -mt-[38px] mb-5 px-4 sm:px-10" />

      <section className="flex items-end justify-between px-4 pb-[22px] pt-2 sm:px-10">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#a3987f]">
            {sessionName}{currentSession ? ` · ${fr ? 'clôture dans' : 'closes in'} ${sessionTimeLeft}` : ''}
          </p>
          <h2 className="font-heading text-[28px] font-bold uppercase leading-none text-[#13243c]">
            {fr ? `${total} véhicules en vente` : `${total} vehicles for sale`}
          </h2>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 px-4 pb-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
        {loading && <div className="col-span-full flex justify-center py-12"><Spinner className="h-8 w-8 text-[#13243c]" /></div>}
        {!loading && error && <p className="col-span-full rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">{error}</p>}
        {!loading && !error && lots.length === 0 && <p className="col-span-full py-12 text-center text-sm text-[#5a5e66]">{fr ? 'Aucun véhicule dans une session en cours.' : 'No vehicles in an active session.'}</p>}
        {!loading && lots.map((lot) => (
          <Link
            key={lot.id}
            href={localizedPath(`/vehicule/${lot.id}`, language)}
            className="group flex flex-col overflow-hidden rounded-[14px] border border-[#eceadf] bg-white transition hover:shadow-[0_10px_26px_rgba(19,36,60,.14)]"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-[#eef1f5]">
              {lot.photoUrl ? <img src={lot.photoUrl} alt={`${lot.brand} ${lot.model}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" /> : <div className="flex h-full items-center justify-center font-heading text-2xl font-bold text-[#8ea0bd]">{lot.brand.slice(0, 2).toUpperCase()}</div>}
              {lot.hasActiveOffer && <span className="absolute left-2.5 top-2.5 rounded-[7px] bg-[#e9f4ee] px-2.5 py-1.5 text-[11px] font-bold text-[#20754c] shadow-sm">✓ {t('vehicle.offerPlaced')}{lot.offerAmount != null ? ` · ${formatEuros(lot.offerAmount, language)}` : ''}</span>}
              <span className="absolute right-2.5 top-2.5 rounded-[7px] bg-[rgba(19,36,60,.78)] px-2.5 py-1.5 font-mono text-[11px] font-bold text-white">{formatTimeLeft(lot.session?.endDate)}</span>
            </div>
            <div className="flex flex-1 flex-col p-4 pb-[18px]">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                {lot.lotNumber && (
                  <span className="rounded-[5px] bg-[#faf1e4] px-2 py-0.5 font-mono text-[11px] font-bold text-[#b3893f]">
                    {t('vehicle.lot', { number: String(lot.lotNumber) })}
                  </span>
                )}
                <span className="text-[11px] font-semibold text-[#5a5e66]">{lot.session?.name}</span>
              </div>
              <h3 className="mb-1 font-heading text-[17px] font-bold uppercase leading-tight text-[#13243c]">{[lot.brand, lot.model].filter(Boolean).join(' ')}</h3>
              <p className="mb-4 text-xs leading-[1.4] text-[#5a5e66]">
                {lot.year || '—'} · {lot.mileage != null ? `${lot.mileage.toLocaleString('fr-FR')} km` : '—'}
              </p>
              <span className="mt-auto block w-full rounded-lg bg-[#13243c] px-4 py-[11px] text-center text-xs font-bold uppercase tracking-[.02em] text-white transition group-hover:bg-[#1a3050]">
                {t('home.bidButton')}
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="px-4 pb-16 sm:px-10">
        {!loading && !error && lots.length > 0 && (
          <p className="mb-4 text-center text-xs font-semibold text-[#5a5e66]">
            {t('sales.shownCount', { shown: String(lots.length), total: String(total) })}
          </p>
        )}

        {/* Chargement progressif : la sentinelle déclenche la page suivante en approchant du bas */}
        {mayLoadMore && hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

        {loadingMore && <div className="flex justify-center py-6"><Spinner className="h-6 w-6 text-[#13243c]" /></div>}

        {!loading && !error && !mayLoadMore && hasMore && (
          <>
            <div ref={gateRef} aria-hidden="true" className="h-px" />
            <SalesAccessBanner
              reason={lockedReason}
              returnPath={localizedPath('/vehicules', language)}
            />
          </>
        )}

        {!loading && !error && !hasMore && lots.length > 0 && (
          <p className="py-2 text-center text-xs text-[#5a5e66]">{t('sales.endOfList')}</p>
        )}
      </section>

      {!userLoading && user && <ShowcaseGallery language={language} compact hideWhenEmpty />}

      <SalesAccessModal
        open={accessModalOpen}
        reason={lockedReason}
        returnPath={localizedPath('/vehicules', language)}
        onClose={() => setAccessModalOpen(false)}
      />
      </div>
    </main>
  );
}
