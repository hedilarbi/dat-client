'use client';

import React, { useCallback } from 'react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { apiRequest } from '../api';
import { useLanguage } from '../i18n';
import { getStripe } from '../lib/stripe';

interface PendingCommissionCheckoutProps {
  onCancel: () => void;
}

export default function PendingCommissionCheckout({ onCancel }: PendingCommissionCheckoutProps) {
  const { t } = useLanguage();

  const fetchClientSecret = useCallback(async () => {
    const res = await apiRequest(`/auth/me/pending-commission/checkout`, {
      method: 'POST',
    });
    return res.clientSecret as string;
  }, []);

  return (
    <div className="rounded-[12px] border border-[#eceadf] bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">
          Règlement de la commission
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
