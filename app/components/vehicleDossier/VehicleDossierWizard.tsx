'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../api';
import { localizedPath, useLanguage } from '../../i18n';
import Alert from '../Alert';
import StepVehicleInfo from './StepVehicleInfo';
import StepMedia from './StepMedia';
import StepPricing from './StepPricing';
import StepSummary from './StepSummary';
import type { VehicleDossier, VehicleDossierPayload } from '../../lib/vehicleDossier';
import type { WizardDocument, WizardPhoto } from './types';

const toWizardPhoto = (p: VehicleDossier['photos'][number]): WizardPhoto => ({
  localId: p._id || `local_${Math.random().toString(36).slice(2, 8)}`,
  originalUrl: p.originalUrl,
  processedUrl: p.processedUrl,
  blurZones: p.blurZones || [],
  isCover: p.isCover,
  uploading: false,
});

const toWizardDocument = (d: NonNullable<VehicleDossier['expertReport']>): WizardDocument => ({
  localId: d._id || `local_${Math.random().toString(36).slice(2, 8)}`,
  type: d.type,
  originalUrl: d.originalUrl,
  processedUrl: d.processedUrl,
  mimeType: d.mimeType || '',
  blurZones: d.blurZones || [],
  label: d.label || d.originalUrl.split('/').pop() || 'document',
  uploading: false,
});

interface VehicleDossierWizardProps {
  initialDossier?: VehicleDossier;
}

