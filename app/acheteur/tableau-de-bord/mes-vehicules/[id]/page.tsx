'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '../../../../api';
import { useUser } from '../../../../components/LayoutWrapper';
import { getBuyingPaths, localizedPath, useLanguage } from '../../../../i18n';
import Alert from '../../../../components/Alert';
import { UnderReviewNotice, SuspendedNotice } from '../../../../components/RegistrationStatusNotices';
import CommissionCheckout from '../../../../components/CommissionCheckout';
import VerticalStep from '../../../../components/VerticalStep';
import DocumentsSubsteps from '../../../../components/DocumentsSubsteps';
import EsignatureStep from '../../../../components/EsignatureStep';
import SaleDocumentsReview from '../../../../components/SaleDocumentsReview';
import SignedDocuments from '../../../../components/SignedDocuments';
import StampRequiredBanner from '../../../../components/StampRequiredBanner';
import { useSaleAutoRefresh } from '../../../../components/useSaleAutoRefresh';
import { formatEuros } from '../../../../lib/format';
import {
  DISPLAY_STEPS,
  DISPLAYED_STEP_COUNT,
  STEP,
  displayStepIndex,
  stepDisplayNumber,
  type SaleDocumentsState,
  type SaleEsignatureState,
} from '../../../../lib/saleSteps';
import { isStripeConfigured } from '../../../../lib/stripe';
import Spinner from '../../../../components/Spinner';

interface WonSaleDetail {
  id: string;
  amount: number | null;
  status: 'en_cours' | 'cloturee' | 'sans_gagnant' | 'annulee';
  currentStep: number;
  stepKey: string | null;
  stepCount: number;
  steps: string[];
  currentStepStartedAt: string | null;
  currentStepDueAt: string | null;
  commissionPaidAt: string | null;
  documentsDelivery: DeliveryMode | null;
  transferConfirmedAt: string | null;
  documents: SaleDocumentsState;
  esignature: SaleEsignatureState | null;
  bonEnlevement: { url: string | null; generatedAt: string | null } | null;
  wonAt: string | null;
  closedAt: string | null;
  fees: { commission: number; taxName: string; taxRate: number; taxAmount: number; total: number } | null;
  vehicle: { id: string; brand: string; model: string; year: number | null; mileage: number | null; photoUrl: string | null; registrationNumber: string | null } | null;
  session: { id: string; name: string; endDate: string } | null;
  /** Débloquées par le serveur uniquement une fois la commission réglée */
  seller: {
    companyName: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: { street?: string; postalCode?: string; city?: string; country?: string } | null;
    siret?: string | null;
    bankInfo: { bankName: string; accountHolder: string; iban: string; bic: string } | null;
  } | null;
}

type DeliveryMode = 'main_propre' | 'poste';

function SellerRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7a756a]">{label}</dt>
      <dd className={`text-sm text-[#13243c] sm:text-right ${mono ? 'font-mono font-bold' : 'font-semibold'}`}>{value}</dd>
    </div>
  );
}

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

