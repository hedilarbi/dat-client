'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '../../../api';
import { uploadFile } from '../../../lib/uploadFile';
import { useUser } from '../../../components/LayoutWrapper';
import { getRoleHomePath, localizedPath, useLanguage } from '../../../i18n';
import Alert from '../../../components/Alert';
import ConfirmModal from '../../../components/ConfirmModal';
import VerticalStep from '../../../components/VerticalStep';
import { formatEuros } from '../../../lib/format';

interface SellerSaleDetail {
  id: string;
  status: 'en_cours' | 'cloturee' | 'sans_gagnant' | 'annulee';
  amount: number | null;
  reservePrice: number | null;
  currentStep: number;
  stepKey: string | null;
  stepCount: number;
  steps: string[];
  currentStepStartedAt: string | null;
  currentStepDueAt: string | null;
  commissionPaidAt: string | null;
  documentsDelivery: 'main_propre' | 'poste' | null;
  transferConfirmedAt: string | null;
  certificate: {
    url: string | null; generatedAt: string | null; 
    sellerSignedUrl: string | null; sellerSignedAt: string | null;
    signedUrl: string | null; signedAt: string | null;
    validatedAt: string | null;
    lastRejection: { reason: string; comment?: string; rejectedAt?: string; rejectedBy?: string; url?: string; createdAt?: string } | null;
    rejectionCount: number;
  };
  handover: { declarationUrl: string | null; confirmedAt: string | null; otpAttempts: number };
  wonAt: string | null;
  closedAt: string | null;
  vehicle: { id: string; brand: string; model: string; year: number | null; mileage: number | null; photoUrl: string | null; registrationNumber: string | null } | null;
  session: { id: string; name: string; endDate: string } | null;
  /** Révélé par le serveur une fois la commission réglée */
  buyer: { companyName: string; firstName: string; lastName: string; email: string; phone: string; address?: { street?: string; city?: string; postalCode?: string; country?: string } } | null;
}

