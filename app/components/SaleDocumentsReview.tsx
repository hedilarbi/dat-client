'use client';

import React, { useState } from 'react';
import { apiRequest } from '../api';
import { uploadFile } from '../lib/uploadFile';
import { useLanguage } from '../i18n';
import ConfirmModal from './ConfirmModal';
import Spinner from './Spinner';
import StampRequiredBanner from './StampRequiredBanner';
import {
  DOCUMENT_REPORT_REASONS,
  type ReviewDecision,
  type ReviewDocument,
  type SaleDocumentsState,
  type SaleSide,
} from '../lib/saleSteps';

/** Identité de l'autre partie, à comparer avec celle portée sur les documents. */
export interface ReviewParty {
  companyName?: string | null;
  siret?: string | null;
  address?: { street?: string; postalCode?: string; city?: string; country?: string } | null;
}

interface SaleDocumentsReviewProps<TSale> {
  saleId: string;
  side: SaleSide;
  documents: SaleDocumentsState;
  otherParty?: ReviewParty | null;
  isHistorical: boolean;
  stampHref: string;
  // Le serveur renvoie la vente telle que la voit l'utilisateur, avec un message de confirmation
  onUpdated: (sale: TSale, message: string) => void;
}

const REVIEW_DOCUMENTS: ReviewDocument[] = ['certificate', 'purchaseDeclaration'];

/**
 * Étape 3.2 : le certificat de cession et la déclaration d'achat, remplis et tamponnés par les
 * deux parties. Les deux parties voient la même chose : chacune valide ou signale une erreur ;
 * après un signalement, chacune peut redéposer chaque document, puis tout est revérifié.
 */
