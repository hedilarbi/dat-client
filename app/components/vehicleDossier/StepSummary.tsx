'use client';

import React from 'react';
import { useLanguage } from '../../i18n';
import Spinner from '../Spinner';
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[#f3f1ea] last:border-b-0">
      <span className="text-[12px] font-semibold text-[#8a8270]">{label}</span>
      <span className="text-[13px] text-[#13243c] text-right">{value}</span>
    </div>
  );
}

export default function StepSummary({
  values, photos, additionalDocuments, expertReport, onBack, onSaveDraft, onSubmit, savingDraft, submitting
}: StepSummaryProps) {
  const { t } = useLanguage();
  const notProvided = t('vehicleDossier.notProvided');

  return (
    <div className="p-6 sm:p-9 lg:p-[36px_48px_40px] space-y-6">
      <h3 className="text-[18px] font-bold font-heading uppercase text-[#13243c]">{t('vehicleDossier.summaryTitle')}</h3>

      <div className="bg-[#fbfaf7] border border-[#eceadf] rounded-[10px] p-5">
        <h4 className="text-[12px] font-bold text-[#8a8270] uppercase tracking-wider mb-2">{t('vehicleDossier.summaryVehicle')}</h4>
        <Row label={t('vehicleDossier.brand')} value={values.brand || notProvided} />
        <Row label={t('vehicleDossier.model')} value={values.model || notProvided} />
        <Row label={t('vehicleDossier.year')} value={values.year || notProvided} />
        <Row label={t('vehicleDossier.mileage')} value={values.mileage ? `${values.mileage} km` : notProvided} />
        <Row label={t('vehicleDossier.engine')} value={values.engine || notProvided} />
        <Row label={t('vehicleDossier.fuelType')} value={values.fuelType ? t(`vehicleDossier.fuel.${values.fuelType}`) : notProvided} />
        <Row label={t('vehicleDossier.vin')} value={values.vin || notProvided} />
        <Row label={t('vehicleDossier.condition')} value={values.vehicleCondition || notProvided} />
      </div>

      <div className="bg-[#fbfaf7] border border-[#eceadf] rounded-[10px] p-5">
        <h4 className="text-[12px] font-bold text-[#8a8270] uppercase tracking-wider mb-2">{t('vehicleDossier.summaryMedia')}</h4>
        <Row label={t('vehicleDossier.photosTitle')} value={t('vehicleDossier.photosCount', { count: photos.length })} />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 py-2 border-b border-[#f3f1ea]">
            {photos.map((photo) => (
              <div key={photo.localId} className="relative w-[84px] h-[63px] rounded-[7px] overflow-hidden bg-[#13243c] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.processedUrl || photo.originalUrl} alt="" className="w-full h-full object-cover" />
                {photo.isCover && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold uppercase tracking-wide bg-[#2f6f4f]/90 text-white py-[2px]">
                    {t('vehicleDossier.cover')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <Row label={t('vehicleDossier.expertReport')} value={expertReport ? '✓' : t('vehicleDossier.noExpertReport')} />
        <Row label={t('vehicleDossier.additionalDocuments')} value={t('vehicleDossier.documentsCount', { count: additionalDocuments.length })} />
      </div>

      <div className="bg-[#fbfaf7] border border-[#eceadf] rounded-[10px] p-5">
        <h4 className="text-[12px] font-bold text-[#8a8270] uppercase tracking-wider mb-2">{t('vehicleDossier.summaryPricing')}</h4>
        <Row label={t('vehicleDossier.reservePrice')} value={values.reservePrice ? `${values.reservePrice} €` : notProvided} />
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
            disabled={savingDraft || submitting}
            className="h-12 px-6 border border-[#dcd7cb] rounded-[9px] text-[#13243c] font-semibold hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
          >
            {savingDraft && <Spinner />}
            {t('vehicleDossier.saveDraft')}
          </button>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || savingDraft}
          className="h-12 px-8 bg-[#d9704f] hover:bg-[#c26040] text-white font-bold rounded-[9px] uppercase tracking-[0.03em] transition disabled:opacity-50 flex items-center gap-2"
        >
          {submitting && <Spinner />}
          {t('vehicleDossier.submitForValidation')}
        </button>
      </div>
    </div>
  );
}
