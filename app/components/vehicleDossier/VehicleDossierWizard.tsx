'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../api';
import { localizedPath, useLanguage } from '../../i18n';
import Alert from '../Alert';
import Spinner from '../Spinner';
import StepVehicleInfo from './StepVehicleInfo';
import StepMedia from './StepMedia';
import StepPricing from './StepPricing';
import StepSummary from './StepSummary';
import type { VehicleDossier, VehicleDossierPayload } from '../../lib/vehicleDossier';
import type { WizardDocument, WizardPhoto } from './types';
import { useUser } from '../LayoutWrapper';
import ConfirmModal from '../ConfirmModal';

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

const STEP_LABELS = ['Informations', 'Photos & documents', 'Mise en vente', 'Récapitulatif'];

const fingerprintForm = (
  values: VehicleDossierPayload,
  photos: WizardPhoto[],
  expertReport: WizardDocument | null,
  additionalDocuments: WizardDocument[],
) => {
  const normalized = {
    values: Object.fromEntries(
      Object.entries(values).filter(([key]) => !['session', 'submit', 'confirmSessionDetach'].includes(key)),
    ),
    // L'ordre du tableau fait partie de l'empreinte : déplacer une photo est une modification.
    photos: photos.map(({ originalUrl, processedUrl, blurZones, isCover }) => ({
      originalUrl, processedUrl: processedUrl || '', blurZones, isCover,
    })),
    expertReport: expertReport ? {
      originalUrl: expertReport.originalUrl,
      processedUrl: expertReport.processedUrl || '',
      mimeType: expertReport.mimeType,
      blurZones: expertReport.blurZones,
      label: expertReport.label,
    } : null,
    additionalDocuments: additionalDocuments.map(({ type, originalUrl, processedUrl, mimeType, blurZones, label }) => ({
      type, originalUrl, processedUrl: processedUrl || '', mimeType, blurZones, label,
    })),
  };

  const serialized = JSON.stringify(normalized);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export default function VehicleDossierWizard({ initialDossier }: VehicleDossierWizardProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { user } = useUser();
  const sellerAddress = user?.address
    ? [user.address.street, `${user.address.postalCode || ''} ${user.address.city || ''}`.trim(), user.address.country].filter(Boolean).join(', ')
    : '';
  const sellerAddressDetails = {
    street: user?.address?.street || '',
    postalCode: user?.address?.postalCode || '',
    city: user?.address?.city || '',
    country: user?.address?.country || 'France',
  };

  const [dossierId, setDossierId] = useState<string | undefined>(initialDossier?._id);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [values, setValues] = useState<VehicleDossierPayload>({
    brand: initialDossier?.brand || '',
    model: initialDossier?.model || '',
    year: initialDossier?.year,
    mileage: initialDossier?.mileage,
    engine: initialDossier?.engine || '2.0 dCi 125',
    fuelType: initialDossier?.fuelType || 'diesel',
    vin: initialDossier?.vin || '',
    registrationNumber: initialDossier?.registrationNumber || '',
    registrationCountry: initialDossier?.registrationCountry || 'FR',
    firstRegistrationDate: initialDossier?.firstRegistrationDate || '',
    co2: initialDossier?.co2 || '',
    energyLabel: initialDossier?.energyLabel || '',
    vehicleGenre: initialDossier?.vehicleGenre || '',
    fiscalPower: initialDossier?.fiscalPower || '',
    bodyType: initialDossier?.bodyType || '',
    gearbox: initialDossier?.gearbox || '',
    passengerCount: initialDossier?.passengerCount || '',
    doorCount: initialDossier?.doorCount || '',
    color: initialDossier?.color || '',
    vrade: initialDossier?.vrade || '',
    procedure: initialDossier?.procedure,
    vehicleAddress: initialDossier?.vehicleAddress || sellerAddress,
    vehicleAddressDetails: initialDossier?.vehicleAddressDetails || sellerAddressDetails,
    registrationCardAvailable: initialDossier?.registrationCardAvailable ?? true,
    registrationCardMissingReasons: initialDossier?.registrationCardMissingReasons || [],
    identificationSheetAvailable: initialDossier?.identificationSheetAvailable ?? false,
    policeBookNumber: initialDossier?.policeBookNumber || '',
    description: initialDossier?.description || '',
    reservePrice: initialDossier?.reservePrice,
    session: initialDossier?.session,
  });

  const [photos, setPhotos] = useState<WizardPhoto[]>((initialDossier?.photos || []).map(toWizardPhoto));
  const [expertReport, setExpertReport] = useState<WizardDocument | null>(
    initialDossier?.expertReport ? toWizardDocument(initialDossier.expertReport) : null
  );
  const [additionalDocuments, setAdditionalDocuments] = useState<WizardDocument[]>(
    (initialDossier?.additionalDocuments || []).map(toWizardDocument)
  );
  const currentFingerprint = useMemo(
    () => fingerprintForm(values, photos, expertReport, additionalDocuments),
    [values, photos, expertReport, additionalDocuments],
  );
  const [savedFingerprint, setSavedFingerprint] = useState(() =>
    fingerprintForm(values, photos, expertReport, additionalDocuments)
  );
  const hasChanges = currentFingerprint !== savedFingerprint;

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sessionConfirmationOpen, setSessionConfirmationOpen] = useState(false);
  const [pendingSessionAction, setPendingSessionAction] = useState<'save' | 'submit' | null>(null);
  const [attachedToSession, setAttachedToSession] = useState(Boolean(initialDossier?.session));
  const [returnToForSale, setReturnToForSale] = useState(initialDossier?.status === 'valide');
  const [validationError, setValidationError] = useState('');

  const patchValues = (patch: Partial<VehicleDossierPayload>) => setValues((prev) => ({ ...prev, ...patch }));

  const buildPayload = (submit: boolean): VehicleDossierPayload => ({
    ...values,
    photos: photos.filter(Boolean).map((p, index) => ({
      originalUrl: p.originalUrl,
      processedUrl: p.processedUrl,
      blurZones: p.blurZones,
      isCover: index === 0,
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

  const persist = async (submit: boolean, confirmSessionDetach = false) => {
    const payload = { ...buildPayload(submit), confirmSessionDetach };
    if (dossierId) {
      const res = await apiRequest(`/vehicle-dossiers/${dossierId}`, { method: 'PUT', body: JSON.stringify(payload) });
      return res.dossier as VehicleDossier;
    }
    const res = await apiRequest('/vehicle-dossiers', { method: 'POST', body: JSON.stringify(payload) });
    return res.dossier as VehicleDossier;
  };

  const handleSaveDraft = async (confirmed = false) => {
    if (initialDossier && !hasChanges) return;
    if (attachedToSession && !confirmed) {
      setPendingSessionAction('save');
      setSessionConfirmationOpen(true);
      return;
    }
    setSavingDraft(true);
    setError('');
    setMessage('');
    try {
      const dossier = await persist(false, confirmed);
      setDossierId(dossier._id);
      setAttachedToSession(false);
      setReturnToForSale(false);
      setSavedFingerprint(currentFingerprint);
      setMessage(initialDossier ? 'Modifications enregistrées. Le dossier est en attente de validation.' : (t('vehicleDossier.draftSaved') || 'Brouillon enregistré avec succès.'));
    } catch (err: any) {
      setError(err.message || t('vehicleDossier.genericError'));
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitFinal = async (confirmed = false) => {
    if (attachedToSession && !confirmed) {
      setPendingSessionAction('submit');
      setSessionConfirmationOpen(true);
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await persist(true, confirmed);
      setAttachedToSession(false);
      setMessage(t('vehicleDossier.submitSuccess') || 'Dossier soumis pour validation avec succès.');
      setTimeout(() => {
        router.push(localizedPath('/vendeur/dossiers', language));
      }, 1200);
    } catch (err: any) {
      setError(err.message || (err.code === 'vehicleDossier.incomplete' ? t('vehicleDossier.incompleteError') : t('vehicleDossier.genericError')));
    } finally {
      setSubmitting(false);
    }
  };

  const canDelete = Boolean(initialDossier && ['brouillon', 'soumis', 'en_attente_validation', 'correction_demandee', 'refuse', 'valide'].includes(initialDossier.status));
  const handleDelete = async () => {
    if (!initialDossier) return;
    setDeleting(true);
    setError('');
    try {
      await apiRequest(`/vehicle-dossiers/${initialDossier._id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmSessionDetach: attachedToSession }),
      });
      router.push(localizedPath('/vendeur/dossiers', language));
    } catch (err: any) {
      setError(err.message || t('vehicleDossier.deleteError'));
      setDeleteConfirmationOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const currentStepIndex = step - 1;
  const backPath = returnToForSale ? '/vendeur/en-vente' : '/vendeur/dossiers';
  const backSectionLabel = returnToForSale ? 'Mes véhicules en vente' : 'Mes dossiers';

  // Compute category / vehicle subtitle
  const subtitle = step === 1 && !initialDossier
    ? 'MES DOSSIERS'
    : [values.brand, values.model].filter(Boolean).join(' ') + (values.registrationNumber ? ` · ${values.registrationNumber}` : values.vin ? ` · ${values.vin}` : '');

  // Compute H1 title
  const pageTitle = (() => {
    if (step === 1) return initialDossier ? 'Modifier le dossier véhicule' : 'Nouveau dossier véhicule';
    if (step === 2) return 'Photos & documents';
    if (step === 3) return 'Mise en vente';
    return 'Récapitulatif du dossier';
  })();

  const validateStepForm = (formId: string, onValid: () => void) => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) {
      onValid();
      return;
    }

    form.dataset.validationAttempted = 'true';
    const firstInvalid = form.querySelector<HTMLElement>(':invalid');
    if (!firstInvalid) {
      setValidationError('');
      onValid();
      return;
    }

    const fieldLabel = firstInvalid.getAttribute('aria-label')
      || firstInvalid.closest('label')?.querySelector('span')?.textContent?.replace('*', '').trim()
      || 'Ce champ';
    const control = firstInvalid as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    setValidationError(control.validity.valueMissing
      ? `Le champ « ${fieldLabel} » est obligatoire.`
      : `La valeur du champ « ${fieldLabel} » n'est pas valide.`);
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => firstInvalid.focus({ preventScroll: true }), 250);
    firstInvalid.addEventListener('input', () => setValidationError(''), { once: true });
  };

  const handleNextClick = () => {
    if (step === 1) {
      validateStepForm('step-vehicle-info-form', () => setStep(2));
    } else if (step === 2) {
      setValidationError('');
      setStep(3);
    } else if (step === 3) {
      validateStepForm('step-pricing-form', () => setStep(4));
    } else if (step === 4) {
      handleSubmitFinal();
    }
  };

  return (
    <div className="w-full min-h-full flex flex-col font-sans text-black bg-white relative">
      <style>{`
        form[data-validation-attempted="true"] input:invalid,
        form[data-validation-attempted="true"] select:invalid,
        form[data-validation-attempted="true"] textarea:invalid {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.14) !important;
        }
      `}</style>
      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-[32px_44px_100px]">
        {/* Header Title Section with Back Link */}
        <div className="mb-[22px]">
          <Link
            href={localizedPath(backPath, language)}
            className="btn-back mb-3"
          >
            <span className="text-[14px]">←</span>
            <span className="uppercase">{step === 1 || !subtitle || subtitle === 'MES DOSSIERS' ? backSectionLabel : `${backSectionLabel} · ${subtitle}`}</span>
          </Link>
          <h1 className="m-0 font-bold text-[34px] leading-none uppercase text-[#13243c] font-['Saira_Condensed',sans-serif]">
            {pageTitle}
          </h1>
        </div>

        {/* Stepper Bar */}
        <div className="flex items-center gap-0 mb-[30px] overflow-x-auto pb-2 sm:pb-0">
          {STEP_LABELS.map((label, i) => {
            const done = i < currentStepIndex;
            const active = i === currentStepIndex;
            const isLast = i === STEP_LABELS.length - 1;

            const circleBg = done ? '#2f6f4f' : active ? '#d9704f' : '#fff';
            const circleColor = (done || active) ? '#fff' : '#9a917d';
            const circleBorder = done ? '#2f6f4f' : active ? '#d9704f' : '#dcd7cb';
            const textColor = active ? '#13243c' : '#5a5e66';
            const connectorColor = done ? '#2f6f4f' : '#dcd7cb';

            return (
              <div key={i} className="flex items-center" style={{ flex: isLast ? 0 : 1 }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-[13px] leading-none shrink-0 transition-colors"
                    style={{ background: circleBg, color: circleColor, border: `2px solid ${circleBorder}` }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <div
                    className="font-semibold text-[13px] leading-none whitespace-nowrap transition-colors"
                    style={{ color: textColor }}
                  >
                    {label}
                  </div>
                </div>
                {!isLast && (
                  <div
                    className="h-[2px] flex-1 mx-2 sm:mx-3 min-w-[16px] sm:min-w-[24px] transition-colors"
                    style={{ background: connectorColor }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Alerts */}
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        {message && <Alert variant="success" className="mb-6">{message}</Alert>}

        {/* Correction Request Banner */}
        {initialDossier?.status === 'correction_demandee' && (
          <div className="mb-7 border border-[#f0c9bd] bg-[#fdece4] rounded-[12px] p-5">
            <div className="font-bold text-[13px] uppercase tracking-wide text-[#d9704f] mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#d9704f] text-white flex items-center justify-center text-[10px] font-bold">!</span>
              Correction demandée par l'administrateur
            </div>
            {initialDossier.refusals && initialDossier.refusals.length > 0 && (
              <>
                <ul className="list-disc pl-5 text-[13px] text-[#1a2230] space-y-1 mb-2 font-medium">
                  {initialDossier.refusals[initialDossier.refusals.length - 1].motifsLabels.map((motif, i) => (
                    <li key={i}>{motif}</li>
                  ))}
                </ul>
                {initialDossier.refusals[initialDossier.refusals.length - 1].comment && (
                  <p className="text-[12px] italic text-[#5a5e66] mt-1">
                    &quot;{initialDossier.refusals[initialDossier.refusals.length - 1].comment}&quot;
                  </p>
                )}
              </>
            )}
            <p className="text-[12px] text-[#d9704f] mt-3 font-semibold">
              Veuillez corriger les éléments indiqués ci-dessus puis cliquez sur « Soumettre pour validation ».
            </p>
          </div>
        )}

        {/* Step Views */}
        {step === 1 && (
          <StepVehicleInfo
            values={values}
            onChange={patchValues}
            isEditing={Boolean(initialDossier)}
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

      {validationError && (
        <div role="alert" className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] font-bold text-red-700 shadow-lg">
          {validationError}
        </div>
      )}

      {/* Fixed Sticky Action Bar at Bottom */}
      <div className="sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-[#efece3] px-6 sm:px-[44px] py-5 flex justify-between items-center shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
        <div className="flex gap-3 items-center">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="h-[48px] px-[26px] rounded-[9px] border border-[#dcd7cb] text-[#13243c] font-semibold text-[14px] leading-[48px] hover:bg-gray-50 transition"
            >
              Retour
            </button>
          ) : null}

          {canDelete && (
            <button type="button" onClick={() => setDeleteConfirmationOpen(true)} disabled={savingDraft || submitting || deleting} className="h-[48px] rounded-[9px] border border-red-200 px-4 text-[12px] font-bold uppercase text-[#b3261e] hover:bg-red-50 disabled:opacity-50">
              {t('vehicleDossier.deleteDraft')}
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleSaveDraft()}
            disabled={savingDraft || submitting || Boolean(initialDossier && !hasChanges)}
            className="btn btn-secondary leading-[48px] disabled:opacity-50 gap-2"
          >
            {savingDraft && <Spinner />}
            {initialDossier ? 'Enregistrer les modifications' : 'Enregistrer le brouillon'}
          </button>
        </div>

        <div>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextClick}
              className="btn btn-primary leading-[48px]"
            >
              Continuer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmitFinal()}
              disabled={submitting || savingDraft}
              className="btn btn-primary leading-[48px] disabled:opacity-50 gap-2"
            >
              {submitting && <Spinner />}
              Soumettre pour validation
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirmationOpen}
        title={t('vehicleDossier.deleteDraft')}
        message={attachedToSession
          ? 'Ce véhicule est rattaché à une session. Si vous confirmez, il sera retiré de la session puis supprimé définitivement.'
          : t('vehicleDossier.deleteConfirm')}
        confirmLabel={t('vehicleDossier.deleteDraft')}
        danger
        loading={deleting}
        onCancel={() => setDeleteConfirmationOpen(false)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={sessionConfirmationOpen}
        title="Retirer le véhicule de la session ?"
        message="Ce véhicule est rattaché à une session. Si vous confirmez la modification, il sera retiré de la session et son dossier repassera en attente de validation."
        confirmLabel="Modifier et retirer"
        loading={savingDraft || submitting}
        onCancel={() => { setSessionConfirmationOpen(false); setPendingSessionAction(null); }}
        onConfirm={() => {
          const action = pendingSessionAction;
          setSessionConfirmationOpen(false);
          setPendingSessionAction(null);
          if (action === 'save') void handleSaveDraft(true);
          if (action === 'submit') void handleSubmitFinal(true);
        }}
      />
    </div>
  );
}
