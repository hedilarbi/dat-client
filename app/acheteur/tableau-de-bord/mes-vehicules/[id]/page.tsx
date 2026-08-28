'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '../../../../api';
import { useUser } from '../../../../components/LayoutWrapper';
import { getRoleHomePath, localizedPath, useLanguage } from '../../../../i18n';
import Alert from '../../../../components/Alert';
import { UnderReviewNotice, SuspendedNotice } from '../../../../components/RegistrationStatusNotices';
import CommissionCheckout from '../../../../components/CommissionCheckout';
import VerticalStep from '../../../../components/VerticalStep';
import { formatEuros } from '../../../../lib/format';
import { isStripeConfigured } from '../../../../lib/stripe';
import { uploadFile } from '../../../../lib/uploadFile';

// Miroir de CERTIFICATE_REJECTION_REASONS (server/models/sale.model.js)
const REJECTION_REASONS = [
  'tampon_manquant', 'document_illisible', 'signature_manquante',
  'document_incomplet', 'mauvais_document', 'mauvais_tampon', 'autre',
] as const;

interface WonSaleDetail {
  id: string;
  amount: number | null;
  status: 'en_cours' | 'cloturee' | 'sans_gagnant' | 'annulee' | 'en_attente_confirmation';
  currentStep: number;
  stepKey: string | null;
  stepCount: number;
  steps: string[];
  currentStepStartedAt: string | null;
  currentStepDueAt: string | null;
  commissionPaidAt: string | null;
  documentsDelivery: DeliveryMode | null;
  certificate: {
    url: string | null; generatedAt: string | null; 
    sellerSignedUrl: string | null; sellerSignedAt: string | null;
    signedUrl: string | null; signedAt: string | null;
    validatedAt: string | null;
    buyerValidatedAt: string | null;
    lastRejection: { reason: string; comment?: string; rejectedAt?: string; rejectedBy?: string; url?: string; createdAt?: string } | null;
    rejectionCount: number;
  };
  handover: { declarationUrl: string | null; generatedAt: string | null; otp: string | null; confirmedAt: string | null };
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

  // Étape 3 : dépôt du certificat signé et tamponné
  const [signedFile, setSignedFile] = useState<File | null>(null);
  
  const [validatingSellerCertificate, setValidatingSellerCertificate] = useState(false);
  const [rejectingSellerCertificate, setRejectingSellerCertificate] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [sellerRejectReason, setSellerRejectReason] = useState('mauvais_tampon');
  const [sellerRejectComment, setSellerRejectComment] = useState('');
  const [submittingCertificate, setSubmittingCertificate] = useState(false);

  // Vue historique
  const [viewedStepIndex, setViewedStepIndex] = useState<number | null>(null);

  // Annulation
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Promotion / Réattribution
  const [acceptingPromotion, setAcceptingPromotion] = useState(false);
  const [refusingPromotion, setRefusingPromotion] = useState(false);

  const handleAcceptPromotion = async () => {
    try {
      setAcceptingPromotion(true);
      setError('');
      const res = await apiRequest(`/sales/${params.id}/accept-promotion`, { method: 'POST' });
      setSale(res.sale);
      setMessage('Félicitations ! Vous avez accepté l’attribution de ce véhicule.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’acceptation.');
    } finally {
      setAcceptingPromotion(false);
    }
  };

  const handleRefusePromotion = async () => {
    try {
      setRefusingPromotion(true);
      setError('');
      await apiRequest(`/sales/${params.id}/refuse-promotion`, { method: 'POST' });
      router.replace(localizedPath('/acheteur/tableau-de-bord/mes-vehicules', language));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du refus.');
      setRefusingPromotion(false);
    }
  };

