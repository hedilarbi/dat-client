'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '../../../api';
import { useUser } from '../../../components/LayoutWrapper';
import { getRoleHomePath, getRoleStampPath, localizedPath, useLanguage } from '../../../i18n';
import Alert from '../../../components/Alert';
import ConfirmModal from '../../../components/ConfirmModal';
import VerticalStep from '../../../components/VerticalStep';
import DocumentsSubsteps from '../../../components/DocumentsSubsteps';
import EsignatureStep from '../../../components/EsignatureStep';
import SaleDocumentsReview from '../../../components/SaleDocumentsReview';
import SignedDocuments from '../../../components/SignedDocuments';
import StampRequiredBanner from '../../../components/StampRequiredBanner';
import { useSaleAutoRefresh } from '../../../components/useSaleAutoRefresh';
import { formatEuros } from '../../../lib/format';
import {
  DISPLAY_STEPS,
  DISPLAYED_STEP_COUNT,
  STEP,
  displayStepIndex,
  stepDisplayNumber,
  type SaleDocumentsState,
  type SaleEsignatureState,
} from '../../../lib/saleSteps';
import Spinner from '../../../components/Spinner';

interface SellerSaleDetail {
  id: string;
  status: 'en_session' | 'en_cours' | 'suspendue' | 'cloturee' | 'sans_gagnant' | 'annulee';
  unsoldReason?: 'reserve_not_met' | 'buyer_default' | null;
  amount: number | null;
  reservePrice: number | null;
  currentStep: number;
  stepKey: string | null;
  stepCount: number;
  steps: string[];
  currentStepStartedAt: string | null;
  currentStepDueAt: string | null;
  sellerDecisionDueAt: string | null;
  commissionPaidAt: string | null;
  documentsDelivery: 'main_propre' | 'poste' | null;
  transferConfirmedAt: string | null;
  documents: SaleDocumentsState;
  esignature: SaleEsignatureState | null;
  bonEnlevement: { url: string | null; generatedAt: string | null } | null;
  wonAt: string | null;
  closedAt: string | null;
  vehicle: { id: string; brand: string; model: string; year: number | null; mileage: number | null; photoUrl: string | null; registrationNumber: string | null; registrationCardAvailable: boolean | null; formulaNumber?: string | null; registrationCardMissingMotif?: string | null; } | null;
  session: { id: string; name: string; endDate: string } | null;
  /** Révélé par le serveur une fois la commission réglée */
  buyer: { companyName: string; firstName: string; lastName: string; email: string; phone: string; siret?: string | null; address?: { street?: string; city?: string; postalCode?: string; country?: string } } | null;
  offers?: Array<{ id: string; amount: number; selectable: boolean; buyer: { companyName: string; firstName: string; lastName: string } | null }>;
}

/**
 * Étapes dont le libellé diffère côté vendeur : ce qui est un « paiement de la commission »
 * pour l'acheteur est, vu du vendeur, la vérification de son acheteur avant que la procédure
 * ne s'engage. Les autres étapes gardent le libellé commun `sales.step.<clé>`.
 */
const SELLER_STEP_LABELS: Record<string, string> = {
  commission: 'sellerSale.step.commission',
  virement_carte_grise: 'sellerSale.step.virement_carte_grise',
};

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

