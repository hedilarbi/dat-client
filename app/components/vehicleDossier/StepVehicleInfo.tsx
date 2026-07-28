'use client';

import React from 'react';
import type { VehicleDossierPayload } from '../../lib/vehicleDossier';

interface StepVehicleInfoProps {
  values: VehicleDossierPayload;
  onChange: (patch: Partial<VehicleDossierPayload>) => void;
  onNext: () => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
}

export default function StepVehicleInfo({
  values,
  onChange,
  onNext,
}: StepVehicleInfoProps) {
  const dossierTypes = ['Sinistré', 'VHU', 'Flotte', 'Occasion'] as const;
  const dossierStates = ['Roulant', 'Non roulant', 'Pour pièces'] as const;

  const currentType = values.dossierType || 'Sinistré';
  const currentState = values.vehicleCondition || 'Roulant';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form id="step-vehicle-info-form" onSubmit={handleSubmit} className="max-w-[800px] w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[7px]">
            Marque
          </label>
          <input
            required
            type="text"
            value={values.brand || ''}
            onChange={(e) => onChange({ brand: e.target.value })}
            placeholder="ex. Renault"
            className="w-full h-[48px] border border-[#dcd7cb] rounded-[9px] px-4 font-medium text-[14px] text-[#1a2230] focus:outline-none focus:border-[#13243c] bg-white transition"
          />
        </div>

        <div>
          <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[7px]">
            Modèle
          </label>
          <input
            required
            type="text"
            value={values.model || ''}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder="ex. Trafic III"
            className="w-full h-[48px] border border-[#dcd7cb] rounded-[9px] px-4 font-medium text-[14px] text-[#1a2230] focus:outline-none focus:border-[#13243c] bg-white transition"
          />
        </div>

        <div>
          <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[7px]">
            Année
          </label>
          <input
            required
            type="number"
            value={values.year ?? ''}
            onChange={(e) => onChange({ year: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="ex. 2016"
            className="w-full h-[48px] border border-[#dcd7cb] rounded-[9px] px-4 font-medium text-[14px] text-[#1a2230] focus:outline-none focus:border-[#13243c] bg-white transition"
          />
        </div>

        <div>
          <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[7px]">
            Kilométrage
          </label>
          <input
            required
            type="number"
            value={values.mileage ?? ''}
            onChange={(e) => onChange({ mileage: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="ex. 142000"
            className="w-full h-[48px] border border-[#dcd7cb] rounded-[9px] px-4 font-medium text-[14px] text-[#1a2230] focus:outline-none focus:border-[#13243c] bg-white transition"
          />
        </div>

        <div>
          <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[7px]">
            Immatriculation
          </label>
          <input
            type="text"
            value={values.registrationNumber || ''}
            onChange={(e) => onChange({ registrationNumber: e.target.value.toUpperCase() })}
            placeholder="ex. EX-482-TR"
            className="w-full h-[48px] border border-[#dcd7cb] rounded-[9px] px-4 font-mono font-medium text-[14px] text-[#1a2230] uppercase focus:outline-none focus:border-[#13243c] bg-white transition"
          />
        </div>

        <div>
          <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[7px]">
            N° de série (VIN)
          </label>
          <input
            required
            type="text"
            value={values.vin || ''}
            onChange={(e) => onChange({ vin: e.target.value.toUpperCase() })}
            placeholder="ex. VF1FL000H58..."
            className="w-full h-[48px] border border-[#dcd7cb] rounded-[9px] px-4 font-mono font-medium text-[14px] text-[#1a2230] uppercase focus:outline-none focus:border-[#13243c] bg-white transition"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[10px]">
          Type de dossier
        </label>
        <div className="flex gap-2.5 flex-wrap">
          {dossierTypes.map((t) => {
            const isActive = currentType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ dossierType: t })}
                className={`px-[18px] py-[10px] rounded-full border-[1.5px] text-[13px] transition-all ${
                  isActive
                    ? 'bg-[#fdece4] border-[#d9704f] text-[#d9704f] font-bold'
                    : 'bg-white border-[#dcd7cb] text-[#5a5e66] font-semibold hover:border-[#8a8270]'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-2">
        <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-[10px]">
          État général
        </label>
        <div className="flex gap-2.5 flex-wrap">
          {dossierStates.map((s) => {
            const isActive = currentState === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ vehicleCondition: s })}
                className={`px-[18px] py-[10px] rounded-full border-[1.5px] text-[13px] transition-all ${
                  isActive
                    ? 'bg-[#eef1f5] border-[#13243c] text-[#13243c] font-bold'
                    : 'bg-white border-[#dcd7cb] text-[#5a5e66] font-semibold hover:border-[#8a8270]'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}
