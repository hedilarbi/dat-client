'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../api';
import { useUser } from './LayoutWrapper';
import { getRoleHomePath, localizedPath, useLanguage } from '../i18n';
import Alert from './Alert';
import PageHeader from './PageHeader';
import { formatTimeLeft } from '../lib/currentSales';
import { formatEuros } from '../lib/format';

/** États calculés par le serveur (SELLER_PHASES dans sale.service.js). */
export type SellerPhase = 'depot' | 'en_vente';
type VehicleState =
  | 'brouillon' | 'en_validation' | 'a_corriger' | 'refuse'
  | 'en_attente' | 'programme' | 'encheres_ouvertes';

const PHASE_STATES: Record<SellerPhase, VehicleState[]> = {
  depot: ['a_corriger', 'brouillon', 'en_validation', 'refuse'],
  en_vente: ['encheres_ouvertes', 'programme', 'en_attente'],
};

/** Les états qui demandent une action du vendeur passent devant, et se voient en rouge. */
const ACTIONABLE_STATES: VehicleState[] = ['a_corriger', 'brouillon'];

const STATE_STYLES: Record<VehicleState, string> = {
  brouillon: 'bg-[#f1efe8] text-[#8a8270]',
  en_validation: 'bg-[#eef1f5] text-[#13243c]',
  a_corriger: 'bg-[#dc2626] text-white',
  refuse: 'bg-[#f1efe8] text-[#8a8270]',
  en_attente: 'bg-[#f1efe8] text-[#8a8270]',
  programme: 'bg-[#eef1f5] text-[#13243c]',
  encheres_ouvertes: 'bg-[#2563eb] text-white',
};

interface SellerVehicleRow {
  id: string;
  state: VehicleState;
  phase: SellerPhase | 'vente';
  refusalReasons: string[];
  refusalComment: string | null;
  lotNumber: number | null;
  reservePrice: number | null;
  listingCount: number;
  offerCount: number;
  vehicle: { id: string; brand: string; model: string; photoUrl: string | null } | null;
  session: { id: string; name: string; startDate: string; endDate: string; status: string } | null;
}

interface SellerVehicleListProps {
  phase: SellerPhase;
  /** Chemin canonique de la page, pour le retour après connexion */
  path: string;
}

export default function SellerVehicleList({ phase, path }: SellerVehicleListProps) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { language, t } = useLanguage();

  const [rows, setRows] = useState<SellerVehicleRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<VehicleState | 'all'>('all');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [, setClock] = useState(0);

  const states = PHASE_STATES[phase];

  const fetchVehicles = useCallback(() => apiRequest('/sales/seller')
    .then((res) => {
      const all: SellerVehicleRow[] = res.vehicleStates?.vehicles || [];
      setRows(all.filter((row) => row.phase === phase));
      setCounts(res.vehicleStates?.counts || {});
      setError('');
    })
    .catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : t('sellerSales.loadError'));
    })
    .finally(() => setLoaded(true)), [phase, t]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(localizedPath(path, language))}`, language));
    }
  }, [userLoading, user, router, language, path]);

  useEffect(() => {
    if (user && user.role !== 'vendeur') router.replace(localizedPath(getRoleHomePath(user.role), language));
  }, [user, router, language]);

  useEffect(() => {
    if (user?.role === 'vendeur' && user.status === 'valide') fetchVehicles();
  }, [fetchVehicles, user]);

  // Les comptes à rebours de clôture s'égrènent à la seconde
  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (userLoading || !user) {
    return <div className="flex-1 w-full bg-white p-8 text-sm font-medium text-[#5a5e66]">{t('sellerSales.loading')}</div>;
  }

  // Ce qui demande une action remonte : c'est la seule chose sur laquelle le vendeur peut agir.
  const sorted = [...rows].sort((a, b) => {
    const rank = (row: SellerVehicleRow) => states.indexOf(row.state);
    return rank(a) - rank(b);
  });
  const items = filter === 'all' ? sorted : sorted.filter((row) => row.state === filter);
  const actionable = rows.filter((row) => ACTIONABLE_STATES.includes(row.state)).length;

  const filters: Array<{ value: VehicleState | 'all'; label: string; count: number }> = [
    { value: 'all', label: t('sellerSales.filterAll'), count: rows.length },
    ...states.map((state) => ({ value: state, label: t(`sellerVehicles.state.${state}`), count: counts[state] || 0 })),
  ];

  return (
    <div className="flex-1 w-full bg-white p-6 font-sans text-black sm:p-[32px_40px_44px]">
      <PageHeader
        title={t(`sellerVehicles.title.${phase}`)}
        action={phase === 'depot' ? (
          <button
            type="button"
            onClick={() => router.push(localizedPath('/vendeur/dossiers/nouveau', language))}
            className="h-11 rounded-[9px] bg-[#d9704f] px-6 text-[13px] font-bold uppercase tracking-[0.03em] text-white transition hover:bg-[#c26040]"
          >
            {t('vehicleDossier.createButton')}
          </button>
        ) : undefined}
      />

      <p className="-mt-3 mb-5 max-w-[640px] text-[13px] leading-5 text-[#5a5e66]">
        {t(`sellerVehicles.intro.${phase}`)}
      </p>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {/* N'apparaît que s'il y a réellement quelque chose à faire : zéro action, zéro bruit. */}
      {phase === 'depot' && actionable > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-[12px] border border-[#f5c2c2] bg-[#fdf2f2] p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dc2626] text-[15px] font-bold text-white">!</span>
          <p className="text-[13px] font-semibold text-[#b91c1c]">
            {t('sellerVehicles.actionBanner', { count: String(actionable) })}
          </p>
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex items-center gap-2.5 mb-6 overflow-x-auto pb-1">
        {filters.map((option) => {
          const isActive = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-full font-semibold text-[12px] leading-none whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#d9704f] text-white font-bold'
                  : 'bg-white border border-[#e2ddd1] text-[#4c5058] hover:bg-gray-50'
              }`}
            >
              {option.label} {option.count}
            </button>
          );
        })}
      </div>

      {!loaded ? (
        <p className="py-10 text-sm text-[#5a5e66]">{t('sellerSales.loading')}</p>
      ) : items.length === 0 ? (
        <p className="rounded-[12px] bg-[#f8f7f2] p-8 text-center text-sm text-[#5a5e66]">
          {filter === 'all' ? t(`sellerVehicles.empty.${phase}`) : t(`sellerVehicles.emptyState.${filter}`)}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((row) => <VehicleCard key={row.id} row={row} language={language} t={t} />)}
        </div>
      )}
    </div>
  );
}

