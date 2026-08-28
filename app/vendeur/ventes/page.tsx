'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../api';
import { useUser } from '../../components/LayoutWrapper';
import { getRoleHomePath, localizedPath, useLanguage } from '../../i18n';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import { formatTimeLeft } from '../../lib/currentSales';
import { formatEuros } from '../../lib/format';

/**
 * États d'un véhicule côté vendeur, calculés par le serveur (SELLER_VEHICLE_STATES).
 * Ils s'excluent mutuellement et couvrent tout le cycle, de la validation à la vente.
 */
type VehicleState = 'vente_en_cours' | 'vendu' | 'vente_annulee';

// Cette page ne couvre que la phase 3 : un acheteur existe, on suit la procédure.
const STATE_ORDER: VehicleState[] = ['vente_en_cours', 'vendu', 'vente_annulee'];

const STATE_STYLES: Record<VehicleState, string> = {
  vente_en_cours: 'bg-[#f97316] text-white',
  vendu: 'bg-[#16a34a] text-white',
  vente_annulee: 'bg-[#f1efe8] text-[#8a8270]',
};

interface SellerVehicleRow {
  id: string;
  state: VehicleState;
  phase: string;
  lotNumber: number | null;
  reservePrice: number | null;
  listingCount: number;
  offerCount: number;
  vehicle: { id: string; brand: string; model: string; photoUrl: string | null; registrationNumber: string | null } | null;
  session: { id: string; name: string; startDate: string; endDate: string; status: string } | null;
  sale: { id: string; status: string; amount: number | null; currentStep: number | null; stepCount: number; wonAt: string | null; closedAt: string | null } | null;
}

type Counts = Record<VehicleState, number>;

const EMPTY_COUNTS: Counts = { vente_en_cours: 0, vendu: 0, vente_annulee: 0 };