export default function SellerSaleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const { language, t } = useLanguage();

  const [sale, setSale] = useState<SellerSaleDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // Étape 2 : confirmation du virement ; étape 3.1 : données complémentaires de la carte grise
  const [transferConfirmationOpen, setTransferConfirmationOpen] = useState(false);
  // Étape 3.1 : le modal de la carte grise s'ouvre de lui-même tant qu'elle n'est pas saisie,
  // sauf si le vendeur l'a refermé pendant cette visite ; le bouton de l'étape le rouvre.
  const [registrationCardRequested, setRegistrationCardRequested] = useState(false);
  const [registrationCardDismissed, setRegistrationCardDismissed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [formulaNumberInput, setFormulaNumberInput] = useState('');
  const [motifAbsenceInput, setMotifAbsenceInput] = useState('');

  const [, setClock] = useState(0);

  // Vue historique
  const [viewedStepIndex, setViewedStepIndex] = useState<number | null>(null);

  const [offerActionLoading, setOfferActionLoading] = useState<string | null>(null);
  // Offre en attente de confirmation : choisir un acheteur avant la clôture est irréversible
  const [offerToAccept, setOfferToAccept] = useState<{ id: string; amount: number } | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(localizedPath(`/vendeur/ventes/${params.id}`, language))}`, language));
    }
  }, [userLoading, user, router, language, params.id]);

  useEffect(() => {
    if (user && user.role !== 'vendeur') {
      router.replace(localizedPath(getRoleHomePath(user.role), language));
    }
  }, [user, router, language]);

  useEffect(() => {
    if (user?.role !== 'vendeur' || (user.status !== 'valide' && user.status !== 'suspendu')) return;
    apiRequest(`/sales/seller/${params.id}`)
      .then((res) => { setSale(res.sale); setError(''); })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
      })
      .finally(() => setLoaded(true));
  }, [params.id, t, user]);

  // Étape 3 : l'acheteur peut déposer son tampon, vérifier ou signer à tout moment. La page de
  // retour de la plateforme de signature ajoute ?signature=retour.
  const returnedFromSigning = searchParams.get('signature') === 'retour';
  const refreshSale = useCallback(async () => {
    const res = await apiRequest(`/sales/seller/${params.id}`);
    setSale(res.sale);
  }, [params.id]);
  useSaleAutoRefresh(
    sale?.id,
    sale?.status === 'en_cours' && sale.currentStep >= STEP.PREPARATION,
    refreshSale,
  );

  const registrationCardDue = sale?.status === 'en_cours'
    && sale.currentStep === STEP.PREPARATION
    && !sale.documents.registrationCardSubmittedAt;
  const registrationCardOpen = registrationCardDue && (registrationCardRequested || !registrationCardDismissed);

  // Rafraîchit le compte à rebours de l'échéance
  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleConfirmTransfer = async () => {
    if (!sale) return;
    setConfirming(true);
    setError('');
    try {
      const res = await apiRequest(`/sales/${sale.id}/transfer-received`, { method: 'POST' });
      setSale(res.sale);
      setMessage(res.message || '');
      setViewedStepIndex(null);
      // La vente passe à l'étape 3.1 : le modal de la carte grise s'ouvre aussitôt
      setTransferConfirmationOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitRegistrationCard = async () => {
    if (!sale) return;
    setConfirming(true);
    setError('');
    try {
      const payload: { formulaNumber?: string; registrationCardMissingMotif?: string } = {};
      if (sale.vehicle?.registrationCardAvailable === true) {
        payload.formulaNumber = `20${formulaNumberInput.trim()}`;
      } else if (sale.vehicle?.registrationCardAvailable === false) {
        payload.registrationCardMissingMotif = motifAbsenceInput.trim();
      } else {
        setError(t('sellerSale.registrationCardUnknown'));
        return;
      }

      const res = await apiRequest(`/sales/${sale.id}/registration-card`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSale(res.sale);
      setMessage(res.message || '');
      setViewedStepIndex(null);
      setRegistrationCardRequested(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
    } finally {
      setConfirming(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!sale?.vehicle) return;
    setOfferActionLoading(offerId);
    setError('');
    try {
      const res = await apiRequest(`/sales/seller/vehicles/${sale.vehicle.id}/offers/${offerId}/accept`, { method: 'POST' });
      setSale(res.sale);
      setMessage(res.message || t('sellerSale.offerAccepted'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
    } finally {
      setOfferActionLoading(null);
    }
  };

  const handleRelist = async () => {
    if (!sale || sale.status !== 'suspendue') return;
    setOfferActionLoading('relist');
    setError('');
    try {
      await apiRequest(`/sales/seller/${sale.id}/relist`, { method: 'POST' });
      router.push(localizedPath('/vendeur/en-vente', language));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
    } finally {
      setOfferActionLoading(null);
    }
  };

  const backLink = <Link href={localizedPath('/vendeur/ventes', language)} className="btn-back mb-6">
    {t('sellerSale.backToList')}
  </Link>;

  if (userLoading || !user || !loaded) {
    return <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-white"><Spinner className="h-10 w-10 text-[#13243c]" /></div>;
  }

  if (!sale) {
    return (
      <div className="flex-1 w-full bg-white p-6 sm:p-[32px_40px_44px]">
        <Alert variant="error" className="mb-5">{error || t('sellerSale.notFound')}</Alert>
        {backLink}
      </div>
    );
  }

  const title = ([sale.vehicle?.brand, sale.vehicle?.model].filter(Boolean).join(' ') + (sale.vehicle?.registrationNumber ? ` (${sale.vehicle.registrationNumber})` : '')).trim() || '—';
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const remaining = timeLeft(sale.currentStepDueAt);
  const decisionRemaining = timeLeft(sale.sellerDecisionDueAt);
  const decisionExpired = sale.status === 'suspendue' && Boolean(sale.sellerDecisionDueAt) && !decisionRemaining;
  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const subtitle = [
    sale.vehicle?.year ? String(sale.vehicle.year) : null,
    sale.vehicle?.mileage != null ? `${sale.vehicle.mileage.toLocaleString(locale)} km` : null,
    sale.session?.name,
  ].filter(Boolean).join(' · ');
  // La page tampon ramène le vendeur sur cette vente une fois son tampon déposé
  const stampHref = `${localizedPath(getRoleStampPath('vendeur'), language)}?returnTo=${encodeURIComponent(localizedPath(`/vendeur/ventes/${params.id}`, language))}`;

  return (
    <div className="flex-1 w-full bg-white p-6 font-sans text-black sm:p-[32px_40px_44px]">
      {backLink}

      {message && <Alert variant="success" className="mt-4">{message}</Alert>}

      <div className="mt-4 mb-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-[96px] w-full shrink-0 overflow-hidden rounded-[12px] bg-[#eef1f5] sm:w-[140px]">
          {sale.vehicle?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sale.vehicle.photoUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-2xl font-bold text-[#8ea0bd]">
              {(sale.vehicle?.brand || '—').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a3987f]">{t('sellerSale.eyebrow')}</div>
          <h1 className="font-heading text-[28px] font-bold uppercase leading-none text-[#13243c] sm:text-[36px]">{title}</h1>
          <p className="mt-2 text-sm text-[#5a5e66]">{subtitle}</p>
        </div>

        {sale.amount != null && (
          <div className="shrink-0 rounded-[12px] bg-[#f8f7f2] px-5 py-4 text-left sm:text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7a756a]">{t('sellerSale.soldFor')}</div>
            <div className="font-mono text-[24px] font-bold text-[#13243c]">{formatEuros(sale.amount, language)}</div>
          </div>
        )}
      </div>

      {sale.buyer && (
        <div className="mb-6 overflow-hidden rounded-[14px] border border-[#eceadf] bg-white">
          <div className="border-b border-[#efece3] bg-[#f8f7f2] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">
            {t('sellerSale.buyerTitle')}
          </div>
          <dl className="divide-y divide-[#f1efe8]">
            <InfoRow label={t('sellerSale.buyerCompany')} value={sale.buyer.companyName} />
            <InfoRow
              label={t('sellerSale.buyerContact')}
              value={[`${sale.buyer.firstName} ${sale.buyer.lastName}`.trim(), sale.buyer.phone, sale.buyer.email].filter(Boolean).join(' · ')}
            />
          </dl>
        </div>
      )}

      {['en_session', 'suspendue'].includes(sale.status) ? (
        <section className="rounded-[14px] border border-[#ebdcc9] bg-[#faf7ef] p-5">
          {sale.status === 'suspendue' && sale.sellerDecisionDueAt && (
            <div className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border px-4 py-3 ${decisionExpired ? 'border-[#f0c9bd] bg-[#fdece4]' : 'border-[#f0c9bd] bg-white'}`} aria-live="polite">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#b04a2c]">
                  {t('sellerSale.decisionDeadline')}
                </div>
                <div className="mt-0.5 text-[12px] font-semibold text-[#5a5e66]">
                  {t('sellerSale.decisionDeadlineText')}
                </div>
              </div>
              <div className={`font-mono text-[24px] font-bold tabular-nums ${decisionExpired ? 'text-[#b04a2c]' : 'text-[#13243c]'}`}>
                {decisionExpired ? t('sellerSale.decisionExpired') : decisionRemaining}
              </div>
            </div>
          )}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#13243c]">{t('sellerSale.offersTitle')}</h2>
              <p className="mt-1 text-sm text-[#5a5e66]">{sale.status === 'en_session' ? t('sellerSale.offersLiveText') : t('sellerSale.offersSuspendedText')}</p>
            </div>
            {sale.status === 'suspendue' && (
              <button type="button" onClick={handleRelist} disabled={offerActionLoading !== null || decisionExpired} className="btn btn-secondary disabled:opacity-50">
                {offerActionLoading === 'relist' && <Spinner />} {t('sellerSale.relist')}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(sale.offers || []).map((offer) => (
              <div key={offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e2ddd1] bg-white p-4">
                <div>
                  <div className="font-semibold text-[#13243c]">{offer.buyer?.companyName || [offer.buyer?.firstName, offer.buyer?.lastName].filter(Boolean).join(' ') || t('sellerSale.buyer')}</div>
                  <div className="font-mono text-lg font-bold text-[#d9704f]">{formatEuros(offer.amount, language)}</div>
                </div>
                <button type="button" disabled={!offer.selectable || offerActionLoading !== null || decisionExpired} onClick={() => (sale.status === 'en_session' ? setOfferToAccept({ id: offer.id, amount: offer.amount }) : handleAcceptOffer(offer.id))} className="btn btn-primary disabled:opacity-40">
                  {offerActionLoading === offer.id && <Spinner />} {t('sellerSale.acceptOffer')}
                </button>
              </div>
            ))}
            {(sale.offers || []).length === 0 && <p className="text-sm text-[#5a5e66]">{t('sellerSale.noOffers')}</p>}
          </div>
        </section>
      ) : sale.status === 'sans_gagnant' ? (
        <section className="rounded-[14px] border border-[#f5d5c7] bg-[#fdece4] p-5">
          <h2 className="font-heading text-[18px] font-bold uppercase text-[#b04a2c]">{t('sellerSale.unsoldTitle')}</h2>
          <p className="mt-1 text-sm text-[#b04a2c]">
            {t(sale.unsoldReason === 'buyer_default' ? 'sellerSale.unsoldBuyerDefaultText' : 'sellerSale.unsoldText')}
          </p>
        </section>
      ) : (
        <>
          {sale.status === 'cloturee' && viewedStepIndex === null && (
            <section className="mb-6 rounded-[14px] border border-[#cbe3d5] bg-[#e9f4ee] p-5">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#2f6f4f]">{t('sellerSale.closedTitle')}</h2>
              <p className="mt-1 mb-4 text-sm text-[#2f6f4f]">
                {sale.closedAt ? t('saleDocs.closedOn', { date: formatDate(sale.closedAt) }) : t('sellerSale.closedText')}
              </p>
              <SignedDocuments esignature={sale.esignature} bonEnlevementUrl={sale.bonEnlevement?.url} />
            </section>
          )}

          <section className="mb-6 rounded-[14px] border border-[#eceadf] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('sellerSale.progressTitle')}</h2>
              <span className="text-[12px] font-semibold text-[#13243c]">
                {t('sellerSale.stepOf', { current: stepDisplayNumber(sale.currentStep), total: String(DISPLAYED_STEP_COUNT) })}
              </span>
            </div>

            {sale.documentsDelivery && (
              <div className="mb-6 rounded-[10px] bg-[#f9fafb] p-4 border border-[#e5e7eb]">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058] mb-2">
                  Mode de récupération des papiers
                </h3>
                {sale.documentsDelivery === 'main_propre' ? (
                  <p className="text-sm font-semibold text-[#2f6f4f]">En main propre</p>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-[#13243c]">Par voie postale à l&apos;adresse de l&apos;acheteur :</p>
                    {sale.buyer?.address ? (
                      <address className="mt-1 text-[13px] text-[#5a5e66] not-italic leading-relaxed">
                        {sale.buyer.address.street && <div>{sale.buyer.address.street}</div>}
                        <div>{sale.buyer.address.postalCode} {sale.buyer.address.city}</div>
                        {sale.buyer.address.country && <div>{sale.buyer.address.country}</div>}
                      </address>
                    ) : (
                      <p className="mt-1 text-[13px] text-red-500 italic">L&apos;adresse de l&apos;acheteur est indisponible.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col">
              {DISPLAY_STEPS.map((group, index) => {
                const stepNumber = index + 1;
                const isCompleted = sale.status === 'cloturee' || sale.currentStep > group.steps[group.steps.length - 1];
                const isCurrent = sale.status !== 'cloturee' && group.steps.includes(sale.currentStep);
                const isOpen = viewedStepIndex !== null ? viewedStepIndex === index : isCurrent;
                const isHistorical = isCompleted;
                const isLast = index === DISPLAY_STEPS.length - 1;

                // Contenu d'une étape interne ; les trois sous-étapes des documents passent par
                // DocumentsSubsteps, qui les présente sous l'étape « Documents administratifs ».
                const renderStep = (step: number, historical: boolean) => (
                  <>
                    {step === STEP.COMMISSION && (
                      <p className="text-sm leading-6 text-[#5a5e66]">
                        {historical ? t('sellerSale.step1Done') : t('sellerSale.step1Waiting')}
                      </p>
                    )}

                    {step === STEP.VIREMENT && (historical ? (
                      <>
                        <p className="mb-4 text-sm leading-6 text-[#5a5e66]">{t('sellerSale.step2Done')}</p>
                        <dl className="overflow-hidden rounded-[10px] border border-[#dcd7cb] bg-[#fbfaf7]">
                          <InfoRow label={t('sellerSale.step2History.amount')} value={sale.amount != null ? formatEuros(sale.amount, language) : ''} />
                          <InfoRow label={t('sellerSale.step2History.confirmedAt')} value={sale.transferConfirmedAt ? formatDate(sale.transferConfirmedAt) : ''} />
                        </dl>
                      </>
                    ) : (
                      <>
                        <p className="mb-4 text-sm leading-6 text-[#5a5e66]">{t('sellerSale.step2Waiting')}</p>

                        {sale.amount != null && (
                          <div className="mb-4 flex items-baseline justify-between gap-3 rounded-[10px] bg-[#13243c] px-4 py-3.5">
                            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#c3cedd]">{t('sellerSale.amountExpected')}</span>
                            <span className="font-mono text-lg font-bold text-white">{formatEuros(sale.amount, language)}</span>
                          </div>
                        )}

                        <p className="mb-4 rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-sm leading-6 text-[#8a4b24]">
                          {t('sellerSale.step2Note')}
                        </p>
                        <button
                          type="button"
                          onClick={() => setTransferConfirmationOpen(true)}
                          disabled={confirming}
                          className="h-12 w-full cursor-pointer rounded-[9px] bg-[#2f6f4f] px-6 text-xs font-bold uppercase tracking-[.03em] text-white transition hover:bg-emerald-800 disabled:opacity-50 sm:w-auto sm:px-10"
                        >
                          {confirming ? t('sellerSale.confirming') : t('sellerSale.confirmTransfer')}
                        </button>
                        <p className="mt-2.5 text-[12px] leading-5 text-[#5a5e66]">{t('sellerSale.confirmWarning')}</p>
                      </>
                    ))}

                    {step === STEP.PREPARATION && (historical ? (
                      <>
                        <p className="mb-4 text-sm leading-6 text-[#5a5e66]">{t('sellerSale.preparationDone')}</p>
                        <dl className="overflow-hidden rounded-[10px] border border-[#dcd7cb] bg-[#fbfaf7]">
                          <InfoRow label={t('sellerSale.preparationHistory.submittedAt')} value={sale.documents.registrationCardSubmittedAt ? formatDate(sale.documents.registrationCardSubmittedAt) : ''} />
                          <InfoRow label={t('sellerSale.preparationHistory.formulaNumber')} value={sale.vehicle?.formulaNumber || ''} />
                          <InfoRow label={t('sellerSale.preparationHistory.missingMotif')} value={sale.vehicle?.registrationCardMissingMotif || ''} />
                        </dl>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm leading-6 text-[#5a5e66]">{t('sellerSale.preparationIntro')}</p>
                        <button
                          type="button"
                          onClick={() => setRegistrationCardRequested(true)}
                          className="btn btn-primary w-full sm:w-auto sm:px-8"
                        >
                          {t('sellerSale.registrationCardCta')}
                        </button>
                        {!sale.documents.stamps.seller && <StampRequiredBanner stampHref={stampHref} />}
                      </div>
                    ))}

                    {step === STEP.VERIFICATION && (
                      <SaleDocumentsReview<SellerSaleDetail>
                        saleId={sale.id}
                        side="seller"
                        documents={sale.documents}
                        otherParty={sale.buyer}
                        isHistorical={historical}
                        stampHref={stampHref}
                        onUpdated={(updated, updateMessage) => {
                          setSale(updated);
                          setMessage(updateMessage);
                          setViewedStepIndex(null);
                        }}
                      />
                    )}

                    {step === STEP.SIGNATURE && (
                      <EsignatureStep
                        side="seller"
                        signUrl={sale.esignature?.sellerUrl}
                        sellerSignedAt={sale.esignature?.sellerSignedAt}
                        buyerSignedAt={sale.esignature?.buyerSignedAt}
                        isHistorical={historical}
                        returnedFromSigning={returnedFromSigning}
                        setupFailed={Boolean(sale.esignature?.setupErrorAt)}
                      />
                    )}
                  </>
                );

                return (
                  <VerticalStep
                    key={group.key}
                    stepNumber={stepNumber}
                    title={SELLER_STEP_LABELS[group.key] ? t(SELLER_STEP_LABELS[group.key]) : t(`sales.step.${group.key}`)}
                    isOpen={isOpen}
                    isCurrent={isCurrent}
                    isCompleted={isCompleted}
                    isLast={isLast}
                    currentLabel={t('sales.currentStep')}
                    onClick={() => setViewedStepIndex(isOpen ? (sale.status === 'cloturee' ? null : displayStepIndex(sale.currentStep)) : index)}
                  >
                    {error && isOpen && <Alert variant="error" className="mb-4">{error}</Alert>}
                    {!isHistorical && sale.currentStepDueAt && (
                      <p className={`mb-4 text-[13px] font-semibold ${remaining ? 'text-[#8a6a2f]' : 'text-[#b04a2c]'}`}>
                        {remaining ? t('sellerSale.deadlineLeft', { time: remaining }) : t('sellerSale.deadlineOver')}
                      </p>
                    )}
                    {!isHistorical && <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('sellerSale.todo')}</h3>}

                    {group.key === 'documents_administratifs' ? (
                      <DocumentsSubsteps currentStep={sale.currentStep} closed={sale.status === 'cloturee'}>
                        {renderStep}
                      </DocumentsSubsteps>
                    ) : renderStep(group.steps[0], isHistorical)}
                  </VerticalStep>
                );
              })}
            </div>
          </section>
        </>
      )}

      <ConfirmModal
        open={transferConfirmationOpen}
        title={t('sellerSale.confirmTransferTitle')}
        message={t('sellerSale.confirmTransferMessage')}
        confirmLabel={t('sellerSale.confirmTransferAction')}
        loading={confirming}
        onConfirm={handleConfirmTransfer}
        onCancel={() => { if (!confirming) setTransferConfirmationOpen(false); }}
      />

      <ConfirmModal
        open={registrationCardOpen}
        title={t('sellerSale.registrationCardTitle')}
        message={
          <div className="flex flex-col gap-4">
            <p className="text-[13px] leading-5 text-[#5a5e66]">{t('sellerSale.registrationCardHelp')}</p>
            {sale.vehicle?.registrationCardAvailable === true && (
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold uppercase tracking-wide text-[#7a756a]" htmlFor="formula-number">
                  {t('sellerSale.formulaNumberLabel')}
                </label>
                <div className="flex items-center">
                  <span className="flex h-10 items-center justify-center rounded-l-[8px] border border-r-0 border-[#dcd7cb] bg-gray-100 px-3 font-mono text-sm text-gray-500">
                    20
                  </span>
                  <input
                    id="formula-number"
                    type="text"
                    value={formulaNumberInput}
                    onChange={(e) => setFormulaNumberInput(e.target.value)}
                    placeholder={t('sellerSale.formulaNumberPlaceholder')}
                    className="h-10 flex-1 rounded-r-[8px] border border-[#dcd7cb] bg-white px-3 text-sm focus:border-[#13243c] focus:outline-none"
                  />
                </div>
              </div>
            )}
            {sale.vehicle?.registrationCardAvailable === false && (
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold uppercase tracking-wide text-[#7a756a]" htmlFor="missing-motif">
                  {t('sellerSale.missingMotifLabel')}
                </label>
                <input
                  id="missing-motif"
                  type="text"
                  value={motifAbsenceInput}
                  onChange={(e) => setMotifAbsenceInput(e.target.value)}
                  placeholder={t('sellerSale.missingMotifPlaceholder')}
                  className="h-10 w-full rounded-[8px] border border-[#dcd7cb] bg-white px-3 text-sm focus:border-[#13243c] focus:outline-none"
                />
              </div>
            )}
            {sale.vehicle?.registrationCardAvailable == null && (
              <p className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-red-700">
                {t('sellerSale.registrationCardUnknown')}
              </p>
            )}
          </div>
        }
        confirmLabel={t('sellerSale.registrationCardSave')}
        loading={confirming}
        confirmDisabled={
          sale.vehicle?.registrationCardAvailable === true
            ? !formulaNumberInput.trim()
            : sale.vehicle?.registrationCardAvailable === false
              ? !motifAbsenceInput.trim()
              : true
        }
        onConfirm={handleSubmitRegistrationCard}
        onCancel={() => {
          if (!confirming) {
            setRegistrationCardRequested(false);
            setRegistrationCardDismissed(true);
            setFormulaNumberInput('');
            setMotifAbsenceInput('');
          }
        }}
      />

      <ConfirmModal
        open={offerToAccept !== null}
        title={t('sellerSale.acceptEarlyTitle')}
        message={offerToAccept ? t('sellerSale.acceptEarlyWarning', { amount: formatEuros(offerToAccept.amount, language) }) : ''}
        confirmLabel={t('sellerSale.acceptEarlyConfirm')}
        danger
        loading={offerActionLoading !== null}
        onConfirm={async () => {
          if (!offerToAccept) return;
          await handleAcceptOffer(offerToAccept.id);
          setOfferToAccept(null);
        }}
        onCancel={() => { if (offerActionLoading === null) setOfferToAccept(null); }}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7a756a]">{label}</dt>
      <dd className="text-sm font-semibold text-[#13243c] sm:text-right">{value}</dd>
    </div>
  );
}