export default function VehicleDossierWizard({ initialDossier }: VehicleDossierWizardProps) {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [dossierId, setDossierId] = useState<string | undefined>(initialDossier?._id);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [values, setValues] = useState<VehicleDossierPayload>({
    brand: initialDossier?.brand || '',
    model: initialDossier?.model || '',
    year: initialDossier?.year,
    mileage: initialDossier?.mileage,
    engine: initialDossier?.engine || '',
    fuelType: initialDossier?.fuelType,
    vin: initialDossier?.vin || '',
    description: initialDossier?.description || '',
    vehicleCondition: initialDossier?.vehicleCondition || '',
    reservePrice: initialDossier?.reservePrice,
    conditionDetails: initialDossier?.conditionDetails || '',
  });
  const [photos, setPhotos] = useState<WizardPhoto[]>((initialDossier?.photos || []).map(toWizardPhoto));
  const [expertReport, setExpertReport] = useState<WizardDocument | null>(
    initialDossier?.expertReport ? toWizardDocument(initialDossier.expertReport) : null
  );
  const [additionalDocuments, setAdditionalDocuments] = useState<WizardDocument[]>(
    (initialDossier?.additionalDocuments || []).map(toWizardDocument)
  );

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const patchValues = (patch: Partial<VehicleDossierPayload>) => setValues((prev) => ({ ...prev, ...patch }));

  const buildPayload = (submit: boolean): VehicleDossierPayload => ({
    ...values,
    photos: photos.map((p, index) => ({
      originalUrl: p.originalUrl,
      processedUrl: p.processedUrl,
      blurZones: p.blurZones,
      isCover: p.isCover,
      order: index,
    })),
    expertReport: expertReport
      ? { type: 'rapport_expert', originalUrl: expertReport.originalUrl, processedUrl: expertReport.processedUrl, mimeType: expertReport.mimeType, blurZones: expertReport.blurZones, label: expertReport.label }
      : undefined,
    additionalDocuments: additionalDocuments.map((d) => ({
      type: 'complementaire', originalUrl: d.originalUrl, processedUrl: d.processedUrl, mimeType: d.mimeType, blurZones: d.blurZones, label: d.label,
    })),
    submit,
  });

  const persist = async (submit: boolean) => {
    const payload = buildPayload(submit);
    if (dossierId) {
      const res = await apiRequest(`/vehicle-dossiers/${dossierId}`, { method: 'PUT', body: JSON.stringify(payload) });
      return res.dossier as VehicleDossier;
    }
    const res = await apiRequest('/vehicle-dossiers', { method: 'POST', body: JSON.stringify(payload) });
    return res.dossier as VehicleDossier;
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setError('');
    setMessage('');
    try {
      const dossier = await persist(false);
      setDossierId(dossier._id);
      setMessage(t('vehicleDossier.draftSaved'));
    } catch (err: any) {
      setError(err.message || t('vehicleDossier.genericError'));
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitFinal = async () => {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await persist(true);
      setMessage(t('vehicleDossier.submitSuccess'));
      setTimeout(() => {
        router.push(localizedPath('/vendeur/dossiers', language));
      }, 1200);
    } catch (err: any) {
      setError(err.message || (err.code === 'vehicleDossier.incomplete' ? t('vehicleDossier.incompleteError') : t('vehicleDossier.genericError')));
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [t('vehicleDossier.stepInfo'), t('vehicleDossier.stepMedia'), t('vehicleDossier.stepPricing'), t('vehicleDossier.stepSummary')];
  const currentStepIndex = step - 1;

  return (
    <div className="max-w-[1000px] w-full mx-auto bg-white rounded-[10px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)] font-sans text-black flex flex-col border border-[#efece3]">
      <div className="px-6 sm:px-12 pt-6 sm:pt-[36px] pb-6 border-b border-[#efece3]">
        <h2 className="text-[26px] font-bold font-heading uppercase text-[#13243c] mb-6">
          {initialDossier ? t('vehicleDossier.pageTitleEdit') : t('vehicleDossier.pageTitleNew')}
        </h2>

        <div className="flex items-center gap-0 overflow-x-auto">
          {stepsList.map((label, i) => {
            const done = i < currentStepIndex;
            const active = i === currentStepIndex;
            const isLast = i === stepsList.length - 1;

            const circleBg = done ? '#2f6f4f' : active ? '#d9704f' : '#fff';
            const circleColor = (done || active) ? '#fff' : '#9a917d';
            const circleBorder = done ? '#2f6f4f' : active ? '#d9704f' : '#dcd7cb';
            const textColor = active ? '#13243c' : '#5a5e66';
            const connectorColor = done ? '#2f6f4f' : '#dcd7cb';

            return (
              <div key={i} className="flex items-center" style={{ flex: isLast ? 0 : 1 }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-[30px] h-[30px] shrink-0 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300"
                    style={{ background: circleBg, color: circleColor, border: `2px solid ${circleBorder}` }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="hidden sm:inline text-[13px] font-semibold whitespace-nowrap transition-colors duration-300" style={{ color: textColor }}>
                    {label}
                  </span>
                </div>
                {!isLast && <div className="h-[2px] flex-1 mx-4 min-w-[30px] transition-colors duration-300" style={{ background: connectorColor }} />}
              </div>
            );
          })}
        </div>
      </div>

      {error && <Alert variant="error" className="mx-6 sm:mx-12 mt-4">{error}</Alert>}
      {message && <Alert variant="success" className="mx-6 sm:mx-12 mt-4">{message}</Alert>}

      {step === 1 && (
        <StepVehicleInfo
          values={values}
          onChange={patchValues}
          onNext={() => setStep(2)}
          onSaveDraft={handleSaveDraft}
          savingDraft={savingDraft}
        />
      )}

      {step === 2 && (
        <StepMedia
          photos={photos}
          onPhotosChange={setPhotos}
          expertReport={expertReport}
          onExpertReportChange={setExpertReport}
          additionalDocuments={additionalDocuments}
          onAdditionalDocumentsChange={setAdditionalDocuments}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
          onSaveDraft={handleSaveDraft}
          savingDraft={savingDraft}
        />
      )}

      {step === 3 && (
        <StepPricing
          values={values}
          onChange={patchValues}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
          onSaveDraft={handleSaveDraft}
          savingDraft={savingDraft}
        />
      )}

      {step === 4 && (
        <StepSummary
          values={values}
          photos={photos}
          additionalDocuments={additionalDocuments}
          expertReport={expertReport}
          onBack={() => setStep(3)}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmitFinal}
          savingDraft={savingDraft}
          submitting={submitting}
        />
      )}
    </div>
  );
}