export default function SellerSalesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { language, t } = useLanguage();

  const [rows, setRows] = useState<SellerVehicleRow[]>([]);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [filter, setFilter] = useState<VehicleState | 'all'>('all');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [, setClock] = useState(0);

  const fetchSales = useCallback(() => apiRequest('/sales/seller')
    .then((res) => {
      // Seuls les véhicules ayant trouvé un acheteur : les deux phases amont ont leurs
      // propres écrans sous « Mes véhicules ».
      const all = res.vehicleStates?.vehicles || [];
      setRows(all.filter((row: SellerVehicleRow) => row.phase === 'vente'));
      setCounts({ ...EMPTY_COUNTS, ...(res.vehicleStates?.counts || {}) });
      setError('');
    })
    .catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : t('sellerSales.loadError'));
    })
    .finally(() => setLoaded(true)), [t]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(localizedPath('/vendeur/ventes', language))}`, language));
    }
  }, [userLoading, user, router, language]);

  useEffect(() => {
    if (user && user.role !== 'vendeur') router.replace(localizedPath(getRoleHomePath(user.role), language));
  }, [user, router, language]);

  useEffect(() => {
    if (user?.role === 'vendeur' && (user.status === 'valide' || user.status === 'suspendu')) fetchSales();
  }, [fetchSales, user]);

  // Les comptes à rebours de clôture s'égrènent à la seconde
  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (userLoading || !user) {
    return <div className="flex-1 w-full bg-white p-8 text-sm font-medium text-[#5a5e66]">{t('sellerSales.loading')}</div>;
  }

  const total = STATE_ORDER.reduce((sum, state) => sum + counts[state], 0);
  const items = filter === 'all' ? rows : rows.filter((row) => row.state === filter);

  const filters: Array<{ value: VehicleState | 'all'; label: string; count: number }> = [
    { value: 'all', label: t('sellerSales.filterAll'), count: total },
    ...STATE_ORDER.map((state) => ({
      value: state,
      label: t(`sellerSales.state.${state}`),
      count: counts[state],
    })),
  ];

  return (
    <div className="flex-1 w-full bg-white p-6 font-sans text-black sm:p-[32px_40px_44px]">
      <PageHeader title={t('sellerSales.title')} />

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

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
          {filter === 'all' ? t('sellerSales.emptyAll') : t(`sellerSales.empty.${filter}`)}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((row) => <VehicleRowCard key={row.id} row={row} language={language} t={t} />)}
        </div>
      )}
    </div>
  );
}

function VehicleRowCard({
  row, language, t,
}: {
  row: SellerVehicleRow;
  language: 'fr' | 'en';
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const title = ([row.vehicle?.brand, row.vehicle?.model].filter(Boolean).join(' ') + (row.vehicle?.registrationNumber ? ` (${row.vehicle.registrationNumber})` : '')).trim() || '—';
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  /** Ce que dit la deuxième ligne dépend entièrement de l'état : chacun a son information utile. */
  const contextLine = () => {
    switch (row.state) {
      case 'vente_annulee':
        return t('sellerSales.contextCancelled');
      case 'vente_en_cours':
        return row.sale?.currentStep != null
          ? t('dashboard.step', { current: String(row.sale.currentStep), total: String(row.sale.stepCount) })
          : row.session?.name || null;
      case 'vendu':
        return row.sale?.closedAt ? t('sellerSales.closedOn', { date: formatDate(row.sale.closedAt) || '—' }) : null;
    }
  };

  const isSaleOngoing = row.state === 'vente_en_cours';
  const isSaleClosed = row.state === 'vendu';

  return (
    <article className="overflow-hidden rounded-[16px] border border-[#e2ddd1] bg-white transition-all duration-200 hover:shadow-lg shadow-xs">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        {/* Photo du véhicule */}
        <div className="h-[84px] w-full shrink-0 overflow-hidden rounded-[12px] bg-[#eef1f5] sm:w-[120px] relative">
          {row.vehicle?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.vehicle.photoUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-xl font-bold text-[#8ea0bd]">
              {(row.vehicle?.brand || '—').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Détails du véhicule et de la session */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-[18px] font-bold uppercase text-[#13243c] tracking-tight">{title}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATE_STYLES[row.state]}`}>
              {t(`sellerSales.state.${row.state}`)}
            </span>
            {row.lotNumber != null && (
              <span className="rounded-[5px] bg-[#faf1e4] px-2 py-0.5 font-mono text-[10px] font-bold text-[#b3893f]">
                {t('vehicle.lot', { number: String(row.lotNumber) })}
              </span>
            )}
            <span className="rounded-full bg-[#f1efe8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5a5e66]">
              {t('sellerSales.attempts', { count: String(row.listingCount) })}
            </span>
          </div>

          <p className="mt-1 text-xs text-[#5a5e66] font-medium">{contextLine()}</p>
        </div>

        {/* Prix */}
        <div className="shrink-0 text-left sm:text-right border-t border-[#f1efe8] pt-3 sm:border-t-0 sm:pt-0">
          {row.sale?.amount != null && (isSaleClosed || isSaleOngoing) ? (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#7a756a]">
                {isSaleClosed ? t('sellerSales.soldFor') : t('sellerSales.awardedFor')}
              </div>
              <div className="font-mono text-[20px] font-bold text-[#13243c]">{formatEuros(row.sale.amount, language)}</div>
            </>
          ) : (
            row.reservePrice != null ? (
              <div className="text-[11px] text-[#5a5e66]">
                {t('sellerSales.reservePrice')} : <span className="font-mono font-bold text-[#13243c]">{formatEuros(row.reservePrice, language)}</span>
              </div>
            ) : null
          )}
        </div>

        {/* Bouton d'action principal */}
        <div className="shrink-0 pt-2 sm:pt-0">
          <Link
            href={localizedPath(
              row.sale && (isSaleOngoing || isSaleClosed)
                ? `/vendeur/ventes/${row.sale.id}`
                : `/vendeur/dossiers/${row.id}`,
              language,
            )}
            className={`inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-[12px] font-bold uppercase tracking-[0.03em] transition cursor-pointer ${
              !isSaleOngoing
                ? 'bg-[#f1efe8] text-[#13243c] hover:bg-[#e4e1d5]'
                : 'bg-[#13243c] text-white hover:bg-[#1c3050] shadow-xs'
            }`}
          >
            {!isSaleOngoing ? t('sales.viewSale') : `${t('dashboard.trackSale')} →`}
          </Link>
        </div>
      </div>
    </article>
  );
}
