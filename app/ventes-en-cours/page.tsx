'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { localizedPath, useLanguage } from '../i18n';
import { formatTimeLeft, useCurrentSales, type SalesAccessReason } from '../lib/currentSales';
import { useUser } from '../components/LayoutWrapper';
import SalesAccessBanner from '../components/SalesAccessBanner';
import SalesAccessModal from '../components/SalesAccessModal';
import vehicleCatalog from '../lib/vehicleCatalog.json';
import { ENERGY_OPTIONS, GEARBOX_OPTIONS, PROCEDURE_OPTIONS } from '../lib/vehicleLabels';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1714229157462-8b61df49e878?q=80&w=1800&auto=format&fit=crop';
const CURRENT_YEAR = new Date().getFullYear();

interface SaleFilters {
  brand: string;
  model: string;
  energy: string;
  procedure: string;
  gearbox: string;
  registrationCardAvailable: string;
  yearFrom: string;
  yearTo: string;
  mileageFrom: string;
  mileageTo: string;
}

const EMPTY_FILTERS: SaleFilters = { brand: '', model: '', energy: '', procedure: '', gearbox: '', registrationCardAvailable: '', yearFrom: '', yearTo: '', mileageFrom: '', mileageTo: '' };

export default function CurrentSalesPage() {
  const { language, t } = useLanguage();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<SaleFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<SaleFilters>(EMPTY_FILTERS);
  const fr = language === 'fr';

  // Le filtrage est appliqué en base : sans ça il ne porterait que sur les pages déjà chargées.
  const {
    vehicles: lots, sessions, total, loading, loadingMore, error, hasMore, canLoadMore, loadMore,
  } = useCurrentSales({ filters });

  // Le droit de charger la suite se décide sur la session, comme l'affichage des boutons
  // dans l'en-tête : `user` est connu dès le premier rendu, alors que `access` du serveur
  // n'arrive qu'avec la réponse. Tant que la session est en cours de chargement, on refuse —
  // un doute doit fermer l'accès, jamais l'ouvrir.
  const { user, loading: userLoading } = useUser();
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

  const brands = vehicleCatalog.map((entry) => entry.brand);
  const models = vehicleCatalog.find((entry) => entry.brand === draftFilters.brand)?.models || [];
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const updateDraft = (key: keyof SaleFilters, value: string) => setDraftFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => { setDraftFilters(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); };
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
        <div className="rounded-[14px] border border-[#eceadf] bg-white shadow-[0_16px_34px_rgba(19,36,60,.16)]">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
            <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#13243c]">{fr ? 'Affiner les véhicules' : 'Refine vehicles'}</p>{activeFilterCount > 0 && <p className="mt-1 text-xs text-[#d9704f]">{activeFilterCount} {fr ? 'filtre(s) appliqué(s)' : 'active filter(s)'}</p>}</div>
            <div className="flex gap-2">
              {activeFilterCount > 0 && <button type="button" onClick={resetFilters} className="btn btn-secondary">{fr ? 'Réinitialiser' : 'Reset'}</button>}
              <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="flex h-10 items-center gap-2 rounded-[8px] bg-[#13243c] px-5 text-[11px] font-bold uppercase text-white hover:bg-[#1a3050]"><span aria-hidden="true">☷</span>{filtersOpen ? (fr ? 'Fermer' : 'Close') : (fr ? 'Afficher les filtres' : 'Show filters')}</button>
            </div>
          </div>

          {filtersOpen && <div className="border-t border-[#efece3] p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Filter label={fr ? 'Marque' : 'Brand'} value={draftFilters.brand} onChange={(value) => setDraftFilters((current) => ({ ...current, brand: value, model: '' }))}><option value="">{fr ? 'Toutes les marques' : 'All brands'}</option>{brands.map((item) => <option key={item}>{item}</option>)}</Filter>
              <Filter label={fr ? 'Modèle' : 'Model'} value={draftFilters.model} onChange={(value) => updateDraft('model', value)} disabled={!draftFilters.brand}><option value="">{draftFilters.brand ? (fr ? 'Tous les modèles' : 'All models') : (fr ? 'Choisir une marque' : 'Choose a brand')}</option>{models.map((item) => <option key={item}>{item}</option>)}</Filter>
              <Filter label={fr ? 'Énergie' : 'Energy'} value={draftFilters.energy} onChange={(value) => updateDraft('energy', value)}><option value="">{fr ? 'Toutes les énergies' : 'All energies'}</option>{ENERGY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{fr ? item.fr : item.en}</option>)}</Filter>
              <Filter label={fr ? 'Procédure' : 'Procedure'} value={draftFilters.procedure} onChange={(value) => updateDraft('procedure', value)}><option value="">{fr ? 'Toutes les procédures' : 'All procedures'}</option>{PROCEDURE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</Filter>
              <Filter label={fr ? 'Boîte de vitesse' : 'Gearbox'} value={draftFilters.gearbox} onChange={(value) => updateDraft('gearbox', value)}><option value="">{fr ? 'Toutes' : 'All'}</option>{GEARBOX_OPTIONS.map((item) => <option key={item.value} value={item.value}>{fr ? item.fr : item.en}</option>)}</Filter>
              <Filter label={fr ? 'Carte grise disponible' : 'Registration document available'} value={draftFilters.registrationCardAvailable} onChange={(value) => updateDraft('registrationCardAvailable', value)}><option value="">{fr ? 'Toutes' : 'All'}</option><option value="true">{fr ? 'Oui' : 'Yes'}</option><option value="false">{fr ? 'Non' : 'No'}</option></Filter>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberFilter label={fr ? 'Année de' : 'Year from'} value={draftFilters.yearFrom} onChange={(value) => updateDraft('yearFrom', value)} placeholder="2015" />
              <NumberFilter label={fr ? 'Année à' : 'Year to'} value={draftFilters.yearTo} onChange={(value) => updateDraft('yearTo', value)} placeholder={String(CURRENT_YEAR)} />
              <NumberFilter label={fr ? 'Kilométrage de' : 'Mileage from'} value={draftFilters.mileageFrom} onChange={(value) => updateDraft('mileageFrom', value)} placeholder="0" />
              <NumberFilter label={fr ? 'Kilométrage à' : 'Mileage to'} value={draftFilters.mileageTo} onChange={(value) => updateDraft('mileageTo', value)} placeholder="200000" />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={resetFilters} className="btn btn-secondary">{fr ? 'Effacer' : 'Clear'}</button><button type="button" onClick={() => { setFilters(draftFilters); setFiltersOpen(false); }} className="h-11 rounded-[9px] bg-[#d9704f] px-7 text-xs font-bold uppercase text-white hover:bg-[#c66042]">{t('home.searchButton')}</button></div>
          </div>}
        </div>
      </section>

      <section className="flex items-end justify-between px-4 pb-[22px] pt-2 sm:px-10">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#a3987f]">
            {sessionName}{currentSession ? ` · ${fr ? 'clôture dans' : 'closes in'} ${sessionTimeLeft}` : ''}
          </p>
          <h2 className="font-heading text-[28px] font-bold uppercase leading-none text-[#13243c]">
            {fr ? `${total} véhicules aux enchères` : `${total} vehicles at auction`}
          </h2>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 px-4 pb-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
        {loading && <p className="col-span-full py-12 text-center text-sm text-[#5a5e66]">Chargement des véhicules…</p>}
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

        {loadingMore && (
          <p className="py-6 text-center text-sm text-[#5a5e66]">{t('sales.loadingMore')}</p>
        )}

        {!loading && !error && !mayLoadMore && hasMore && (
          <>
            <div ref={gateRef} aria-hidden="true" className="h-px" />
            <SalesAccessBanner
              reason={lockedReason}
              returnPath={localizedPath('/ventes-en-cours', language)}
            />
          </>
        )}

        {!loading && !error && !hasMore && lots.length > 0 && (
          <p className="py-2 text-center text-xs text-[#5a5e66]">{t('sales.endOfList')}</p>
        )}
      </section>

      <SalesAccessModal
        open={accessModalOpen}
        reason={lockedReason}
        returnPath={localizedPath('/ventes-en-cours', language)}
        onClose={() => setAccessModalOpen(false)}
      />
    </main>
  );
}

function Filter({ label, value, onChange, children, disabled = false }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <label className="min-w-[170px] flex-1">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.06em] text-[#5a5e66]">{label}</span>
      <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-[9px] border border-[#dcd7cb] bg-white px-3.5 text-sm font-medium text-[#5a5e66] outline-none focus:border-[#13243c] disabled:cursor-not-allowed disabled:bg-[#f1efe8] disabled:text-[#9a917d]">
        {children}
      </select>
    </label>
  );
}

function NumberFilter({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.06em] text-[#5a5e66]">{label}</span><input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-[9px] border border-[#dcd7cb] bg-white px-3.5 text-sm font-medium text-[#5a5e66] outline-none focus:border-[#13243c]" /></label>;
}