// Miroir de CERTIFICATE_REJECTION_REASONS (server/models/sale.model.js)
const REJECTION_REASONS = [
  'tampon_manquant', 'document_illisible', 'signature_manquante',
  'document_incomplet', 'mauvais_document', 'mauvais_tampon', 'autre',
] as const;

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
  const { user, loading: userLoading } = useUser();
  const { language, t } = useLanguage();

  const [sale, setSale] = useState<SellerSaleDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Étape 4 : validation du certificat signé déposé par l'acheteur
  const [validateOpen, setValidateOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [rejecting, setRejecting] = useState(false);
  // Étape 5 : saisie du code de remise communiqué par l'acheteur
  const [otp, setOtp] = useState('');
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [, setClock] = useState(0);

  // Vue historique
  const [viewedStepIndex, setViewedStepIndex] = useState<number | null>(null);

  // Upload certificat par le vendeur (Étape 3)
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [submittingCertificate, setSubmittingCertificate] = useState(false);

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
    if (user?.role !== 'vendeur' || user.status !== 'valide') return;
    apiRequest(`/sales/seller/${params.id}`)
      .then((res) => { setSale(res.sale); setError(''); })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
      })
      .finally(() => setLoaded(true));
  }, [params.id, t, user]);

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
      setConfirmOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
    } finally {
      setConfirming(false);
    }
  };

  const handleValidateCertificate = async () => {
    if (!sale) return;
    setValidating(true);
    setError('');
    try {
      const res = await apiRequest(`/sales/${sale.id}/certificate/validate`, { method: 'POST' });
      setSale(res.sale);
      setMessage(res.message || '');
      setValidateOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
    } finally {
      setValidating(false);
    }
  };

  const handleSubmitSellerCertificate = async () => {
    if (!sale) return;
    if (!signedFile) {
      setError(t('saleDetail.certificateRequired'));
      return;
    }

    setSubmittingCertificate(true);
    setError('');
    try {
      const url = await uploadFile(signedFile, 'ventes/certificats');
      const res = await apiRequest(`/sales/${sale.id}/certificate/seller`, {
        method: 'POST',
        body: JSON.stringify({ url, filename: signedFile.name }),
      });
      setSale(res.sale);
      setMessage(res.message || '');
      setSignedFile(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
    } finally {
      setSubmittingCertificate(false);
    }
  };

  const handleRejectCertificate = async () => {
    if (!sale) return;
    if (!rejectReason) {
      setError(t('sellerSale.rejectReasonRequired'));
      return;
    }

    setRejecting(true);
    setError('');
    try {
      const res = await apiRequest(`/sales/${sale.id}/certificate/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason, comment: rejectComment.trim() || undefined }),
      });
      setSale(res.sale);
      setMessage(res.message || '');
      setRejectOpen(false);
      setRejectReason('');
      setRejectComment('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
    } finally {
      setRejecting(false);
    }
  };

  const handleConfirmHandover = async () => {
    if (!sale) return;
    if (otp.trim().length !== 6) {
      setError(t('sellerSale.otpRequired'));
      return;
    }

    setSubmittingOtp(true);
    setError('');
    try {
      const res = await apiRequest(`/sales/${sale.id}/handover`, {
        method: 'POST',
        body: JSON.stringify({ otp: otp.trim() }),
      });
      setSale(res.sale);
      setMessage(res.message || '');
      setOtp('');
      setViewedStepIndex(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('sellerSale.notFound'));
    } finally {
      setSubmittingOtp(false);
    }
  };

  const backLink = <Link href={localizedPath('/vendeur/tableau-de-bord/ventes', language)} className="btn-back mb-6">
    {t('sellerSale.backToList')}
  </Link>;

  if (userLoading || !user || !loaded) {
    return <div className="flex-1 w-full bg-white p-8 text-sm font-medium text-[#5a5e66]">{t('sellerSale.loading')}</div>;
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
  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const subtitle = [
    sale.vehicle?.year ? String(sale.vehicle.year) : null,
    sale.vehicle?.mileage != null ? `${sale.vehicle.mileage.toLocaleString(locale)} km` : null,
    sale.session?.name,
  ].filter(Boolean).join(' · ');

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

      {sale.status === 'sans_gagnant' ? (
        <section className="rounded-[14px] border border-[#f5d5c7] bg-[#fdece4] p-5">
          <h2 className="font-heading text-[18px] font-bold uppercase text-[#b04a2c]">{t('sellerSale.unsoldTitle')}</h2>
          <p className="mt-1 text-sm text-[#b04a2c]">{t('sellerSale.unsoldText')}</p>
        </section>
      ) : (
        <>
          {sale.status === 'cloturee' && viewedStepIndex === null && (
            <section className="mb-6 rounded-[14px] border border-[#cbe3d5] bg-[#e9f4ee] p-5">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#2f6f4f]">{t('sellerSale.closedTitle')}</h2>
              <p className="mt-1 text-sm text-[#2f6f4f]">{t('sellerSale.closedText')}</p>
              {sale.handover.confirmedAt && (
                <p className="mt-1 text-[12px] text-[#2f6f4f]">
                  {t('sellerSale.handoverDone', { date: formatDate(sale.handover.confirmedAt) })}
                </p>
              )}
              {sale.handover.declarationUrl && (
                <a href={sale.handover.declarationUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[13px] font-bold text-[#2f6f4f] hover:underline">
                  {t('sellerSale.downloadDeclaration')}
                </a>
              )}
            </section>
          )}

          <section className="mb-6 rounded-[14px] border border-[#eceadf] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('sellerSale.progressTitle')}</h2>
              <span className="text-[12px] font-semibold text-[#13243c]">
                {t('sellerSale.stepOf', { current: String(sale.currentStep), total: String(sale.stepCount) })}
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
                    <p className="text-sm font-semibold text-[#13243c]">Par voie postale à l'adresse de l'acheteur :</p>
                    {sale.buyer?.address ? (
                      <address className="mt-1 text-[13px] text-[#5a5e66] not-italic leading-relaxed">
                        {sale.buyer.address.street && <div>{sale.buyer.address.street}</div>}
                        <div>{sale.buyer.address.postalCode} {sale.buyer.address.city}</div>
                        {sale.buyer.address.country && <div>{sale.buyer.address.country}</div>}
                      </address>
                    ) : (
                      <p className="mt-1 text-[13px] text-red-500 italic">L'adresse de l'acheteur est indisponible.</p>
                    )}
                  </div>
                )}
              </div>
            )}

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
                      <p className={`mb-4 text-[13px] font-semibold ${remaining ? 'text-[#8a6a2f]' : 'text-[#b04a2c]'}`}>
                        {remaining ? t('sellerSale.deadlineLeft', { time: remaining }) : t('sellerSale.deadlineOver')}
                      </p>
                    )}
                    {!isHistorical && <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('sellerSale.todo')}</h3>}


                {renderStepNumber === 1 && (
                  <p className="text-sm leading-6 text-[#5a5e66]">
                    {isHistorical ? "L'acheteur a réglé sa commission avec succès." : t('sellerSale.step1Waiting')}
                  </p>
                )}

                {renderStepNumber === 2 && (
                  <>
                    <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                      {isHistorical ? "Vous avez confirmé la réception du virement bancaire." : t('sellerSale.step2Waiting')}
                    </p>

                    {sale.amount != null && (
                      <div className="mb-4 flex items-baseline justify-between gap-3 rounded-[10px] bg-[#13243c] px-4 py-3.5">
                        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#c3cedd]">{t('sellerSale.amountExpected')}</span>
                        <span className="font-mono text-lg font-bold text-white">{formatEuros(sale.amount, language)}</span>
                      </div>
                    )}


                    {!isHistorical && (
                      <>
                        <p className="mb-4 rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-sm leading-6 text-[#8a4b24]">
                          {t('sellerSale.step2Note')}
                        </p>
                        <button
                          type="button"
                          onClick={() => setConfirmOpen(true)}
                          disabled={confirming}
                          className="h-12 w-full rounded-[9px] bg-[#2f6f4f] px-6 text-xs font-bold uppercase tracking-[.03em] text-white transition hover:bg-emerald-800 disabled:opacity-50 sm:w-auto sm:px-10 cursor-pointer"
                        >
                          {confirming ? t('sellerSale.confirming') : t('sellerSale.confirmTransfer')}
                        </button>
                        <p className="mt-2.5 text-[12px] leading-5 text-[#5a5e66]">{t('sellerSale.confirmWarning')}</p>
                      </>
                    )}
                  </>
                )}

                {renderStepNumber === 3 && (
                  <>
                    {!isHistorical && sale.transferConfirmedAt && (
                      <p className="mb-3 rounded-[10px] border-l-4 border-[#2f6f4f] bg-[#e9f4ee] p-3.5 text-sm leading-6 text-[#2f6f4f]">
                        {t('sellerSale.transferConfirmed', { date: formatDate(sale.transferConfirmedAt) })}
                      </p>
                    )}
                    
                    {!isHistorical && sale.certificate.lastRejection && sale.certificate.lastRejection.rejectedBy === 'buyer' && (
                      <div className="mb-4 rounded-[10px] border-l-4 border-[#9a3b2f] bg-[#fdece4] p-3.5">
                        <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#9a3b2f]">
                          {t('sellerSale.buyerRejection')}
                        </div>
                        <p className="mt-1.5 text-sm leading-6 text-[#b04a2c]">
                          {t(`reason.${sale.certificate.lastRejection.reason}`)}
                        </p>
                        {sale.certificate.lastRejection.comment && (
                          <p className="mt-1 text-sm leading-6 text-[#b04a2c]">
                            {sale.certificate.lastRejection.comment}
                          </p>
                        )}
                      </div>
                    )}
<h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">Certificat de cession</h3>
                    <p className="mb-3 text-sm leading-6 text-[#5a5e66]">
                      {isHistorical 
                        ? "Vous avez généré, signé et tamponné le certificat de cession. Les documents de cette étape sont disponibles ci-dessous." 
                        : "Vous devez télécharger, signer et tamponner le certificat de cession généré, puis le redéposer ci-dessous. Il sera ensuite transmis à l'acheteur."}
                    </p>
                    
                    {sale.certificate.url && (
                      <a
                        href={sale.certificate.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#13243c] bg-white px-4 py-3 transition hover:bg-[#f1f4f8] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-sm font-bold text-[#13243c]">↓ Télécharger le certificat généré {isHistorical ? '(avant signature)' : ''}</span>
                        {sale.certificate.generatedAt && (
                          <span className="text-[11px] text-[#5a5e66]">
                            Généré le {formatDate(sale.certificate.generatedAt)}
                          </span>
                        )}
                      </a>
                    )}

                    {!isHistorical && sale.certificate.lastRejection && sale.certificate.lastRejection.rejectedBy === 'buyer' && sale.certificate.lastRejection.url && (
                      <a
                        href={sale.certificate.lastRejection.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-red-300 bg-white px-4 py-3 transition hover:bg-[#fdece4] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-sm font-bold text-[#b91c1c]">↓ Télécharger le certificat refusé</span>
                        <span className="text-[11px] text-[#b91c1c]">
                          Refusé le {formatDate(sale.certificate.lastRejection.createdAt)}
                        </span>
                      </a>
                    )}

                    {isHistorical && sale.certificate.sellerSignedUrl && (
                      <a
                        href={sale.certificate.sellerSignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#2f6f4f] bg-[#e9f4ee] px-4 py-3 transition hover:bg-[#d1e8da] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-sm font-bold text-[#2f6f4f]">↓ Télécharger votre certificat signé</span>
                        {sale.certificate.sellerSignedAt && (
                          <span className="text-[11px] text-[#2f6f4f]">
                            Déposé le {formatDate(sale.certificate.sellerSignedAt)}
                          </span>
                        )}
                      </a>
                    )}

                    {!isHistorical && (
                      <div className="rounded-[10px] border border-dashed border-[#dcd7cb] bg-[#fbfaf7] p-4">
                        <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">
                          Déposer le document complété
                        </div>
                        <p className="mb-3 text-[12px] text-[#5a5e66]">Format PDF ou image lisible (JPG, PNG).</p>

                        <label className="mb-3 flex cursor-pointer flex-col gap-2 sm:flex-row sm:items-center">
                          <span className="inline-flex h-10 items-center rounded-[8px] border border-[#dcd7cb] bg-white px-4 text-[12px] font-bold uppercase text-[#13243c] transition hover:bg-[#f1efe8]">
                            Choisir un fichier
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
                          onClick={handleSubmitSellerCertificate}
                          disabled={submittingCertificate || !signedFile}
                          className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
                        >
                          {submittingCertificate ? 'Envoi...' : 'Envoyer le certificat'}
                        </button>
                      </div>
                    )}
                  </>
                )}

                
                {renderStepNumber === 4 && (
                  <>
                    <p className="mb-3 text-sm leading-6 text-[#5a5e66]">
                      {isHistorical ? "L'acheteur a validé votre certificat de cession." : t('sellerSale.stepValidationWaiting')}
                    </p>

                    {isHistorical && sale.certificate.buyerValidatedAt && (
                      <div className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#2f6f4f] bg-[#e9f4ee] px-4 py-3 transition hover:bg-[#d1e8da] sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm font-bold text-[#2f6f4f]">✓ Certificat vendeur validé</span>
                        <span className="text-[11px] text-[#2f6f4f]">
                          Le {new Date(sale.certificate.buyerValidatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}

{renderStepNumber === 5 && (
                  <>
                    <p className="mb-3 text-sm leading-6 text-[#5a5e66]">
                      {isHistorical ? "L'acheteur a signé et redéposé le certificat de cession." : t('sellerSale.step3Waiting')}
                    </p>
                    
                    {!isHistorical && sale.certificate.rejectionCount > 0 && (
                      <p className="mb-3 text-[12px] font-semibold text-[#b04a2c]">
                        {t('sellerSale.previousRejections', { count: String(sale.certificate.rejectionCount) })}
                        {sale.certificate.lastRejection && ` · ${t(`reason.${sale.certificate.lastRejection.reason}`)}`}
                      </p>
                    )}

                    {isHistorical && sale.certificate.signedUrl && (
                      <a
                        href={sale.certificate.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#13243c] bg-white px-4 py-3 transition hover:bg-[#f1f4f8] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-sm font-bold text-[#13243c]">↓ Télécharger le certificat de l'acheteur</span>
                        {sale.certificate.signedAt && (
                          <span className="text-[11px] text-[#5a5e66]">
                            Déposé le {formatDate(sale.certificate.signedAt)}
                          </span>
                        )}
                      </a>
                    )}
                  </>
                )}

                {renderStepNumber === 6 && (
                  <>
                    <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                      {isHistorical ? "Vous avez validé le document de l'acheteur." : t('sellerSale.step4Waiting')}
                    </p>

                    {sale.certificate.signedUrl && (
                      <a
                        href={sale.certificate.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-5 flex flex-col items-start gap-1 rounded-[10px] border border-[#13243c] bg-white px-4 py-3 transition hover:bg-[#f1f4f8] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-sm font-bold text-[#13243c]">↓ {t('sellerSale.downloadSignedCertificate')}</span>
                        {sale.certificate.signedAt && (
                          <span className="text-[11px] text-[#5a5e66]">
                            {t('sellerSale.uploadedOn', { date: formatDate(sale.certificate.signedAt) })}
                          </span>
                        )}
                      </a>
                    )}

                    {!isHistorical && sale.certificate.signedUrl ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => setValidateOpen(true)}
                            disabled={validating || rejecting}
                            className="btn bg-[#2f6f4f] hover:bg-emerald-800 text-white border-transparent w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto flex-1"
                          >
                            {validating ? t('sellerSale.validating') : t('sellerSale.validateCertificate')}
                          </button>

                          <button
                            type="button"
                            onClick={() => { setRejectOpen(!rejectOpen); if (rejectOpen) { setRejectReason(''); setRejectComment(''); } }}
                            disabled={validating || rejecting}
                            className="btn bg-[#fdece4] border-[#9a3b2f] text-[#9a3b2f] hover:bg-[#9a3b2f] hover:text-white w-full sm:w-auto flex-1 transition"
                          >
                            {t('sellerSale.rejectCertificate')}
                          </button>
                        </div>
                        <p className="text-[12px] leading-5 text-[#5a5e66]">{t('sellerSale.validateWarning')}</p>

                        {rejectOpen && (
                          <div className="rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] p-4 mt-2">
                            <div className="mb-3 text-[13px] font-bold text-[#13243c]">{t('sellerSale.rejectTitle')}</div>
                            <div className="space-y-4">
                              <div>
                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#5a5e66]">
                                  {t('sellerSale.rejectReasonLabel')}
                                </label>
                                <select
                                  value={rejectReason}
                                  onChange={(event) => setRejectReason(event.target.value)}
                                  className="w-full rounded-[8px] border border-[#dcd7cb] bg-white px-3 py-2 text-sm focus:border-[#13243c] focus:outline-none"
                                >
                                  <option value="">—</option>
                                  {REJECTION_REASONS.map((reason) => (
                                    <option key={reason} value={reason}>
                                      {t(`reason.${reason}`)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#5a5e66]">
                                  {t('sellerSale.rejectCommentLabel')}
                                </label>
                                <textarea
                                  rows={2}
                                  value={rejectComment}
                                  onChange={(event) => setRejectComment(event.target.value)}
                                  placeholder={t('sellerSale.rejectCommentPlaceholder')}
                                  className="h-20 w-full resize-none rounded-[8px] border border-[#dcd7cb] bg-white px-3 py-2 text-sm focus:border-[#13243c] focus:outline-none"
                                />
                              </div>
                              <p className="text-[12px] leading-5 text-[#8a4b24]">{t('sellerSale.rejectNote')}</p>
                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={handleRejectCertificate}
                                  disabled={rejecting || !rejectReason || validating}
                                  className="btn bg-[#9a3b2f] text-white hover:bg-[#832f25]"
                                >
                                  {rejecting ? t('sellerSale.rejecting') : t('sellerSale.rejectConfirm')}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-sm leading-6 text-[#8a4b24]">
                        {t('sellerSale.certificateMissing')}
                      </p>
                    )}
                  </>
                )}

                {renderStepNumber === 7 && (
                  <>
                    {!isHistorical && sale.certificate.validatedAt && (
                      <p className="mb-3 rounded-[10px] border-l-4 border-[#2f6f4f] bg-[#e9f4ee] p-3.5 text-sm leading-6 text-[#2f6f4f]">
                        {t('sellerSale.certificateValidated', { date: formatDate(sale.certificate.validatedAt) })}
                      </p>
                    )}
                    {isHistorical ? (
                      <div className="mb-4 rounded-[10px] border border-[#cbe3d5] bg-[#e9f4ee] p-4 text-center">
                        <h3 className="mb-2 font-heading text-[16px] font-bold uppercase text-[#2f6f4f]">Vente clôturée</h3>
                        <p className="text-sm leading-6 text-[#2f6f4f]">
                          L'enlèvement a été confirmé avec succès et la vente est maintenant terminée.
                        </p>
                        {sale.handover?.declarationUrl && (
                          <a href={sale.handover.declarationUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-[8px] bg-[#2f6f4f] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-[#1f4f37]">
                            {t('sellerSale.downloadDeclaration')}
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="mb-4 text-sm leading-6 text-[#5a5e66]">
                        {t('sellerSale.step5Intro')}
                      </p>
                    )}

                    {!isHistorical && (
                      <>
                        <label className="mb-3 block max-w-[320px]">
                          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#7a756a]">
                            {t('sellerSale.otpLabel')}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={otp}
                            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="h-14 w-full rounded-[10px] border border-[#dcd7cb] bg-white px-4 text-center font-mono text-[28px] font-bold tracking-[0.3em] text-[#13243c] outline-none focus:border-[#13243c]"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleConfirmHandover}
                          disabled={submittingOtp || otp.length !== 6}
                          className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
                        >
                          {submittingOtp ? t('sellerSale.otpSubmitting') : t('sellerSale.otpSubmit')}
                        </button>
                      </>
                    )}
                  </>
                )}
                  </VerticalStep>
                );
              })}
            </div>
          </section>
        </>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={t('sellerSale.confirmTransfer')}
        message={t('sellerSale.confirmWarning')}
        confirmLabel={t('sellerSale.confirmTransfer')}
        loading={confirming}
        onConfirm={handleConfirmTransfer}
        onCancel={() => { if (!confirming) setConfirmOpen(false); }}
      />

      <ConfirmModal
        open={validateOpen}
        title={t('sellerSale.validateCertificate')}
        message={t('sellerSale.validateWarning')}
        confirmLabel={t('sellerSale.validateCertificate')}
        loading={validating}
        onConfirm={handleValidateCertificate}
        onCancel={() => { if (!validating) setValidateOpen(false); }}
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
