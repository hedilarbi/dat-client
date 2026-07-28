'use client';

import React from 'react';
import type { VehicleDossierPayload } from '../../lib/vehicleDossier';
import type { WizardDocument, WizardPhoto } from './types';

interface StepSummaryProps {
  values: VehicleDossierPayload;
  photos: WizardPhoto[];
  additionalDocuments: WizardDocument[];
  expertReport: WizardDocument | null;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  savingDraft: boolean;
  submitting: boolean;
}

const RECAP_LABELS = [
  { key: 'AV', label: 'Avant' },
  { key: 'AR', label: 'Arrière' },
  { key: 'PR', label: 'Profil' },
  { key: 'IN', label: 'Intérieur' },
  { key: 'CP', label: 'Compteur' },
  { key: 'DM', label: 'Dommages' },
];

export default function StepSummary({
  values,
  photos,
}: StepSummaryProps) {
  const dossierType = values.dossierType || 'Sinistré';
  const vehicleCondition = values.vehicleCondition || 'Roulant';
  const reservePriceStr = values.reservePrice ? `${values.reservePrice.toLocaleString('fr-FR')} €` : 'Non défini';

  const recapFields = [
    { label: 'Type de dossier', value: dossierType },
    { label: 'État général', value: vehicleCondition },
    { label: 'Prix de réserve', value: reservePriceStr },
  ];

  return (
    <div className="max-w-[900px] w-full">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6.5">
        {recapFields.map((f, i) => (
          <div key={i} className="bg-[#f8f7f2] rounded-[11px] p-4 sm:p-[16px_18px]">
            <div className="font-semibold text-[11px] uppercase tracking-[0.05em] text-[#8a8270] mb-2">
              {f.label}
            </div>
            <div className="font-bold text-[15px] leading-snug text-[#13243c]">
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* Photos Grid */}
      <div className="mb-7">
        <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#8a8270] mb-3">
          Photos
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {RECAP_LABELS.map((item, idx) => {
            const photo = photos[idx];
            const hasPhoto = Boolean(photo && (photo.processedUrl || photo.originalUrl));

            return (
              <div key={item.key}>
                <div className="aspect-[4/3] rounded-[9px] bg-[#eef1f5] flex items-center justify-center font-bold text-[12px] text-[#8ea0bd] overflow-hidden">
                  {hasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.processedUrl || photo.originalUrl}
                      alt={item.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    item.key
                  )}
                </div>
                <div className="font-medium text-[11px] leading-tight text-[#5a5e66] mt-1.5 text-center">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-[#faf1e4] rounded-[11px] p-4.5 sm:p-[18px_20px] flex items-center gap-3.5 mb-2">
        <div className="w-[34px] h-[34px] rounded-full bg-white shrink-0 flex items-center justify-center font-bold text-[15px] text-[#b3893f]">
          i
        </div>
        <div className="font-medium text-[13px] leading-relaxed text-[#8a6a2f]">
          Ce dossier sera vérifié par notre équipe avant sa mise en session. Vous serez notifié par e-mail dès sa validation.
        </div>
      </div>
    </div>
  );
}
