'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useLanguage } from '../i18n';
import { formatEuros } from '../lib/format';

interface CommissionTierSummary {
  minAmount: number;
  maxAmount: number | null;
  type: 'percentage' | 'fixed';
  value: number;
}

interface OfferQuote {
  vehicle: { id: string; brand: string; model: string };
  session: { id: string; name: string; endDate: string };
  amount: number;
  commission: number;
  commissionTier: CommissionTierSummary | null;
  taxName: string;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface BidModalProps {
  vehicleId: string;
  vehicleTitle: string;
  /** Renseigné pour modifier une offre existante ; absent pour en déposer une nouvelle */
  offerId?: string;
  initialAmount?: number;
  onClose: () => void;
  /** Appelé après enregistrement, pour rafraîchir la liste appelante */
  onSaved?: () => void;
}

type Step = 'amount' | 'recap' | 'success';

/**
 * Dépôt et modification d'une offre suivent exactement le même parcours : saisie du prix,
 * récapitulatif des frais recalculés par le serveur, puis approbation explicite.
 * Le composant est monté à l'ouverture et démonté à la fermeture : son état repart donc à zéro.
 */
export default function BidModal({ vehicleId, vehicleTitle, offerId, initialAmount, onClose, onSaved }: BidModalProps) {
  const { language, t } = useLanguage();
  const isEdit = Boolean(offerId);

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState(initialAmount != null ? String(initialAmount) : '');
  const [quote, setQuote] = useState<OfferQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const close = () => {
    if (submitting) return;
    onClose();
  };

  // Étape 1 : le serveur recalcule commission et taxe, l'aperçu n'est jamais calculé côté client
  const handleConfirmAmount = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (amount === '' || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(t('bid.amountRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await apiRequest('/offers/quote', {
        method: 'POST',
        body: JSON.stringify({ vehicleId, amount: numericAmount }),
      });
      setQuote(res.quote);
      setStep('recap');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('bid.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Étape 2 : l'offre n'est enregistrée qu'après approbation explicite du récapitulatif des frais
  const handleApprove = async () => {
    if (!quote) return;
    setSubmitting(true);
    setError('');
    try {
      if (isEdit) {
        await apiRequest(`/offers/${offerId}`, {
          method: 'PUT',
          body: JSON.stringify({ amount: quote.amount }),
        });
      } else {
        await apiRequest('/offers', {
          method: 'POST',
          body: JSON.stringify({ vehicleId, amount: quote.amount }),
        });
      }
      setStep('success');
      onSaved?.();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('bid.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const commissionDetail = (tier: CommissionTierSummary | null) => {
    if (!tier) return t('bid.commissionNone');
    return tier.type === 'percentage'
      ? t('bid.commissionTierPercentage', { value: String(tier.value) })
      : t('bid.commissionTierFixed');
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-[rgba(8,15,27,.72)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bid-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <div className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-[16px] bg-white shadow-[0_26px_60px_rgba(0,0,0,.35)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#efece3] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a3987f]">{vehicleTitle}</p>
            <h2 id="bid-modal-title" className="mt-1 font-heading text-[22px] font-bold uppercase leading-none text-[#13243c]">
              {step === 'success'
                ? t(isEdit ? 'bid.editSuccessTitle' : 'bid.successTitle')
                : t(isEdit ? 'bid.editTitle' : 'bid.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t('bid.close')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#dcd7cb] text-lg leading-none text-[#5a5e66] transition hover:bg-[#f8f7f2] cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          {error && <p className="mb-4 rounded-[9px] border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {step === 'amount' && (
            <form onSubmit={handleConfirmAmount} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[.06em] text-[#5a5e66]">
                  {t('bid.amountLabel')}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="number"
                    min={1}
                    step="1"
                    inputMode="numeric"
                    placeholder={t('bid.amountPlaceholder')}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="h-14 w-full rounded-[10px] border border-[#dcd7cb] px-4 font-heading text-[24px] font-bold text-[#13243c] outline-none focus:border-[#13243c]"
                  />
                  <span className="font-heading text-[24px] font-bold text-[#13243c]">€</span>
                </div>
                <span className="mt-2 block text-xs leading-5 text-[#5a5e66]">{t('bid.amountHint')}</span>
              </label>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={close}
                  disabled={submitting}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  {t('bid.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-accent disabled:opacity-50"
                >
                  {t('bid.confirm')}
                </button>
              </div>
            </form>
          )}

          {step === 'recap' && quote && (
            <div className="space-y-4">
              <p className="rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-sm leading-6 text-[#8a4b24]">
                {t('bid.feesWarning')}
              </p>

              <div>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-[#5a5e66]">{t('bid.recapTitle')}</h3>
                <dl className="overflow-hidden rounded-[10px] border border-[#eceadf]">
                  <div className="flex items-baseline justify-between gap-3 border-b border-[#f1efe8] px-4 py-3">
                    <dt className="text-sm text-[#13243c]">{t('bid.yourPrice')}</dt>
                    <dd className="font-mono text-sm font-bold text-[#13243c]">{formatEuros(quote.amount, language)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-[#f1efe8] px-4 py-3">
                    <dt className="text-sm text-[#13243c]">
                      {t('bid.commission')}
                      <span className="mt-0.5 block text-xs text-[#5a5e66]">{commissionDetail(quote.commissionTier)}</span>
                    </dt>
                    <dd className="font-mono text-sm font-bold text-[#13243c]">{formatEuros(quote.commission, language)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-[#f1efe8] px-4 py-3">
                    <dt className="text-sm text-[#13243c]">
                      {t('bid.tax', { name: quote.taxName, rate: String(quote.taxRate) })}
                      <span className="mt-0.5 block text-xs text-[#5a5e66]">{t('bid.taxNote')}</span>
                    </dt>
                    <dd className="font-mono text-sm font-bold text-[#13243c]">{formatEuros(quote.taxAmount, language)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 bg-[#13243c] px-4 py-3.5">
                    <dt className="text-[11px] font-bold uppercase tracking-[.06em] text-[#c3cedd]">{t('bid.total')}</dt>
                    <dd className="font-mono text-lg font-bold text-white">{formatEuros(quote.total, language)}</dd>
                  </div>
                </dl>
              </div>

              <p className="text-sm font-bold text-[#13243c]">{t('bid.approveQuestion')}</p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={submitting}
                  className="btn btn-accent disabled:opacity-50"
                >
                  {t(isEdit ? 'bid.approveEdit' : 'bid.approve')}
                </button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={close}
                    disabled={submitting}
                    className="btn btn-danger flex-1 disabled:opacity-50"
                  >
                    {t('bid.decline')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep('amount'); setError(''); }}
                    disabled={submitting}
                    className="h-11 flex-1 rounded-[9px] border border-[#dcd7cb] px-4 text-xs font-bold uppercase text-[#13243c] transition hover:bg-[#f8f7f2] disabled:opacity-50 cursor-pointer"
                  >
                    {t('bid.back')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && quote && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f2ea] text-2xl text-[#2f6f4f]">✓</div>
              <p className="text-sm leading-6 text-[#13243c]">
                {t(isEdit ? 'bid.editSuccessText' : 'bid.successText', { amount: formatEuros(quote.amount, language), vehicle: vehicleTitle })}
              </p>
              <div className="rounded-[10px] bg-[#f8f7f2] px-4 py-3 text-left">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[.06em] text-[#5a5e66]">{t('bid.total')}</span>
                  <span className="font-mono text-sm font-bold text-[#13243c]">{formatEuros(quote.total, language)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="btn btn-primary w-full"
              >
                {t('bid.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
