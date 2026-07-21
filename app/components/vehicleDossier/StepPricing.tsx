'use client';

import React from 'react';
import { useLanguage } from '../../i18n';
import Spinner from '../Spinner';
import type { VehicleDossierPayload } from '../../lib/vehicleDossier';

interface StepPricingProps {
  values: VehicleDossierPayload;
  onChange: (patch: Partial<VehicleDossierPayload>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
}

export default function StepPricing({ values, onChange, onNext, onBack, onSaveDraft, savingDraft }: StepPricingProps) {
  const { t } = useLanguage();
  const isValid = Boolean(values.reservePrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-9 lg:p-[36px_48px_40px] space-y-8">
      <div className="max-w-[420px]">
        <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.reservePrice')}</label>
        <input
          required
          type="number"
          min={0}
          value={values.reservePrice ?? ''}
          onChange={(e) => onChange({ reservePrice: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
          placeholder={t('vehicleDossier.reservePricePlaceholder')}
        />
        <p className="text-[12px] text-[#9a917d] mt-2">{t('vehicleDossier.reservePriceHint')}</p>
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.conditionDetails')}</label>
        <textarea
          rows={5}
          value={values.conditionDetails || ''}
          onChange={(e) => onChange({ conditionDetails: e.target.value })}
          className="w-full border border-[#dcd7cb] rounded-[9px] p-4 text-sm text-[#1a2230] focus:outline-none"
          placeholder={t('vehicleDossier.conditionDetailsPlaceholder')}
        />
      </div>

      <div className="pt-4 border-t border-[#efece3] flex justify-between items-center gap-3 flex-wrap">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-12 px-6 border border-[#dcd7cb] rounded-[9px] text-[#13243c] font-semibold hover:bg-gray-50 transition"
          >
            {t('vehicleDossier.back')}
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={savingDraft}
            className="h-12 px-6 border border-[#dcd7cb] rounded-[9px] text-[#13243c] font-semibold hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
          >
            {savingDraft && <Spinner />}
            {t('vehicleDossier.saveDraft')}
          </button>
        </div>
        <button
          type="submit"
          disabled={!isValid}
          className="h-12 px-8 bg-[#13243c] hover:bg-slate-800 text-white font-bold rounded-[9px] uppercase tracking-[0.03em] transition disabled:opacity-50"
        >
          {t('vehicleDossier.continue')}
        </button>
      </div>
    </form>
  );
}