export default function SaleDocumentsReview<TSale>({
  saleId,
  side,
  documents,
  otherParty,
  isHistorical,
  stampHref,
  onUpdated,
}: SaleDocumentsReviewProps<TSale>) {
  const { t } = useLanguage();
  const otherSide: SaleSide = side === 'seller' ? 'buyer' : 'seller';
  const { review } = documents;
  const mine = review[side];
  const other = review[otherSide];

  const [error, setError] = useState('');
  // Action en cours : 'valide', 'erreur' ou le document en cours de dépôt
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<Partial<Record<ReviewDocument, File>>>({});

  const post = async (action: string, path: 'review' | 'upload', body: Record<string, unknown>) => {
    setBusy(action);
    setError('');
    try {
      const res = await apiRequest(`/sales/${saleId}/documents/${path}`, { method: 'POST', body: JSON.stringify(body) });
      onUpdated(res.sale as TSale, res.message || '');
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('saleDocs.error'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const validate = async () => {
    if (await post('valide', 'review', { decision: 'valide' })) setConfirmOpen(false);
  };

  const report = async () => {
    if (await post('erreur', 'review', { decision: 'erreur', reason, comment: comment.trim() || undefined })) {
      setReportOpen(false);
      setReason('');
      setComment('');
    }
  };

  const upload = async (document: ReviewDocument) => {
    const file = files[document];
    if (!file) return;
    setBusy(document);
    setError('');
    let url: string;
    try {
      url = await uploadFile(file, 'ventes/certificats');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t('saleDocs.error'));
      setBusy(null);
      return;
    }
    if (await post(document, 'upload', { document, url, filename: file.name })) {
      setFiles((current) => ({ ...current, [document]: undefined }));
    }
  };

  // Documents pas encore générés : tout reste figé tant qu'un des deux tampons manque.
  if (review.version === 0) {
    const waiting = !documents.stamps[otherSide]
      ? t(`saleDocs.waitingStamp.${otherSide}`)
      : !documents.stamps[side] ? t('saleDocs.waitingOwnStamp') : t('saleDocs.generating');
    return (
      <div className="space-y-3">
        {!documents.stamps[side] && <StampRequiredBanner stampHref={stampHref} />}
        <p className="rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-sm leading-6 text-[#8a4b24]">{waiting}</p>
      </div>
    );
  }

  const decisionLabel = (decision: ReviewDecision | null) => {
    if (decision?.decision === 'valide') return `✓ ${t('saleDocs.status.valide')}`;
    if (decision?.decision === 'erreur') return `⚠ ${t('saleDocs.status.erreur')}`;
    return t('saleDocs.status.pending');
  };
  const decisionClass = (decision: ReviewDecision | null) => (
    decision?.decision === 'valide' ? 'font-bold text-[#2f6f4f]'
      : decision?.decision === 'erreur' ? 'font-bold text-[#b04a2c]'
        : 'text-[#7a756a]'
  );

  return (
    <div>
      <p className="mb-4 text-sm leading-6 text-[#5a5e66]">{t(isHistorical ? 'saleDocs.historical' : 'saleDocs.intro')}</p>

      {otherParty && (
        <div className="mb-4 overflow-hidden rounded-[10px] border border-[#dcd7cb] bg-white">
          <div className="border-b border-[#efece3] bg-[#f8f7f2] px-4 py-3">
            <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t(`saleDocs.otherParty.${otherSide}`)}</div>
            {!isHistorical && <p className="mt-0.5 text-[12px] text-[#5a5e66]">{t('saleDocs.otherPartyHint')}</p>}
          </div>
          <dl className="divide-y divide-[#f1efe8]">
            {[
              { label: t('saleDocs.companyName'), value: otherParty.companyName },
              { label: t('saleDocs.siret'), value: otherParty.siret, mono: true },
              {
                label: t('saleDocs.address'),
                value: otherParty.address
                  ? [otherParty.address.street, [otherParty.address.postalCode, otherParty.address.city].filter(Boolean).join(' '), otherParty.address.country].filter(Boolean).join(', ')
                  : null,
              },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7a756a]">{row.label}</dt>
                <dd className={`text-sm text-[#13243c] sm:text-right ${row.mono ? 'font-mono font-bold' : 'font-semibold'}`}>{row.value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {REVIEW_DOCUMENTS.map((document) => {
          const file = documents[document];
          if (!file) return null;
          return (
            <div key={document} className="flex flex-col justify-between gap-3 rounded-[10px] border border-[#dcd7cb] bg-white p-4">
              <div>
                <div className="text-sm font-bold text-[#13243c]">{t(`saleDocs.document.${document}`)}</div>
                <div className="mt-0.5 text-[12px] text-[#7a756a]">{t(`saleDocs.source.${file.source}`)}</div>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-[8px] border border-[#13243c] px-4 text-[12px] font-bold uppercase text-[#13243c] transition hover:bg-[#f1f4f8]"
              >
                {t('saleDocs.view')}
              </a>
            </div>
          );
        })}
      </div>

      <ul className="mb-4 grid gap-2 sm:grid-cols-2">
        {[
          { key: side, label: t('saleDocs.you'), decision: mine },
          { key: otherSide, label: t(`saleDocs.party.${otherSide}`), decision: other },
        ].map((party) => (
          <li key={party.key} className="rounded-[9px] border border-[#eceadf] bg-white px-3 py-2 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-[#13243c]">{party.label}</span>
              <span className={decisionClass(party.decision)}>{decisionLabel(party.decision)}</span>
            </div>
            {party.decision?.decision === 'erreur' && (
              <p className="mt-1 text-[12px] leading-5 text-[#b04a2c]">
                {t(`saleDocs.reason.${party.decision.reason}`)}
                {party.decision.comment ? ` — ${party.decision.comment}` : ''}
              </p>
            )}
          </li>
        ))}
      </ul>

      {!isHistorical && (
        <>
          {error && <p className="mb-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 p-3 text-[13px] text-red-700" role="alert">{error}</p>}

          {mine?.decision === 'valide' && other?.decision !== 'valide' && (
            <p className="mb-3 rounded-[10px] border-l-4 border-[#2f6f4f] bg-[#e9f4ee] p-3.5 text-[13px] leading-6 text-[#2f6f4f]">
              {t(`saleDocs.validatedWaiting.${otherSide}`)}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {mine?.decision !== 'valide' && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={busy !== null}
                className="btn border-transparent bg-[#2f6f4f] text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('saleDocs.validate')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setReportOpen((open) => !open)}
              disabled={busy !== null}
              className="btn border-[#9a3b2f] bg-[#fdece4] text-[#9a3b2f] transition hover:bg-[#9a3b2f] hover:text-white disabled:opacity-50"
            >
              {t('saleDocs.report')}
            </button>
          </div>

          {reportOpen && (
            <div className="mt-3 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#5a5e66]" htmlFor="report-reason">
                {t('saleDocs.reportReason')}
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mb-3 w-full rounded-[8px] border border-[#dcd7cb] bg-white px-3 py-2 text-sm focus:border-[#13243c] focus:outline-none"
              >
                <option value="">—</option>
                {DOCUMENT_REPORT_REASONS.map((value) => (
                  <option key={value} value={value}>{t(`saleDocs.reason.${value}`)}</option>
                ))}
              </select>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#5a5e66]" htmlFor="report-comment">
                {t('saleDocs.reportComment')}
              </label>
              <textarea
                id="report-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t('saleDocs.reportCommentPlaceholder')}
                maxLength={1000}
                className="h-20 w-full resize-none rounded-[8px] border border-[#dcd7cb] bg-white px-3 py-2 text-sm focus:border-[#13243c] focus:outline-none"
              />
              <p className="mt-2 text-[12px] leading-5 text-[#8a4b24]">{t('saleDocs.reportNote')}</p>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={report}
                  disabled={busy !== null || !reason || (reason === 'autre' && !comment.trim())}
                  className="btn bg-[#9a3b2f] text-white hover:bg-[#832f25] disabled:opacity-50"
                >
                  {busy === 'erreur' && <Spinner />} {t('saleDocs.reportConfirm')}
                </button>
              </div>
            </div>
          )}

          {review.correctionOpen && (
            <div className="mt-5 rounded-[10px] border border-dashed border-[#dcd7cb] bg-[#fbfaf7] p-4">
              <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('saleDocs.uploadTitle')}</div>
              <p className="mb-4 text-[12px] leading-5 text-[#5a5e66]">{t('saleDocs.uploadHint')}</p>
              <div className="space-y-3">
                {REVIEW_DOCUMENTS.map((document) => (
                  <div key={document} className="flex flex-col gap-2 rounded-[9px] border border-[#eceadf] bg-white p-3 sm:flex-row sm:items-center">
                    <span className="text-[13px] font-semibold text-[#13243c] sm:w-48 sm:shrink-0">{t(`saleDocs.document.${document}`)}</span>
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                      <span className="inline-flex h-9 shrink-0 items-center rounded-[8px] border border-[#dcd7cb] bg-white px-3 text-[12px] font-bold uppercase text-[#13243c] transition hover:bg-[#f1efe8]">
                        {t('saleDocs.chooseFile')}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          setFiles((current) => ({ ...current, [document]: file }));
                        }}
                      />
                      <span className="truncate text-[12px] text-[#5a5e66]">{files[document]?.name || '—'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => upload(document)}
                      disabled={!files[document] || busy !== null}
                      className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy === document && <Spinner />} {t('saleDocs.upload')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={t('saleDocs.validate')}
        message={t('saleDocs.validateConfirm')}
        confirmLabel={t('saleDocs.validate')}
        loading={busy === 'valide'}
        onConfirm={validate}
        onCancel={() => { if (busy !== 'valide') setConfirmOpen(false); }}
      />
    </div>
  );
}
