'use client';

import React from 'react';
import type { VehicleDossierPayload } from '../../lib/vehicleDossier';
import { useLanguage } from '../../i18n';

interface StepPricingProps {
  values: VehicleDossierPayload;
  onChange: (patch: Partial<VehicleDossierPayload>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
}

export default function StepPricing({
  values,
  onChange,
  onNext,
}: StepPricingProps) {
  const { t } = useLanguage();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form id="step-pricing-form" onSubmit={handleSubmit} className="max-w-[760px] w-full">
      {/* Prix de réserve */}
      <div className="mb-6.5">
        <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#4c5058] mb-[7px]">
          {t('dossierPricing.reserve')}
        </label>
        <div className="relative max-w-[280px]">
          <input
            required
            aria-label={t('dossierPricing.reserve')}
            type="number"
            min={0}
            value={values.reservePrice ?? ''}
            onChange={(e) => onChange({ reservePrice: e.target.value ? Number(e.target.value) : undefined })}
            placeholder={t('dossierPricing.placeholder')}
            className="w-full h-[52px] border border-[#dcd7cb] rounded-[9px] px-4 font-mono font-semibold text-[16px] text-[#1a2230] focus:outline-none focus:border-[#13243c] bg-white transition pr-10"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-semibold text-[16px] text-[#4c5058]">
            €
          </span>
        </div>
        <div className="font-normal text-[12px] leading-relaxed text-[#5a5e66] mt-1.5">
          {t('dossierPricing.help')}
        </div>
      </div>

    </form>
  );
}