  // Stripe renvoie sur cette page avec ?session_id=… une fois le paiement effectué
  const checkoutSessionId = searchParams.get('session_id');
  const confirming = Boolean(checkoutSessionId) && !confirmSettled;

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(localizedPath(`/acheteur/tableau-de-bord/mes-vehicules/${params.id}`, language))}`, language));
    }
  }, [userLoading, user, router, language, params.id]);

  useEffect(() => {
    if (user && user.role !== 'acheteur') {
      router.replace(localizedPath(getRoleHomePath(user.role), language));
    }
  }, [user, router, language]);

  useEffect(() => {
    if (user?.role !== 'acheteur' || user.status !== 'valide') return;
    apiRequest(`/sales/${params.id}`)
      .then((res) => { setSale(res.sale); setError(''); })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : t('saleDetail.notFound'));
      })
      .finally(() => setLoaded(true));
  }, [params.id, t, user]);

  // Rafraîchit le compte à rebours de l'échéance
  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Retour de Stripe : le serveur relit la session et n'avance l'étape que si elle est payée
  useEffect(() => {
    if (!checkoutSessionId || !loaded || !sale || sale.currentStep !== 1) return;
    // Un seul appel de confirmation par retour, même si l'effet est réexécuté
    if (confirmStartedRef.current) return;
    confirmStartedRef.current = true;

    apiRequest(`/sales/${params.id}/commission/confirm`, {
      method: 'POST',
      body: JSON.stringify({ checkoutSessionId }),
    })
      .then((res) => {
        setSale(res.sale);
        setMessage(t('saleDetail.paymentSuccess'));
        setError('');
        setCheckoutOpen(false);
        // Retire session_id de l'URL pour ne pas rejouer la confirmation au rechargement
        router.replace(localizedPath(`/acheteur/tableau-de-bord/mes-vehicules/${params.id}`, language));
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : t('saleDetail.notFound'));
      })
      .finally(() => setConfirmSettled(true));
  }, [checkoutSessionId, loaded, sale, params.id, router, language, t]);

  
  const handleValidateSellerCertificate = async () => {
    if (!sale) return;
    setValidatingSellerCertificate(true);
    setError('');
    try {
      const res = await apiRequest(`/sales/${sale.id}/seller-certificate/validate`, { method: 'POST' });
      setSale(res.sale);
      setMessage(res.message || '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('saleDetail.notFound'));
    } finally {
      setValidatingSellerCertificate(false);
    }
  };

  const handleRejectSellerCertificate = async () => {
    if (!sale) return;
    setRejectingSellerCertificate(true);
    setError('');
    try {
      const res = await apiRequest(`/sales/${sale.id}/seller-certificate/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: sellerRejectReason, comment: sellerRejectComment }),
      });
      setSale(res.sale);
      setMessage(res.message || '');
      setRejectingSellerCertificate(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('saleDetail.notFound'));
      setRejectingSellerCertificate(false);
    }
  };

