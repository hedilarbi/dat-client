'use client';

import React, { useCallback } from 'react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { apiRequest } from '../api';
import { useLanguage } from '../i18n';
import { getStripe } from '../lib/stripe';

interface CommissionCheckoutProps {
  saleId: string;
  documentsDelivery: 'main_propre' | 'poste';
  onCancel: () => void;
}

/**
 * Formulaire de paiement Stripe embarqué. Les champs carte sont hébergés par Stripe
 * dans une iframe : aucune donnée bancaire ne transite par nos pages.
 * La session est créée côté serveur, qui fixe seul le montant.
 */
export default function CommissionCheckout({ saleId, documentsDelivery, onCancel }: CommissionCheckoutProps) {
  const { t } = useLanguage();

  const fetchClientSecret = useCallback(async () => {
    const res = await apiRequest(`/sales/${saleId}/commission/checkout`, {
      method: 'POST',
      body: JSON.stringify({ documentsDelivery }),
    });
    return res.clientSecret as string;
  }, [saleId, documentsDelivery]);

  return (
    <div className="rounded-[12px] border border-[#eceadf] bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">
          {t('saleDetail.paymentTitle')}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] font-bold text-[#5a5e66] hover:text-[#13243c] cursor-pointer"
        >
          {t('saleDetail.paymentCancel')}
        </button>
      </div>

      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
