'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '../../../api';
import { useUser } from '../../../components/LayoutWrapper';
import { getRoleHomePath, localizedPath, useLanguage } from '../../../i18n';
import Alert from '../../../components/Alert';
import { UnderReviewNotice, SuspendedNotice } from '../../../components/RegistrationStatusNotices';
import { formatEuros } from '../../../lib/format';

// Miroir de PURCHASE_STEPS (server/models/sale.model.js)
const STEP_KEYS = ['commission', 'virement', 'certificats', 'validation_vendeur', 'enlevement'] as const;

interface WonSale {
  id: string;
  amount: number | null;
  status: 'en_cours' | 'cloturee' | 'en_attente_confirmation';
  currentStep: number;
  stepKey: string | null;
  stepCount: number;
  currentStepDueAt: string | null;
  wonAt: string | null;
  closedAt: string | null;
  fees: { commission: number; taxName: string; taxRate: number; taxAmount: number; total: number } | null;
  vehicle: { id: string; brand: string; model: string; photoUrl: string | null; registrationNumber: string | null } | null;
  session: { id: string; name: string; endDate: string } | null;
}

type SaleFilter = 'ongoing' | 'closed';

/** Compte à rebours lisible ; null une fois l'échéance dépassée. */
function timeLeft(dueAt: string | null): string | null {
  if (!dueAt) return null;
  const remaining = new Date(dueAt).getTime() - Date.now();
  if (remaining <= 0) return null;

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function WonSalesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const { language, t } = useLanguage();

  const [ongoing, setOngoing] = useState<WonSale[]>([]);
  const [closed, setClosed] = useState<WonSale[]>([]);
  const [filter, setFilter] = useState<SaleFilter>('ongoing');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  // L'e-mail de gain pointe vers ?vente=<id> : la vente concernée est mise en avant
  const highlightedSaleId = searchParams.get('vente');

  const fetchSales = useCallback(() => apiRequest('/sales/mine')
    .then((res) => {
      setOngoing(res.ongoing || []);
      setClosed(res.closed || []);
      setError('');
    })
    .catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : t('sales.wonLoadError'));
    })
    .finally(() => setLoaded(true)), [t]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(localizedPath('/acheteur/tableau-de-bord/mes-vehicules', language))}`, language));
    }
  }, [userLoading, user, router, language]);

  useEffect(() => {
    if (user && user.role !== 'acheteur') {
      router.replace(localizedPath(getRoleHomePath(user.role), language));
    }
  }, [user, router, language]);

  useEffect(() => {
    if (user?.role === 'acheteur' && user.status === 'valide') fetchSales();
  }, [fetchSales, user]);

  if (userLoading || !user) {
    return <div className="flex-1 w-full bg-white p-8 text-sm font-medium text-[#5a5e66]">{t('sales.wonLoading')}</div>;
  }

  if (user.status !== 'valide' && user.status !== 'suspendu') {
    return <UnderReviewNotice />;
  }

  const sales = filter === 'ongoing' ? ongoing : closed;

  return (
    <div className="flex-1 w-full bg-white p-6 font-sans text-black sm:p-[32px_40px_44px] min-h-full">
      <Link href={localizedPath('/acheteur/tableau-de-bord', language)} className="text-[13px] font-bold text-[#13243c] hover:underline flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Retour au tableau de bord
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="font-heading text-[28px] font-bold uppercase text-[#13243c] sm:text-[36px]">{t('sales.wonPageTitle')}</h1>
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      <div className="flex items-center gap-2.5 mb-6 overflow-x-auto pb-1">
        {([
          { value: 'ongoing' as const, label: t('sales.filterOngoing'), count: ongoing.length },
          { value: 'closed' as const, label: t('sales.filterClosed'), count: closed.length },
        ]).map((option) => {
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
        <p className="py-10 text-sm text-[#5a5e66]">{t('sales.wonLoading')}</p>
      ) : sales.length === 0 ? (
        <p className="rounded-[12px] bg-[#f8f7f2] p-8 text-center text-sm text-[#5a5e66]">
          {filter === 'ongoing' ? t('sales.emptyOngoing') : t('sales.emptyClosed')}
        </p>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <SaleCard key={sale.id} sale={sale} language={language} t={t} highlighted={sale.id === highlightedSaleId} />
          ))}
        </div>
      )}
    </div>
  );
}

function SaleCard({
  sale, language, t, highlighted,
}: {
  sale: WonSale;
  language: 'fr' | 'en';
  t: (key: string, params?: Record<string, string>) => string;
  highlighted: boolean;
}) {
  const title = ([sale.vehicle?.brand, sale.vehicle?.model].filter(Boolean).join(' ') + (sale.vehicle?.registrationNumber ? ` (${sale.vehicle.registrationNumber})` : '')).trim() || '—';
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const [, setClock] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setClock((c) => c + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = timeLeft(sale.currentStepDueAt);
  const stepName = sale.stepKey ? t(`sales.step.${sale.stepKey}`) : '';

  return (
    <article className={`overflow-hidden rounded-[16px] border bg-white transition-all duration-200 hover:shadow-lg ${highlighted ? 'border-[#d9704f] ring-2 ring-[#d9704f]/20 shadow-md' : 'border-[#e2ddd1] shadow-xs'}`}>
      {/* Informations principales de la vente */}
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        {/* Photo du véhicule */}
        <div className="h-[84px] w-full shrink-0 overflow-hidden rounded-[12px] bg-[#eef1f5] sm:w-[120px] relative">
          {sale.vehicle?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sale.vehicle.photoUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-xl font-bold text-[#8ea0bd]">
              {(sale.vehicle?.brand || '—').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Détails du véhicule et de la session */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-[18px] font-bold uppercase text-[#13243c] tracking-tight">{title}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sale.status === 'cloturee' ? 'bg-[#e9f4ee] text-[#2f6f4f]' : 'bg-[#fdf6f2] text-[#d9704f] border border-[#f7d6cb]'}`}>
              {sale.status === 'cloturee' ? t('sales.filterClosed') : t('sales.filterOngoing')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5a5e66]">
            {sale.session?.name && (
              <span className="inline-flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a3987f]" />
                {sale.session.name}
              </span>
            )}
            <span className="text-[11px] text-[#8a8578]">
              {sale.status === 'cloturee' && sale.closedAt
                ? t('sales.closedOn', { date: formatDate(sale.closedAt) })
                : sale.wonAt
                  ? t('sales.wonOn', { date: formatDate(sale.wonAt) })
                  : ''}
            </span>
          </div>
        </div>

        {/* Prix */}
        <div className="shrink-0 text-left sm:text-right border-t border-[#f1efe8] pt-3 sm:border-t-0 sm:pt-0">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[#7a756a]">{t('sales.wonAmount')}</div>
          <div className="font-mono text-[20px] font-bold text-[#13243c]">
            {sale.amount != null ? formatEuros(sale.amount, language) : '—'}
          </div>
          {sale.fees && (
            <div className="mt-0.5 text-[11px] text-[#5a5e66]">
              {t('sales.wonTotal')} : <span className="font-mono font-bold text-[#13243c]">{formatEuros(sale.fees.total, language)}</span>
            </div>
          )}
        </div>

        {/* Bouton d'action principal */}
        <div className="shrink-0 pt-2 sm:pt-0">
          <Link
            href={localizedPath(`/acheteur/tableau-de-bord/mes-vehicules/${sale.id}`, language)}
            className={`inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-[12px] font-bold uppercase tracking-[0.03em] transition cursor-pointer ${
              sale.status === 'cloturee'
                ? 'bg-[#f1efe8] text-[#13243c] hover:bg-[#e4e1d5]'
                : 'bg-[#13243c] text-white hover:bg-[#1c3050] shadow-xs'
            }`}
          >
            {sale.status === 'cloturee' ? t('sales.viewSale') : `${t('sales.continuePurchase')} →`}
          </Link>
        </div>
      </div>

      {/* Bandeau d'invitation pour les réattributions en attente de réponse */}
      {sale.status === ('en_attente_confirmation' as any) && (
        <div className="border-t border-[#f7d6cb] bg-[#fff5f2] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#d9704f] flex items-center gap-1.5">
              <span>🎉</span> Nouveau véhicule attribué suite à désistement !
            </div>
            <div className="text-[12px] text-gray-700 font-medium">
              Souhaitez-vous acquérir ce véhicule pour <strong>{sale.amount != null ? formatEuros(sale.amount, language) : '—'}</strong> ? (Sans pénalité en cas de refus)
            </div>
          </div>
          <Link
            href={localizedPath(`/acheteur/tableau-de-bord/mes-vehicules/${sale.id}`, language)}
            className="inline-flex h-9 items-center justify-center rounded-[8px] bg-[#d9704f] hover:bg-[#b04a2c] text-white text-[11px] font-bold uppercase px-4 transition shrink-0 shadow-xs"
          >
            Répondre à l'offre →
          </Link>
        </div>
      )}

      {/* Bandeau d'avancement de l'étape et décompte pour les ventes en cours */}
      {sale.status === 'en_cours' && (
        <div className="border-t border-[#efece3] bg-[#faf9f5] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#13243c] text-[11px] font-bold text-white font-mono">
              {sale.currentStep}
            </span>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#d9704f]">
                Étape {sale.currentStep} sur {sale.stepCount}
              </div>
              <div className="text-[13px] font-bold text-[#13243c]">
                {stepName}
              </div>
            </div>
          </div>

          {remaining ? (
            <div className="flex items-center gap-2 rounded-full bg-red-50 border border-red-200/80 px-3.5 py-1 text-[12px] font-bold text-red-700 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>Temps restant : <strong className="font-mono text-[13px]">{remaining}</strong></span>
            </div>
          ) : (
            <div className="text-[11px] font-semibold text-[#8a8578] italic">
              Échéance en cours
            </div>
          )}
        </div>
      )}
    </article>
  );
}
