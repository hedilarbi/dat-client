'use client';

import React from 'react';
import type { VehicleDossierPayload } from '../../lib/vehicleDossier';
import type { WizardDocument, WizardPhoto } from './types';
import { useLanguage } from '../../i18n';
import { gearboxLabel } from '../../lib/vehicleLabels';

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

const PHOTO_LABEL_KEYS = ['dossierPhoto.front', 'dossierPhoto.rear', 'dossierPhoto.left', 'dossierPhoto.right', 'dossierPhoto.odometer', 'dossierPhoto.interior'];

function SummaryField({ label, value }: { label: string; value?: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-[9px] bg-[#f8f7f2] p-3.5">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#4c5058]">{label}</div>
      <div className="text-[13px] font-semibold leading-relaxed text-[#13243c]">{value || t('common.notProvided')}</div>
    </div>
  );
}

function FormattedDescription({ value }: { value?: string }) {
  const { t } = useLanguage();
  if (!value) return <>{t('dossierSummary.descriptionNotProvided')}</>;
  return <>{value.split(/(\*\*.*?\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : <React.Fragment key={index}>{part}</React.Fragment>)}</>;
}

export default function StepSummary({
  values,
  photos,
  additionalDocuments,
  expertReport,
}: StepSummaryProps) {
  const { language, t } = useLanguage();
  const locale = language === 'en' ? 'en-GB' : 'fr-FR';
  const photoLabel = (index: number) => PHOTO_LABEL_KEYS[index] ? t(PHOTO_LABEL_KEYS[index]) : t('dossierPhoto.extra', { n: String(index - PHOTO_LABEL_KEYS.length + 1) });
  const address = values.vehicleAddressDetails;
  const formattedAddress = address
    ? [address.street, `${address.postalCode} ${address.city}`.trim(), address.country].filter(Boolean).join(', ')
    : values.vehicleAddress;
  const missingReasons = (values.registrationCardMissingReasons || [])
    .map((reason) => t(`dossierMissing.${reason}`))
    .join(', ');
  const reservePrice = values.reservePrice != null
    ? `${values.reservePrice.toLocaleString(locale)} €`
    : t('dossierSummary.notDefined');

  return (
    <div className="max-w-[900px] w-full space-y-6">
      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d9704f]">{t('dossierSummary.step', { n: '1' })}</div>
          <h2 className="text-[17px] font-bold uppercase text-[#13243c]">{t('dossierSummary.step1Title')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <SummaryField label={t('dossierSummary.registration')} value={values.registrationNumber} />
          <SummaryField label={t('dossierSummary.brand')} value={values.brand} />
          <SummaryField label={t('dossierSummary.model')} value={values.model} />
          <SummaryField label={t('dossierSummary.firstCirculation')} value={values.firstRegistrationDate} />
          <SummaryField label={t('dossierSummary.energy')} value={values.energyLabel} />
          <SummaryField label={t('dossierSummary.gearbox')} value={['M', 'A', 'S'].includes(values.gearbox || '') ? `${values.gearbox} — ${gearboxLabel(values.gearbox, language)}` : values.gearbox} />
          <SummaryField label={t('dossierSummary.vin')} value={values.vin} />
          <SummaryField label={t('dossierSummary.mileage')} value={values.mileage != null ? `${values.mileage.toLocaleString(locale)} km` : undefined} />
          <SummaryField label={t('vehicle.field.vrade')} value={values.vrade} />
          <SummaryField label={t('dossierSummary.procedure')} value={values.procedure} />
          <SummaryField label={t('dossierSummary.country')} value={values.registrationCountry} />
          <SummaryField label={t('vehicle.field.co2')} value={values.co2 ? `${values.co2} g/km` : undefined} />
          <SummaryField label={t('dossierSummary.genre')} value={values.vehicleGenre} />
          <SummaryField label={t('dossierSummary.fiscalPower')} value={values.fiscalPower} />
          <SummaryField label={t('dossierSummary.bodyType')} value={values.bodyType} />
          <SummaryField label={t('dossierSummary.passengers')} value={values.passengerCount} />
          <SummaryField label={t('dossierSummary.doors')} value={values.doorCount} />
          <SummaryField label={t('dossierSummary.color')} value={values.color} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryField label={t('dossierSummary.location')} value={formattedAddress} />
          <SummaryField label={t('dossierSummary.registrationCardAvailable')} value={values.registrationCardAvailable === false ? t('common.no') : t('common.yes')} />
          {values.registrationCardAvailable === false && <SummaryField label={t('dossierSummary.missingReason')} value={missingReasons} />}
          {values.registrationCardAvailable === false && <SummaryField label={t('dossierSummary.identificationSheet')} value={values.identificationSheetAvailable ? t('common.yes') : t('common.no')} />}
          {values.registrationCardAvailable === true && <SummaryField label={t('dossierSummary.policeBook')} value={values.policeBookNumber} />}
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4c5058]">{t('dossierSummary.damageDescription')}</div>
          <div className="whitespace-pre-wrap rounded-[9px] bg-[#f8f7f2] p-4 text-[13px] leading-relaxed text-[#13243c]">
            <FormattedDescription value={values.description} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d9704f]">{t('dossierSummary.step', { n: '2' })}</div>
          <h2 className="text-[17px] font-bold uppercase text-[#13243c]">{t('dossierSummary.step2Title')}</h2>
          <p className="mt-1 text-[12px] text-[#5a5e66]">{t('dossierSummary.photosAdded', { count: String(photos.length) })}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.localId}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[9px] bg-[#eef1f5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.processedUrl || photo.originalUrl} alt={photoLabel(index)} className="h-full w-full object-cover" />
                {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-[#2f6f4f] px-2 py-1 text-[9px] font-bold uppercase text-white">{t('dossierSummary.cover')}</span>}
                {photo.blurZones.length > 0 && <span className="absolute bottom-2 right-2 rounded-full bg-[#13243c] px-2 py-1 text-[9px] font-bold text-white">{t('dossierSummary.blurs', { count: String(photo.blurZones.length) })}</span>}
              </div>
              <div className="mt-1.5 text-center text-[11px] font-medium text-[#5a5e66]">{photoLabel(index)}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryField label={t('dossierSummary.expertReport')} value={expertReport ? <a href={expertReport.processedUrl || expertReport.originalUrl} target="_blank" rel="noreferrer" className="text-[#d9704f] underline">{t('dossierSummary.documentAdded')}{expertReport.blurZones.length ? ` — ${t('dossierSummary.blurs', { count: String(expertReport.blurZones.length) })}` : ''}</a> : t('dossierSummary.expertNotAdded')} />
          <SummaryField label={t('dossierSummary.extraDocs')} value={additionalDocuments.length ? t('dossierSummary.documentsCount', { count: String(additionalDocuments.length) }) : t('dossierSummary.none')} />
        </div>
        {additionalDocuments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {additionalDocuments.map((document, index) => <a key={document.localId} href={document.processedUrl || document.originalUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#dcd7cb] px-3 py-1.5 text-[11px] font-semibold text-[#13243c] hover:bg-[#f8f7f2]">{document.label === 'Carte grise (recto)' ? t('dossierMedia.registrationRecto') : document.label === 'Carte grise (verso)' ? t('dossierMedia.registrationVerso') : document.label || t('dossierSummary.documentN', { n: String(index + 1) })}</a>)}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d9704f]">{t('dossierSummary.step', { n: '3' })}</div>
          <h2 className="text-[17px] font-bold uppercase text-[#13243c]">{t('dossierSummary.step3Title')}</h2>
        </div>
        <SummaryField label={t('dossierSummary.reservePrice')} value={reservePrice} />
      </section>

      <div className="bg-[#faf1e4] rounded-[11px] p-4.5 sm:p-[18px_20px] flex items-center gap-3.5">
        <div className="w-[34px] h-[34px] rounded-full bg-white shrink-0 flex items-center justify-center font-bold text-[15px] text-[#b3893f]">
          i
        </div>
        <div className="font-medium text-[13px] leading-relaxed text-[#8a6a2f]">
          {t('dossierSummary.reviewNotice')}
        </div>
      </div>
    </div>
  );
}
