'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../api';
import { useUser } from '../../../components/LayoutWrapper';
import { getRoleHomePath, localizedPath, useLanguage } from '../../../i18n';
import Alert from '../../../components/Alert';
import BidModal from '../../../components/BidModal';
import ConfirmModal from '../../../components/ConfirmModal';
import { UnderReviewNotice, SuspendedNotice } from '../../../components/RegistrationStatusNotices';
import { formatTimeLeft } from '../../../lib/currentSales';
import { formatEuros } from '../../../lib/format';

interface BuyerOffer {
  id: string;
  amount: number;
  fees: { commission: number; taxName: string; taxRate: number; taxAmount: number; total: number };
  status: 'active' | 'annulee';
  ongoing: boolean;
  revisionCount: number;
  createdAt: string;
  cancelledAt: string | null;
  vehicle: { id: string; brand: string; model: string; photoUrl: string | null } | null;
  session: { id: string; name: string; endDate: string; status: string } | null;
}

const vehicleTitle = (offer: BuyerOffer) =>
  [offer.vehicle?.brand, offer.vehicle?.model].filter(Boolean).join(' ') || '—';

export default function MyOffersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { language, t } = useLanguage();

  const [ongoing, setOngoing] = useState<BuyerOffer[]>([]);
  const [past, setPast] = useState<BuyerOffer[]>([]);
  const [tab, setTab] = useState<'ongoing' | 'past'>('ongoing');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingOffer, setEditingOffer] = useState<BuyerOffer | null>(null);
  const [offerToCancel, setOfferToCancel] = useState<BuyerOffer | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [, setClock] = useState(0);

  const fetchOffers = useCallback(() => apiRequest('/offers/mine')
    .then((res) => {
      setOngoing(res.ongoing || []);
      setPast(res.past || []);
      setError('');
    })
    .catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : t('offers.loadError'));
    })
    .finally(() => setLoaded(true)), [t]);

  // Non connecté : renvoi vers la connexion, avec retour sur cette page
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(localizedPath('/acheteur/tableau-de-bord/mes-offres', language))}`, language));
    }
  }, [userLoading, user, router, language]);

  // Les offres sont propres aux acheteurs : un vendeur est renvoyé vers son espace
  useEffect(() => {
    if (user && user.role !== 'acheteur') {
      router.replace(localizedPath(getRoleHomePath(user.role), language));
    }
  }, [user, router, language]);

  useEffect(() => {
    if (user?.role === 'acheteur' && user.status === 'valide') fetchOffers();
  }, [fetchOffers, user]);

  // Rafraîchit les comptes à rebours de clôture de session
  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCancel = async () => {
    if (!offerToCancel) return;
    setCancelling(true);
    setError('');
    try {
      await apiRequest(`/offers/${offerToCancel.id}/cancel`, { method: 'POST' });
      setMessage(t('offers.cancelSuccess'));
      setOfferToCancel(null);
      await fetchOffers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('offers.loadError'));
    } finally {
      setCancelling(false);
    }
  };

  if (userLoading || !user) {
    return <div className="flex-1 w-full bg-white p-8 text-sm font-medium text-[#5a5e66]">{t('offers.loading')}</div>;
  }

  if (user.status !== 'valide' && user.status !== 'suspendu') {
    return <UnderReviewNotice />;
  }

  return (
    <div className="flex-1 w-full bg-white p-6 font-sans text-black sm:p-[32px_40px_44px] min-h-full">
      <Link href={localizedPath('/acheteur/tableau-de-bord', language)} className="text-[13px] font-bold text-[#13243c] hover:underline flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Retour au tableau de bord
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="font-heading text-[28px] font-bold uppercase text-[#13243c] sm:text-[36px]">{t('offers.pageTitle')}</h1>
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}
      {message && <Alert variant="success" className="mb-5">{message}</Alert>}

      {!loaded ? (
        <p className="py-10 text-sm text-[#5a5e66]">{t('offers.loading')}</p>
      ) : (
        <div>
          {/* Un seul jeu d'offres à la fois : les deux tableaux empilés obligeaient à
              faire défiler pour atteindre l'historique, alors que l'action utile est
              toujours sur les offres en cours. */}
          <div className="flex items-center gap-2.5 mb-6 overflow-x-auto pb-1" role="tablist">
            <TabButton
              active={tab === 'ongoing'}
              count={ongoing.length}
              label={t('offers.ongoingTitle')}
              onClick={() => setTab('ongoing')}
            />
            <TabButton
              active={tab === 'past'}
              count={past.length}
              label={t('offers.pastTitle')}
              onClick={() => setTab('past')}
            />
          </div>

          {tab === 'ongoing' ? (
            ongoing.length === 0 ? (
              <div className="rounded-[12px] bg-[#f8f7f2] p-8 text-center">
                <p className="mb-4 text-sm text-[#5a5e66]">{t('offers.emptyOngoing')}</p>
                <Link href={localizedPath('/ventes-en-cours', language)} className="btn btn-primary">
                  {t('offers.browseSales')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {ongoing.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    language={language}
                    t={t}
                    onEdit={() => setEditingOffer(offer)}
                    onCancel={() => { setMessage(''); setOfferToCancel(offer); }}
                  />
                ))}
              </div>
            )
          ) : past.length === 0 ? (
            <p className="rounded-[12px] bg-[#f8f7f2] p-6 text-center text-sm text-[#5a5e66]">{t('offers.emptyPast')}</p>
          ) : (
            <div className="space-y-3">
              {past.map((offer) => (
                <OfferCard key={offer.id} offer={offer} language={language} t={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {editingOffer && editingOffer.vehicle && (
        <BidModal
          vehicleId={editingOffer.vehicle.id}
          vehicleTitle={vehicleTitle(editingOffer)}
          offerId={editingOffer.id}
          initialAmount={editingOffer.amount}
          onClose={() => setEditingOffer(null)}
          onSaved={fetchOffers}
        />
      )}

      <ConfirmModal
        open={offerToCancel !== null}
        title={t('offers.cancelConfirmTitle')}
        message={offerToCancel
          ? t('offers.cancelConfirmText', {
              amount: formatEuros(offerToCancel.amount, language),
              vehicle: vehicleTitle(offerToCancel),
            })
          : ''}
        confirmLabel={t('offers.cancelAction')}
        cancelLabel={t('offers.keepOffer')}
        danger
        onConfirm={handleCancel}
        onCancel={() => { if (!cancelling) setOfferToCancel(null); }}
      />
    </div>
  );
}

function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-semibold text-[12px] leading-none whitespace-nowrap transition-all cursor-pointer ${
        active
          ? 'bg-[#d9704f] text-white font-bold'
          : 'bg-white border border-[#e2ddd1] text-[#4c5058] hover:bg-gray-50'
      }`}
    >
      {label} {count}
    </button>
  );
}