export default function WonSaleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const paths = getBuyingPaths(user?.role);
  const { language, t } = useLanguage();

  const [sale, setSale] = useState<WonSaleDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [, setClock] = useState(0);

  // Étape 1 : mode de remise des papiers, puis paiement Stripe embarqué
  const [delivery, setDelivery] = useState<DeliveryMode | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [message, setMessage] = useState('');
  // La confirmation est déduite de l'URL de retour : elle dure tant que Stripe nous a
  // renvoyé un session_id et que le serveur n'a pas tranché.
  const [confirmSettled, setConfirmSettled] = useState(false);
  const confirmStartedRef = useRef(false);
  const stepTwoRef = useRef<HTMLDivElement>(null);
  const scrollToStepTwoRef = useRef(false);

  // Vue historique
  const [viewedStepIndex, setViewedStepIndex] = useState<number | null>(null);

  // Annulation
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Stripe renvoie sur cette page avec ?session_id=… une fois le paiement effectué
  const checkoutSessionId = searchParams.get('session_id');
  const confirming = Boolean(checkoutSessionId) && !confirmSettled;

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(localizedPath(`${paths.purchases}/${params.id}`, language))}`, language));
    }
  }, [userLoading, user, router, language, params.id]);

  useEffect(() => {
    if (!user || !['acheteur', 'vendeur'].includes(user.role) || (user.status !== 'valide' && user.status !== 'suspendu')) return;
    apiRequest(`/sales/${params.id}`)
      .then((res) => { setSale(res.sale); setError(''); })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : t('saleDetail.notFound'));
      })
      .finally(() => setLoaded(true));
  }, [params.id, t, user]);

  // Étape 3 : le vendeur peut compléter la carte grise, vérifier ou signer à tout moment. La page
  // de retour de la plateforme de signature ajoute ?signature=retour.
  const returnedFromSigning = searchParams.get('signature') === 'retour';
  const refreshSale = useCallback(async () => {
    const res = await apiRequest(`/sales/${params.id}`);
    setSale(res.sale);
  }, [params.id]);
  useSaleAutoRefresh(
    sale?.id,
    sale?.status === 'en_cours' && sale.currentStep >= STEP.PREPARATION,
    refreshSale,
  );

  // Rafraîchit le compte à rebours de l'échéance
  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Retour de Stripe : le serveur relit la session et n'avance l'étape que si elle est payée
  useEffect(() => {
    if (!checkoutSessionId || !loaded || !sale) return;

    // Le webhook Stripe peut avoir déjà fait avancer la vente avant le chargement de la page.
    if (sale.currentStep >= 2) {
      scrollToStepTwoRef.current = true;
      router.replace(localizedPath(`${paths.purchases}/${params.id}`, language), { scroll: false });
      return;
    }
    if (sale.currentStep !== 1) return;
    // Un seul appel de confirmation par retour, même si l'effet est réexécuté
    if (confirmStartedRef.current) return;
    confirmStartedRef.current = true;

    apiRequest(`/sales/${params.id}/commission/confirm`, {
      method: 'POST',
      body: JSON.stringify({ checkoutSessionId }),
    })
      .then((res) => {
        scrollToStepTwoRef.current = true;
        setSale(res.sale);
        setViewedStepIndex(null);
        setMessage(t('saleDetail.paymentSuccess'));
        setError('');
        setCheckoutOpen(false);
        // Retire session_id de l'URL pour ne pas rejouer la confirmation au rechargement
        router.replace(localizedPath(`${paths.purchases}/${params.id}`, language), { scroll: false });
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : t('saleDetail.notFound'));
      })
      .finally(() => setConfirmSettled(true));
  }, [checkoutSessionId, loaded, sale, params.id, router, language, t]);

  useEffect(() => {
    if (!scrollToStepTwoRef.current || sale?.currentStep !== 2) return;
    scrollToStepTwoRef.current = false;
    window.requestAnimationFrame(() => {
      stepTwoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [sale?.currentStep]);

  
  const handleCancelSale = async () => {
    if (!sale) return;
    setCanceling(true);
    setError('');
    try {
      await apiRequest(`/sales/${sale.id}/cancel-buyer`, { method: 'PUT' });
      // Après l'annulation, le compte est suspendu.
      router.replace(localizedPath(paths.profile, language));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('saleDetail.notFound'));
      setCanceling(false);
      setCancelModalOpen(false);
    }
  };

  const openCheckout = () => {
    if (!delivery) {
      setValidationError(t('saleDetail.deliveryRequired'));
      return;
    }
    setValidationError('');
    setCheckoutOpen(true);
  };

  const backLink = (
    <Link href={localizedPath(paths.purchases, language)} className="text-[13px] font-bold text-[#13243c] hover:underline flex items-center gap-1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      {t('saleDetail.backToList')}
    </Link>
  );

  if (userLoading || !user) {
    return <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-white"><Spinner className="h-10 w-10 text-[#13243c]" /></div>;
  }

  if (user.status !== 'valide' && user.status !== 'suspendu') {
    return <UnderReviewNotice />;
  }

  if (!loaded || confirming) {
    return <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-white"><Spinner className="h-10 w-10 text-[#13243c]" /></div>;
  }

  if (!sale) {
    return (
      <div className="flex-1 w-full bg-white p-6 sm:p-[32px_40px_44px]">
        <Alert variant="error" className="mb-5">{error || t('saleDetail.notFound')}</Alert>
        {backLink}
      </div>
    );
  }

  const title = ([sale.vehicle?.brand, sale.vehicle?.model].filter(Boolean).join(' ') + (sale.vehicle?.registrationNumber ? ` (${sale.vehicle.registrationNumber})` : '')).trim() || '—';
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const remaining = timeLeft(sale.currentStepDueAt);
  const cancellationFee = sale.fees
    ? Number(sale.fees.commission || 0) + Number(sale.fees.taxAmount || 0)
    : null;
  const subtitle = [
    sale.vehicle?.year ? String(sale.vehicle.year) : null,
    sale.vehicle?.mileage != null ? `${sale.vehicle.mileage.toLocaleString(locale)} km` : null,
    sale.session?.name,
  ].filter(Boolean).join(' · ');
  // La page tampon ramène l'acheteur sur cette vente une fois son tampon déposé
  const stampHref = `${localizedPath(paths.stamp, language)}?returnTo=${encodeURIComponent(localizedPath(`${paths.purchases}/${params.id}`, language))}`;

  return (
    <div className="flex-1 w-full bg-white p-6 font-sans text-black sm:p-[32px_40px_44px]">
      {backLink}

      {message && <Alert variant="success" className="mt-4">{message}</Alert>}

      {/* Identité du véhicule remporté */}
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
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a3987f]">
            {t('saleDetail.eyebrow')}
          </div>
          <h1 className="font-heading text-[28px] font-bold uppercase leading-none text-[#13243c] sm:text-[36px]">{title}</h1>
          <p className="mt-2 text-sm text-[#5a5e66]">{subtitle}</p>
        </div>

        {sale.amount != null && (
          <div className="shrink-0 rounded-[12px] bg-[#f8f7f2] px-5 py-4 text-left sm:text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7a756a]">{t('saleDetail.wonAmount')}</div>
            <div className="font-mono text-[24px] font-bold text-[#13243c]">{formatEuros(sale.amount, language)}</div>
          </div>
        )}
      </div>


      {/* Bouton Fiche du véhicule juste au-dessus de la procédure d'achat */}
      {sale.vehicle && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[12px] border border-[#e2ddd1] bg-[#fcfbf8] p-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d9704f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span className="text-[13px] font-semibold text-[#13243c]">
              Fiche technique & photos du véhicule
            </span>
          </div>
          <Link
            href={localizedPath(`${paths.purchases}/${sale.id}/fiche`, language)}
            className="inline-flex h-9 items-center justify-center rounded-[8px] bg-[#13243c] px-4 text-[12px] font-bold uppercase tracking-[0.03em] text-white transition hover:bg-[#1c3050] cursor-pointer shadow-xs shrink-0"
          >
            {t('sales.viewVehicle')} →
          </Link>
        </div>
      )}

      {sale.seller && (
        <div className="mb-6 overflow-hidden rounded-[14px] border border-[#eceadf] bg-white">
          <div className="border-b border-[#efece3] bg-[#f8f7f2] px-5 py-4 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">
            {t('saleDetail.sellerTitle')}
          </div>
          <dl className="divide-y divide-[#f1efe8]">
            <SellerRow label={t('saleDetail.sellerCompany')} value={sale.seller.companyName} />
            <SellerRow
              label={t('saleDetail.sellerContact')}
              value={[`${sale.seller.firstName} ${sale.seller.lastName}`.trim(), sale.seller.phone, sale.seller.email].filter(Boolean).join(' · ')}
            />
            <SellerRow
              label={t('saleDetail.sellerAddress')}
              value={sale.seller.address
                ? [sale.seller.address.street, [sale.seller.address.postalCode, sale.seller.address.city].filter(Boolean).join(' '), sale.seller.address.country].filter(Boolean).join(', ')
                : ''}
            />
            {sale.seller.bankInfo && (
              <>
                <SellerRow label={t('saleDetail.sellerBank')} value={sale.seller.bankInfo.bankName} />
                <SellerRow label={t('saleDetail.sellerAccountHolder')} value={sale.seller.bankInfo.accountHolder} />
                <SellerRow label={t('saleDetail.sellerIban')} value={sale.seller.bankInfo.iban} mono />
                <SellerRow label={t('saleDetail.sellerBic')} value={sale.seller.bankInfo.bic} mono />
              </>
            )}
          </dl>
        </div>
      )}

      {sale.status === 'cloturee' && viewedStepIndex === null && (
        <section className="mb-6 rounded-[14px] border border-[#cbe3d5] bg-[#e9f4ee] p-5">
          <h2 className="font-heading text-[18px] font-bold uppercase text-[#2f6f4f]">{t('saleDetail.closedTitle')}</h2>
          <p className="mt-1 mb-4 text-sm text-[#2f6f4f]">
            {sale.closedAt ? t('saleDocs.closedOn', { date: formatDate(sale.closedAt) }) : t('saleDetail.closedText')}
          </p>
          <div className="mb-4 rounded-[10px] border border-[#cbe3d5] bg-white p-4">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#2f6f4f]">{t('saleDetail.pickupTitle')}</h3>
            <p className="mt-1.5 text-[13px] leading-6 text-[#13243c]">{t('saleDetail.pickupText')}</p>
            {sale.seller && (
              <p className="mt-2 text-[13px] font-bold leading-6 text-[#13243c]">
                {t('saleDetail.pickupContact', {
                  contact: [sale.seller.companyName, [sale.seller.firstName, sale.seller.lastName].filter(Boolean).join(' '), sale.seller.phone, sale.seller.email].filter(Boolean).join(' · '),
                })}
              </p>
            )}
          </div>
          <SignedDocuments esignature={sale.esignature} bonEnlevementUrl={sale.bonEnlevement?.url} />
        </section>
      )}

      {/* Frise des étapes de la procédure */}
      <section className="mb-6 rounded-[14px] border border-[#eceadf] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('saleDetail.progressTitle')}</h2>
          <span className="rounded-full bg-[#fdf6f2] border border-[#f7d6cb] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#d9704f]">
            {t('saleDetail.stepOf', { current: stepDisplayNumber(sale.currentStep), total: String(DISPLAYED_STEP_COUNT) })}
          </span>
        </div>

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
              <>
                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                  {historical ? "Vous avez réglé la commission d'achat." : t('saleDetail.step1Intro')}
                </p>

                {!historical && (
                  <ul className="mb-5 space-y-2">
                    {[t('saleDetail.step1Point1'), t('saleDetail.step1Point2')].map((point) => (
                      <li key={point} className="flex gap-2 text-sm leading-6 text-[#13243c]">
                        <span aria-hidden="true" className="text-[#d9704f]">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                )}

                {sale.fees && (
                  <dl className="mb-5 overflow-hidden rounded-[10px] border border-[#eceadf]">
                    <div className="flex items-baseline justify-between gap-3 border-b border-[#f1efe8] px-4 py-3">
                      <dt className="text-sm text-[#13243c]">{t('saleDetail.commission')}</dt>
                      <dd className="font-mono text-sm font-bold text-[#13243c]">{formatEuros(sale.fees.commission, language)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 border-b border-[#f1efe8] px-4 py-3">
                      <dt className="text-sm text-[#13243c]">
                        {t('saleDetail.tax', { name: sale.fees.taxName, rate: String(sale.fees.taxRate) })}
                      </dt>
                      <dd className="font-mono text-sm font-bold text-[#13243c]">{formatEuros(sale.fees.taxAmount, language)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 bg-[#13243c] px-4 py-3.5">
                      <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#c3cedd]">{t('saleDetail.total')}</dt>
                      <dd className="font-mono text-lg font-bold text-white">
                        {formatEuros(sale.fees.commission + sale.fees.taxAmount, language)}
                      </dd>
                    </div>
                  </dl>
                )}

                {!historical && (
                  <>
                    <fieldset className="mb-5">
                      <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">
                        {t('saleDetail.deliveryLabel')}
                      </legend>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {([
                          { value: 'main_propre' as const, label: t('saleDetail.deliveryHand'), help: t('saleDetail.deliveryHandHelp') },
                          { value: 'poste' as const, label: t('saleDetail.deliveryPost'), help: t('saleDetail.deliveryPostHelp') },
                        ]).map((option) => (
                          <label
                            key={option.value}
                            className={`cursor-pointer rounded-[10px] border p-3.5 transition ${
                              delivery === option.value ? 'border-[#13243c] bg-[#f1f4f8]' : 'border-[#dcd7cb] bg-white hover:border-[#13243c]'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="documentsDelivery"
                                value={option.value}
                                checked={delivery === option.value}
                                onChange={() => {
                                  setDelivery(option.value);
                                  setValidationError('');
                                }}
                                className="h-4 w-4 accent-[#13243c]"
                              />
                              <span className="text-sm font-bold text-[#13243c]">{option.label}</span>
                            </span>
                            <span className="mt-1.5 block text-[12px] leading-5 text-[#5a5e66]">{option.help}</span>
                          </label>
                        ))}
                      </div>
                      {validationError && (
                        <p className="mt-3 text-sm font-bold text-[#b04a2c] animate-pulse">
                          {validationError}
                        </p>
                      )}
                    </fieldset>

                    {!isStripeConfigured() ? (
                      <p className="rounded-[10px] border-l-4 border-red-500 bg-red-50 p-3.5 text-sm text-red-700">
                        {t('saleDetail.paymentUnavailable')}
                      </p>
                    ) : confirming ? (
                      <p className="text-sm font-semibold text-[#13243c]">{t('saleDetail.paymentVerifying')}</p>
                    ) : checkoutOpen && delivery ? (
                      <CommissionCheckout
                        saleId={sale.id}
                        documentsDelivery={delivery}
                        onCancel={() => setCheckoutOpen(false)}
                      />
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            onClick={openCheckout}
                            disabled={!remaining}
                            className="btn btn-accent w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
                          >
                            {t('saleDetail.payCommission')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelModalOpen(true)}
                            className="w-full text-sm font-bold text-red-600 hover:underline sm:w-auto"
                          >
                            Annuler mon achat
                          </button>
                        </div>
                        <p className="mt-2.5 text-[12px] italic text-[#5a5e66]">{t('saleDetail.paymentSecure')}</p>
                      </>
                    )}

                    <p className="mt-4 rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-sm leading-6 text-[#8a4b24]">
                      {t('saleDetail.deadlineWarning')}
                    </p>
                  </>
                )}
              </>
            )}
            
            {step === STEP.VIREMENT && (historical ? (
              <>
                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">{t('saleDetail.step2Done')}</p>
                <dl className="overflow-hidden rounded-[10px] border border-[#dcd7cb] bg-[#fbfaf7]">
                  <SellerRow label={t('saleDetail.step2History.amount')} value={sale.amount != null ? formatEuros(sale.amount, language) : ''} mono />
                  <SellerRow label={t('saleDetail.step2History.confirmedAt')} value={sale.transferConfirmedAt ? formatDate(sale.transferConfirmedAt) : ''} />
                </dl>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">{t('saleDetail.step2Intro')}</p>

                {sale.seller?.bankInfo && (
                  <dl className="mb-4 overflow-hidden rounded-[10px] border border-[#dcd7cb] bg-[#fbfaf7]">
                    <SellerRow label={t('saleDetail.sellerBank')} value={sale.seller.bankInfo.bankName} />
                    <SellerRow label={t('saleDetail.sellerAccountHolder')} value={sale.seller.bankInfo.accountHolder} />
                    <SellerRow label={t('saleDetail.sellerIban')} value={sale.seller.bankInfo.iban} mono />
                    <SellerRow label={t('saleDetail.sellerBic')} value={sale.seller.bankInfo.bic} mono />
                  </dl>
                )}

                {sale.amount != null && (
                  <div className="mb-4 flex items-baseline justify-between gap-3 rounded-[10px] bg-[#13243c] px-4 py-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#c3cedd]">{t('saleDetail.amountToTransfer')}</span>
                    <span className="font-mono text-lg font-bold text-white">{formatEuros(sale.amount, language)}</span>
                  </div>
                )}


                <p className="rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-sm leading-6 text-[#8a4b24]">
                  {t('saleDetail.deadlineWarning')}
                </p>
                <p className="mt-3 text-[12px] italic text-[#5a5e66]">{t('saleDetail.step2Coming')}</p>
              </>
            ))}
            
            {step === STEP.PREPARATION && (historical ? (
              <p className="text-sm leading-6 text-[#5a5e66]">
                {sale.documents.registrationCardSubmittedAt
                  ? t('saleDocs.preparationDoneOn', { date: formatDate(sale.documents.registrationCardSubmittedAt) })
                  : t('saleDocs.preparationDone')}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-[#5a5e66]">
                  {t(sale.documents.stamps.buyer ? 'saleDocs.preparationBuyer' : 'saleDocs.preparationBuyerNoStamp')}
                </p>
                {!sale.documents.stamps.buyer && <StampRequiredBanner stampHref={stampHref} />}
              </div>
            ))}

            {step === STEP.VERIFICATION && (
              <SaleDocumentsReview<WonSaleDetail>
                saleId={sale.id}
                side="buyer"
                documents={sale.documents}
                otherParty={sale.seller}
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
                side="buyer"
                signUrl={sale.esignature?.buyerUrl}
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
              <div key={group.key} ref={stepNumber === 2 ? stepTwoRef : undefined}>
                <VerticalStep
                  stepNumber={stepNumber}
                  title={t(`sales.step.${group.key}`)}
                  isOpen={isOpen}
                  isCurrent={isCurrent}
                  isCompleted={isCompleted}
                  isLast={isLast}
                  currentLabel={t('sales.currentStep')}
                  onClick={() => setViewedStepIndex(isOpen ? (sale.status === 'cloturee' ? null : displayStepIndex(sale.currentStep)) : index)}
                >
                {error && isOpen && <Alert variant="error" className="mb-4">{error}</Alert>}
                {!isHistorical && sale.currentStepDueAt && (
                  <p className={`mb-4 text-[13px] font-bold ${remaining ? 'text-red-600' : 'text-red-800'}`}>
                    {remaining
                      ? t('saleDetail.deadlineLeft', { time: remaining })
                      : t('saleDetail.deadlineOver')}
                  </p>
                )}
                {!isHistorical && <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('saleDetail.todo')}</h3>}

                {group.key === 'documents_administratifs' ? (
                  <DocumentsSubsteps currentStep={sale.currentStep} closed={sale.status === 'cloturee'}>
                    {renderStep}
                  </DocumentsSubsteps>
                ) : renderStep(group.steps[0], isHistorical)}
                </VerticalStep>
              </div>
            );
          })}
        </div>
      </section>

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !canceling && setCancelModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-[#13243c]">Annuler la vente</h3>
            <p className="mb-6 text-sm text-[#5a5e66]">
              Attention : l'annulation est définitive. Conformément aux conditions d'utilisation,
              vous devrez tout de même vous acquitter de la commission d'annulation
              {cancellationFee != null ? <> (<strong>{formatEuros(cancellationFee, language)}</strong>)</> : null}.<br /><br />
              <strong className="text-red-600">Votre compte sera immédiatement suspendu jusqu'au paiement de ce montant.</strong>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={canceling}
                className="btn btn-outline"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleCancelSale}
                disabled={canceling}
                className="btn bg-red-600 text-white hover:bg-red-700 border-red-600 disabled:opacity-50"
              >
                {canceling ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