function VehicleCard({
  row, language, t,
}: {
  row: SellerVehicleRow;
  language: 'fr' | 'en';
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const title = [row.vehicle?.brand, row.vehicle?.model].filter(Boolean).join(' ') || '—';
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const needsAction = ACTIONABLE_STATES.includes(row.state);

  /** Une phrase sur ce qui se passe, jamais un statut brut. */
  const contextLine = () => {
    switch (row.state) {
      case 'brouillon': return t('sellerVehicles.context.brouillon');
      case 'en_validation': return t('sellerVehicles.context.en_validation');
      case 'a_corriger': {
        const reasons = row.refusalReasons.join(' · ');
        return reasons
          ? t('sellerVehicles.context.a_corriger_reason', { reasons })
          : t('sellerVehicles.context.a_corriger');
      }
      case 'refuse': {
        const reasons = row.refusalReasons.join(' · ');
        return reasons
          ? t('sellerVehicles.context.refuse_reason', { reasons })
          : t('sellerVehicles.context.refuse');
      }
      case 'en_attente': return t('sellerVehicles.context.en_attente');
      case 'programme': return row.session
        ? t('sellerVehicles.context.programme', { session: row.session.name, date: formatDate(row.session.startDate) })
        : '';
      case 'encheres_ouvertes': return row.session
        ? t('sellerVehicles.context.encheres_ouvertes', { time: formatTimeLeft(row.session.endDate) })
        : '';
    }
  };

  return (
    <article className={`overflow-hidden rounded-[14px] border bg-white ${needsAction ? 'border-[#f5c2c2]' : 'border-[#eceadf]'}`}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="h-[72px] w-full shrink-0 overflow-hidden rounded-[10px] bg-[#eef1f5] sm:w-[104px]">
          {row.vehicle?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.vehicle.photoUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-lg font-bold text-[#8ea0bd]">
              {(row.vehicle?.brand || '—').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-[16px] font-bold uppercase text-[#13243c]">{title}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATE_STYLES[row.state]}`}>
              {t(`sellerVehicles.state.${row.state}`)}
            </span>
            {row.lotNumber != null && (
              <span className="rounded-[5px] bg-[#faf1e4] px-2 py-0.5 font-mono text-[10px] font-bold text-[#b3893f]">
                {t('vehicle.lot', { number: String(row.lotNumber) })}
              </span>
            )}
          </div>

          <p className={`mt-1 text-xs ${needsAction ? 'font-semibold text-[#b91c1c]' : 'text-[#5a5e66]'}`}>
            {contextLine()}
          </p>
          {row.refusalComment && (
            <p className="mt-1 text-[11px] italic text-[#8a8578]">« {row.refusalComment} »</p>
          )}
        </div>

        <div className="shrink-0 text-left sm:text-right">
          {row.state === 'encheres_ouvertes' && (
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7a756a]">
              {t('sellerSales.offersReceived', { count: String(row.offerCount) })}
            </div>
          )}
          {row.reservePrice != null && (
            <div className="mt-1 text-[11px] text-[#5a5e66]">
              {t('sellerSales.reservePrice')} : <span className="font-mono font-bold">{formatEuros(row.reservePrice, language)}</span>
            </div>
          )}
        </div>

        <div className="shrink-0">
          <Link
            href={localizedPath(`/vendeur/dossiers/${row.id}`, language)}
            className={`text-[12px] font-bold hover:underline ${needsAction ? 'text-[#b91c1c]' : 'text-[#d9704f]'}`}
          >
            {needsAction ? t('sellerVehicles.fixAction') : t('profil.view')}
          </Link>
        </div>
      </div>
    </article>
  );
}