function OfferCard({
  offer, language, t, onEdit, onCancel,
}: {
  offer: BuyerOffer;
  language: 'fr' | 'en';
  t: (key: string, params?: Record<string, string>) => string;
  onEdit?: () => void;
  onCancel?: () => void;
}) {
  const title = vehicleTitle(offer);
  const status = offer.status === 'annulee'
    ? { label: t('offers.statusCancelled'), className: 'bg-[#f1efe8] text-[#5a5e66]' }
    : offer.ongoing
      ? { label: t('offers.statusActive'), className: 'bg-[#e9f4ee] text-[#2f6f4f]' }
      : { label: t('offers.statusSessionClosed'), className: 'bg-[#eef1f5] text-[#13243c]' };

  return (
    <article className={`flex flex-col gap-4 rounded-[14px] border border-[#eceadf] bg-white p-4 sm:flex-row sm:items-center ${offer.status === 'annulee' ? 'opacity-70' : ''}`}>
      <div className="h-[72px] w-full shrink-0 overflow-hidden rounded-[10px] bg-[#eef1f5] sm:w-[104px]">
        {offer.vehicle?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.vehicle.photoUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-heading text-lg font-bold text-[#8ea0bd]">
            {(offer.vehicle?.brand || '—').slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-[16px] font-bold uppercase text-[#13243c]">{title}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${status.className}`}>{status.label}</span>
        </div>
        <p className="mt-1 text-xs text-[#5a5e66]">
          {offer.session?.name}
          {offer.ongoing && offer.session?.endDate && ` · ${t('offers.closesIn')} ${formatTimeLeft(offer.session.endDate)}`}
        </p>
        <p className="mt-1 text-[11px] text-[#8a8578]">
          {t('offers.placedOn', { date: new Date(offer.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) })}
          {offer.revisionCount > 0 && ` · ${t('offers.revised', { count: String(offer.revisionCount) })}`}
        </p>
      </div>

      <div className="shrink-0 text-left sm:text-right">
        <div className="text-[10px] font-bold uppercase tracking-wide text-[#7a756a]">{t('offers.yourAmount')}</div>
        <div className="font-mono text-[18px] font-bold text-[#13243c]">{formatEuros(offer.amount, language)}</div>
        <div className="mt-1 text-[11px] text-[#5a5e66]">
          {t('offers.totalIfWon')} : <span className="font-mono font-bold">{formatEuros(offer.fees.total, language)}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
        {offer.vehicle && (
          <Link
            href={localizedPath(`/vehicule/${offer.vehicle.id}`, language)}
            className="btn btn-secondary"
          >
            {t('offers.viewVehicle')}
          </Link>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-primary"
          >
            {t('offers.edit')}
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-danger"
          >
            {t('offers.cancelAction')}
          </button>
        )}
      </div>
    </article>
  );
}
