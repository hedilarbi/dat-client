'use client';

import React from 'react';
import type { VehicleDossierPayload } from '../../lib/vehicleDossier';

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form id="step-pricing-form" onSubmit={handleSubmit} className="max-w-[760px] w-full">
      {/* Prix de réserve */}
      <div className="mb-6.5">
        <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[7px]">
          Prix de réserve
        </label>
        <div className="relative max-w-[280px]">
          <input
            required
            type="number"
            min={0}
            value={values.reservePrice ?? ''}
            onChange={(e) => onChange({ reservePrice: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="ex. 7 500"
            className="w-full h-[52px] border border-[#dcd7cb] rounded-[9px] px-4 font-mono font-semibold text-[16px] text-[#1a2230] focus:outline-none focus:border-[#13243c] bg-white transition pr-10"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-semibold text-[16px] text-[#8a8270]">
            €
          </span>
        </div>
        <div className="font-normal text-[12px] leading-relaxed text-[#9a917d] mt-1.5">
          Le véhicule ne sera pas adjugé en dessous de ce montant
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[7px]">
          Description
        </label>
        <textarea
          rows={4}
          value={values.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Fourgon accidenté à l'avant droit, moteur non testé, intérieur complet. Vendu pour pièces ou remise en état."
          className="w-full min-h-[120px] border border-[#dcd7cb] rounded-[9px] p-4 font-normal text-[13px] leading-relaxed text-[#1a2230] focus:outline-none focus:border-[#13243c] bg-white transition resize-y"
        />
      </div>
    </form>
  );
}