const handleSubmitCertificate = async () => {
    if (!sale) return;
    if (!signedFile) {
      setError(t('saleDetail.certificateRequired'));
      return;
    }

    setSubmittingCertificate(true);
    setError('');
    try {
      // Le fichier passe par le stockage générique, puis son URL est rattachée à la vente
      const url = await uploadFile(signedFile, 'ventes/certificats');
      const res = await apiRequest(`/sales/${sale.id}/certificate`, {
        method: 'POST',
        body: JSON.stringify({ url, filename: signedFile.name }),
      });
      setSale(res.sale);
      setMessage(res.message || '');
      setSignedFile(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('saleDetail.notFound'));
    } finally {
      setSubmittingCertificate(false);
    }
  };

  const handleCancelSale = async () => {
    if (!sale) return;
    setCanceling(true);
    setError('');
    try {
      await apiRequest(`/sales/${sale.id}/cancel-buyer`, { method: 'PUT' });
      // Après l'annulation, le compte est suspendu.
      router.replace(localizedPath('/acheteur/tableau-de-bord/profil', language));
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
    <Link href={localizedPath('/acheteur/tableau-de-bord/mes-vehicules', language)} className="text-[13px] font-bold text-[#13243c] hover:underline flex items-center gap-1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      {t('saleDetail.backToList')}
    </Link>
  );

  if (userLoading || !user) {
    return <div className="flex-1 w-full bg-white p-8 text-sm font-medium text-[#5a5e66]">{t('saleDetail.loading')}</div>;
  }

  if (user.status !== 'valide' && user.status !== 'suspendu') {
    return <UnderReviewNotice />;
  }

  if (!loaded || confirming) {
    return <div className="flex-1 w-full bg-white p-8 text-sm font-medium text-[#5a5e66]">{t('saleDetail.loading')}</div>;
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
  const subtitle = [
    sale.vehicle?.year ? String(sale.vehicle.year) : null,
    sale.vehicle?.mileage != null ? `${sale.vehicle.mileage.toLocaleString(locale)} km` : null,
    sale.session?.name,
  ].filter(Boolean).join(' · ');

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

      {/* Proposition de réattribution en attente de confirmation */}
      {sale.status === 'en_attente_confirmation' && (
        <div className="mb-8 rounded-[16px] border border-[#f7d6cb] bg-[#fff8f5] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9704f] text-white text-lg font-bold">🎉</span>
            <div>
              <h2 className="font-heading text-lg font-bold uppercase text-[#13243c]">
                Véhicule attribué suite au désistement du gagnant précédent
              </h2>
              <p className="text-xs text-[#5a5e66]">
                Vous êtes désormais le candidat prioritaire pour acquérir ce véhicule.
              </p>
            </div>
          </div>

          <div className="my-5 rounded-[12px] bg-white p-5 border border-[#efece3] space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Véhicule :</span>
              <span className="font-bold text-[#13243c]">{title}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Montant de votre offre retenue :</span>
              <span className="font-mono font-bold text-[#d9704f] text-base">
                {sale.amount != null ? formatEuros(sale.amount, language) : '—'}
              </span>
            </div>
            <div className="text-[12px] text-gray-500 pt-2 border-t border-gray-100">
              ℹ️ Si vous acceptez, la procédure d'achat (Étape 1 : Paiement de la commission) démarrera immédiatement avec le délai prévu. Si vous refusez, <strong>aucune punition ni pénalité</strong> ne vous sera appliquée et le véhicule sera réattribué.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              disabled={refusingPromotion || acceptingPromotion}
              onClick={handleRefusePromotion}
              className="h-11 rounded-[9px] border border-gray-300 bg-white px-6 text-[13px] font-bold text-gray-700 hover:bg-gray-50 uppercase tracking-wide transition cursor-pointer disabled:opacity-50"
            >
              {refusingPromotion ? 'Refus en cours...' : 'Décliner l\'offre (sans pénalité)'}
            </button>
            <button
              type="button"
              disabled={acceptingPromotion || refusingPromotion}
              onClick={handleAcceptPromotion}
              className="h-11 rounded-[9px] bg-[#d9704f] hover:bg-[#b04a2c] text-white px-6 text-[13px] font-bold uppercase tracking-wide transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {acceptingPromotion ? 'Validation...' : 'Accepter l\'offre & démarrer l\'achat →'}
            </button>
          </div>
        </div>
      )}

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
            href={localizedPath(`/acheteur/tableau-de-bord/mes-vehicules/${sale.id}/fiche`, language)}
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
          <p className="mt-1 text-sm text-[#2f6f4f]">{t('saleDetail.closedText')}</p>
          {sale.handover.confirmedAt && (
            <p className="mt-1 text-[12px] text-[#2f6f4f]">
              {t('saleDetail.handoverDone', { date: new Date(sale.handover.confirmedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {sale.certificate.url && (
              <a href={sale.certificate.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-[#2f6f4f] hover:underline">
                ↓ {t('saleDetail.downloadCertificate')}
              </a>
            )}
            {sale.handover.declarationUrl && (
              <a href={sale.handover.declarationUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-[#2f6f4f] hover:underline">
                ↓ {t('saleDetail.downloadDeclaration')}
              </a>
            )}
          </div>
        </section>
      )}

      {/* Frise des étapes de la procédure */}
      <section className="mb-6 rounded-[14px] border border-[#eceadf] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('saleDetail.progressTitle')}</h2>
          <span className="rounded-full bg-[#fdf6f2] border border-[#f7d6cb] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#d9704f]">
            {t('saleDetail.stepOf', { current: String(sale.currentStep), total: String(sale.stepCount) })}
          </span>
        </div>

        <div className="mt-6 flex flex-col">
          {sale.steps.map((stepKey, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < sale.currentStep || sale.status === 'cloturee';
            const isActive = viewedStepIndex !== null ? viewedStepIndex === index : (sale.status === 'cloturee' ? false : stepNumber === sale.currentStep);
            const isHistorical = isCompleted;
            const renderStepNumber = stepNumber;
            const isLast = index === sale.steps.length - 1;

            return (
              <VerticalStep
                key={stepKey}
                stepNumber={stepNumber}
                title={t(`sales.step.${stepKey}`)}
                isActive={isActive}
                isCompleted={isCompleted}
                isLast={isLast}
                onClick={() => setViewedStepIndex(isActive ? (sale.status === 'cloturee' ? null : sale.currentStep - 1) : index)}
              >
                {error && isActive && <Alert variant="error" className="mb-4">{error}</Alert>}
                {!isHistorical && sale.currentStepDueAt && (
                  <p className={`mb-4 text-[13px] font-bold ${remaining ? 'text-red-600' : 'text-red-800'}`}>
                    {remaining
                      ? t('saleDetail.deadlineLeft', { time: remaining })
                      : t('saleDetail.deadlineOver')}
                  </p>
                )}
                {!isHistorical && <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('saleDetail.todo')}</h3>}

            {renderStepNumber === 1 && (
              <>
                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                  {isHistorical ? "Vous avez réglé la commission d'achat." : t('saleDetail.step1Intro')}
                </p>

                {!isHistorical && (
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

                {!isHistorical && (
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
            
            {renderStepNumber === 2 && (
              <>
                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                  {isHistorical ? "Le vendeur a confirmé la réception du virement bancaire." : t('saleDetail.step2Intro')}
                </p>

                {sale.amount != null && (
                  <div className="mb-4 flex items-baseline justify-between gap-3 rounded-[10px] bg-[#13243c] px-4 py-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#c3cedd]">{t('saleDetail.amountToTransfer')}</span>
                    <span className="font-mono text-lg font-bold text-white">{formatEuros(sale.amount, language)}</span>
                  </div>
                )}


                {!isHistorical && (
                  <>
                    <p className="rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-sm leading-6 text-[#8a4b24]">
                      {t('saleDetail.deadlineWarning')}
                    </p>
                    <p className="mt-3 text-[12px] italic text-[#5a5e66]">{t('saleDetail.step2Coming')}</p>
                  </>
                )}
              </>
            )}
            
            {renderStepNumber === 3 && (
              <>
                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                  {isHistorical 
                    ? "Le vendeur a téléchargé, signé et redéposé le certificat de cession." 
                    : "Le vendeur doit d'abord télécharger, tamponner et signer le certificat de cession. Vous serez invité à faire de même une fois son document déposé."}
                </p>

                {isHistorical && sale.certificate.sellerSignedUrl && (
                  <a
                    href={sale.certificate.sellerSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#13243c] bg-white px-4 py-3 transition hover:bg-[#f1f4f8] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-bold text-[#13243c]">↓ Télécharger le certificat signé par le vendeur</span>
                    {sale.certificate.sellerSignedAt && (
                      <span className="text-[11px] text-[#5a5e66]">
                        Déposé le {formatDate(sale.certificate.sellerSignedAt)}
                      </span>
                    )}
                  </a>
                )}
              </>
            )}
            
            
            {renderStepNumber === 4 && (
              <>
                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                  {isHistorical ? "Vous avez validé le certificat de cession du vendeur." : t('saleDetail.stepValidationWaiting')}
                </p>

                {(sale.certificate.sellerSignedUrl || sale.certificate.url) && (
                  <a
                    href={sale.certificate.sellerSignedUrl || sale.certificate.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#13243c] bg-white px-4 py-3 transition hover:bg-[#f1f4f8] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-bold text-[#13243c]">↓ Télécharger le certificat du vendeur</span>
                    {(sale.certificate.sellerSignedAt || sale.certificate.generatedAt) && (
                      <span className="text-[11px] text-[#5a5e66]">
                        {t('saleDetail.certificateGenerated', { date: new Date((sale.certificate.sellerSignedAt || sale.certificate.generatedAt)!).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}
                      </span>
                    )}
                  </a>
                )}

                {!isHistorical && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleValidateSellerCertificate}
                        disabled={validatingSellerCertificate || rejectingSellerCertificate}
                        className="btn bg-[#2f6f4f] hover:bg-emerald-800 text-white border-transparent w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto flex-1 flex items-center justify-center gap-2"
                      >
                        {validatingSellerCertificate && (
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {validatingSellerCertificate ? t('saleDetail.validating') : t('saleDetail.validateCertificate')}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRejectForm(!showRejectForm)}
                        disabled={validatingSellerCertificate || rejectingSellerCertificate}
                        className="btn bg-[#fdece4] border-[#9a3b2f] text-[#9a3b2f] hover:bg-[#9a3b2f] hover:text-white w-full sm:w-auto flex-1 transition"
                      >
                        {t('saleDetail.rejectCertificate')}
                      </button>
                    </div>

                    {showRejectForm && (
                      <div className="rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] p-4 mt-2">
                        <div className="mb-3 text-[13px] font-bold text-[#13243c]">{t('saleDetail.rejectTitle')}</div>
                        <div className="space-y-4">
                          <div>
                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#5a5e66]">
                              {t('saleDetail.rejectReasonLabel')}
                            </label>
                            <select
                              value={sellerRejectReason}
                              onChange={(e) => setSellerRejectReason(e.target.value)}
                              className="w-full rounded-[8px] border border-[#dcd7cb] bg-white px-3 py-2 text-sm focus:border-[#13243c] focus:outline-none"
                            >
                              {REJECTION_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                  {t(`reason.${reason}`)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#5a5e66]">
                              {t('saleDetail.rejectCommentLabel')}
                            </label>
                            <textarea
                              value={sellerRejectComment}
                              onChange={(e) => setSellerRejectComment(e.target.value)}
                              placeholder={t('saleDetail.rejectCommentPlaceholder')}
                              className="h-20 w-full resize-none rounded-[8px] border border-[#dcd7cb] bg-white px-3 py-2 text-sm focus:border-[#13243c] focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={handleRejectSellerCertificate}
                              disabled={rejectingSellerCertificate || validatingSellerCertificate}
                              className="btn bg-[#9a3b2f] text-white hover:bg-[#832f25]"
                            >
                              {rejectingSellerCertificate ? t('saleDetail.rejecting') : t('saleDetail.rejectConfirm')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {renderStepNumber === 5 && (
              <>
                {!isHistorical && sale.certificate.lastRejection && (
                  <div className="mb-4 rounded-[10px] border-l-4 border-[#9a3b2f] bg-[#fdece4] p-3.5">
                    <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#9a3b2f]">
                      {t('saleDetail.rejectedTitle')}
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-[#b04a2c]">
                      {t('saleDetail.rejectedReason', { reason: t(`reason.${sale.certificate.lastRejection.reason}`) })}
                    </p>
                    {sale.certificate.lastRejection.comment && (
                      <p className="mt-1 text-sm leading-6 text-[#b04a2c]">
                        {t('saleDetail.rejectedComment', { comment: sale.certificate.lastRejection.comment })}
                      </p>
                    )}
                    <p className="mt-2 text-[12px] text-[#8a4b24]">{t('saleDetail.rejectedAgain')}</p>
                  </div>
                )}

                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                  {isHistorical 
                    ? "Vous avez contresigné le certificat de cession." 
                    : t('saleDetail.step3Intro')}
                </p>

                {!isHistorical && (
                  <ol className="mb-5 space-y-2">
                    {[t('saleDetail.step3Point1'), t('saleDetail.step3Point2'), t('saleDetail.step3Point3')].map((point, index) => (
                      <li key={point} className="flex gap-2.5 text-sm leading-6 text-[#13243c]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#13243c] text-[11px] font-bold text-white">
                          {index + 1}
                        </span>
                        {point}
                      </li>
                    ))}
                  </ol>
                )}

                {(sale.certificate.sellerSignedUrl || sale.certificate.url) && (
                  <a
                    href={sale.certificate.sellerSignedUrl || sale.certificate.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#13243c] bg-white px-4 py-3 transition hover:bg-[#f1f4f8] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-bold text-[#13243c]">↓ Télécharger le certificat du vendeur {isHistorical ? '(avant votre signature)' : ''}</span>
                    {(sale.certificate.sellerSignedAt || sale.certificate.generatedAt) && (
                      <span className="text-[11px] text-[#5a5e66]">
                        {t('saleDetail.certificateGenerated', { date: new Date((sale.certificate.sellerSignedAt || sale.certificate.generatedAt)!).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}
                      </span>
                    )}
                  </a>
                )}

                {!isHistorical && sale.certificate.lastRejection && sale.certificate.lastRejection.rejectedBy === 'seller' && sale.certificate.lastRejection.url && (
                  <a
                    href={sale.certificate.lastRejection.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-red-300 bg-white px-4 py-3 transition hover:bg-[#fdece4] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-bold text-[#b91c1c]">↓ Télécharger votre certificat refusé</span>
                    <span className="text-[11px] text-[#b91c1c]">
                      Refusé le {sale.certificate.lastRejection.createdAt && formatDate(sale.certificate.lastRejection.createdAt)}
                    </span>
                  </a>
                )}

                {isHistorical && sale.certificate.signedUrl && (
                  <a
                    href={sale.certificate.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#2f6f4f] bg-[#e9f4ee] px-4 py-3 transition hover:bg-[#d1e8da] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-bold text-[#2f6f4f]">↓ Télécharger votre certificat signé</span>
                    {sale.certificate.signedAt && (
                      <span className="text-[11px] text-[#2f6f4f]">
                        Déposé le {formatDate(sale.certificate.signedAt)}
                      </span>
                    )}
                  </a>
                )}

                {!isHistorical && (
                  <div className="rounded-[10px] border border-dashed border-[#dcd7cb] bg-[#fbfaf7] p-4">
                    <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">
                      {t('saleDetail.uploadTitle')}
                    </div>
                    <p className="mb-3 text-[12px] text-[#5a5e66]">{t('saleDetail.uploadHint')}</p>

                    <label className="mb-3 flex cursor-pointer flex-col gap-2 sm:flex-row sm:items-center">
                      <span className="inline-flex h-10 items-center rounded-[8px] border border-[#dcd7cb] bg-white px-4 text-[12px] font-bold uppercase text-[#13243c] transition hover:bg-[#f1efe8]">
                        {t('saleDetail.chooseFile')}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(event) => setSignedFile(event.target.files?.[0] || null)}
                      />
                      <span className="truncate text-[13px] text-[#5a5e66]">{signedFile?.name || '—'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleSubmitCertificate}
                      disabled={submittingCertificate || !signedFile}
                      className="btn btn-accent w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
                    >
                      {submittingCertificate ? t('saleDetail.uploading') : t('saleDetail.submitCertificate')}
                    </button>
                  </div>
                )}
              </>
            )}

            {renderStepNumber === 6 && (
              <>
                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                  {isHistorical ? "Le vendeur a validé votre certificat de cession." : "En attente de la validation de votre document par le vendeur."}
                </p>

                {sale.certificate.signedUrl && (
                  <a
                    href={sale.certificate.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#13243c] bg-white px-4 py-3 transition hover:bg-[#f1f4f8] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-bold text-[#13243c]">↓ Télécharger votre certificat signé</span>
                    {sale.certificate.signedAt && (
                      <span className="text-[11px] text-[#5a5e66]">
                        Déposé le {formatDate(sale.certificate.signedAt)}
                      </span>
                    )}
                  </a>
                )}
              </>
            )}
            
            {renderStepNumber === 7 && (
              <>
                <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                  {isHistorical ? "L'enlèvement a été confirmé avec succès par le vendeur." : t('saleDetail.step5Intro')}
                </p>

                {sale.handover.declarationUrl && (
                  <a
                    href={sale.handover.declarationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#13243c] bg-white px-4 py-3 transition hover:bg-[#f1f4f8] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-bold text-[#13243c]">↓ {t('saleDetail.downloadDeclaration')}</span>
                    {sale.handover.generatedAt && (
                      <span className="text-[11px] text-[#5a5e66]">
                        {t('saleDetail.certificateGenerated', { date: new Date(sale.handover.generatedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}
                      </span>
                    )}
                  </a>
                )}

                {sale.handover.otp ? (
                  <div className="rounded-[12px] border-2 border-[#13243c] bg-[#13243c] p-5 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8ea0bd]">{t('saleDetail.otpTitle')}</div>
                    <div className="mt-2 font-mono text-[40px] font-bold leading-none tracking-[0.2em] text-white">
                      {sale.handover.otp}
                    </div>
                    <p className="mx-auto mt-3 max-w-[420px] text-[12px] leading-5 text-[#c3cedd]">{t('saleDetail.otpHint')}</p>
                  </div>
                ) : (
                  <p className="rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-sm leading-6 text-[#8a4b24]">
                    {t('saleDetail.otpPending')}
                  </p>
                )}
              </>
            )}
              </VerticalStep>
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
              vous devrez tout de même vous acquitter de la commission d'annulation (300,00 €).<br /><br />
              <strong className="text-red-600">Votre compte sera immédiatement suspendu jusqu'au paiement de cette pénalité.</strong>
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
