'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../api';
import { localizedPath, useLanguage } from '../../../i18n';
import Alert from '../../../components/Alert';
import { Badge, getVehicleDossierStatusBadge } from '../../../components/StatusBadge';
import VehicleDossierWizard from '../../../components/vehicleDossier/VehicleDossierWizard';
import type { VehicleDossier } from '../../../lib/vehicleDossier';
import Spinner from '../../../components/Spinner';

export default function DossierVehiculeDetailPage() {
  const params = useParams<{ id: string }>();
  const { language, t } = useLanguage();

  const [dossier, setDossier] = useState<VehicleDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiRequest(`/vehicle-dossiers/${params.id}`)
      .then((res) => { if (!cancelled) setDossier(res.dossier); })
      .catch(() => { if (!cancelled) setError(t('vehicleDossier.fetchError')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id, t]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-white">
        <Spinner className="h-10 w-10 text-[#13243c]" />
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="flex-1 w-full bg-white p-8">
        <Alert variant="error">{error || t('dossierDetail.notFound')}</Alert>
        <div className="mt-4">
          <Link href={localizedPath('/vendeur/dossiers', language)} className="text-xs font-bold text-[#d9704f] underline">
            {t('dossierDetail.backToList')}
          </Link>
        </div>
      </div>
    );
  }

  const isEditable = ['brouillon', 'soumis', 'en_attente_validation', 'correction_demandee', 'valide'].includes(dossier.status);
  const badge = getVehicleDossierStatusBadge(dossier.status, t);
  const vehicleLabel = [dossier.brand, dossier.model].filter(Boolean).join(' ') || t('dossierDetail.unnamed');
  const lastRefusal = dossier.refusals?.[dossier.refusals.length - 1];
  const backPath = dossier.status === 'valide' ? '/vendeur/en-vente' : '/vendeur/dossiers';
  const backLabel = dossier.status === 'valide' ? t('dossierWizard.backForSale') : t('dossierWizard.backDossiers');
  const locale = language === 'en' ? 'en-GB' : 'fr-FR';
  const gearboxNames: Record<string, string> = { M: t('dossierDetail.manual'), A: t('dossierDetail.automatic'), S: t('dossierDetail.semiAutomatic') };
  const vehicleDetails = [
    [t('dossierSummary.brand'), dossier.brand], [t('dossierSummary.model'), dossier.model], [t('dossierDetail.year'), dossier.year],
    [t('dossierSummary.registration'), dossier.registrationNumber], [t('dossierSummary.country'), dossier.registrationCountry],
    [t('dossierSummary.firstCirculation'), dossier.firstRegistrationDate], [t('dossierForm.vin'), dossier.vin],
    [t('dossierSummary.energy'), dossier.energyLabel || dossier.fuelType], [t('dossierDetail.engine'), dossier.engine],
    [t('dossierSummary.gearbox'), gearboxNames[dossier.gearbox || ''] || dossier.gearbox],
    [t('vehicle.field.co2'), dossier.co2 ? `${dossier.co2} g/km` : undefined], [t('dossierSummary.genre'), dossier.vehicleGenre],
    [t('dossierSummary.fiscalPower'), dossier.fiscalPower], [t('dossierSummary.bodyType'), dossier.bodyType],
    [t('dossierSummary.passengers'), dossier.passengerCount], [t('dossierSummary.doors'), dossier.doorCount], [t('dossierSummary.color'), dossier.color],
    [t('dossierSummary.mileage'), dossier.mileage != null ? `${dossier.mileage.toLocaleString(locale)} km` : undefined],
    [t('vehicle.field.vrade'), dossier.vrade], [t('dossierSummary.procedure'), dossier.procedure],
    [t('dossierSummary.reservePrice'), dossier.reservePrice != null ? `${dossier.reservePrice.toLocaleString(locale)} €` : undefined],
  ];
  const address = dossier.vehicleAddress || [
    dossier.vehicleAddressDetails?.street,
    [dossier.vehicleAddressDetails?.postalCode, dossier.vehicleAddressDetails?.city].filter(Boolean).join(' '),
    dossier.vehicleAddressDetails?.country,
  ].filter(Boolean).join(', ');

  if (isEditable && (dossier.status !== 'valide' || editing)) {
    return <VehicleDossierWizard initialDossier={dossier} />;
  }

  // Read-only view for 'valide', 'refuse', 'soumis', 'en_attente_validation'
  return (
    <div className="flex-1 w-full bg-white text-black font-sans min-h-full p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={localizedPath(backPath, language)}
          className="btn-back mb-3"
        >
          <span>←</span>
          <span className="uppercase">{backLabel} · {vehicleLabel}</span>
        </Link>

        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="font-semibold text-[11px] uppercase tracking-[0.2em] text-[#a3987f] mb-1.5 font-sans">
              {t('dossierDetail.fileNumber', { id: dossier._id.slice(-6).toUpperCase() })}
            </div>
            <h1 className="m-0 font-bold text-[34px] leading-none uppercase text-[#13243c] font-['Saira_Condensed',sans-serif]">
              {vehicleLabel}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isEditable && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn btn-primary"
              >
                {t('common.edit')}
              </button>
            )}
            <Badge style={badge} className="px-3.5 py-2 shrink-0" />
          </div>
        </div>
      </div>

      {/* Decision Banner if Refused */}
      {dossier.status === 'refuse' && (
        <div className="mb-7 border border-[#f0c9bd] bg-[#fbeae7] rounded-[12px] p-5">
          <div className="font-bold text-[13px] uppercase tracking-wide text-[#9a3b2f] mb-2.5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#9a3b2f] text-white flex items-center justify-center text-[10px] font-bold">×</span>
            {t('dossierDetail.refusedTitle')}
          </div>
          {lastRefusal?.motifsLabels && lastRefusal.motifsLabels.length > 0 && (
            <ul className="list-disc pl-5 text-[13px] text-[#1a2230] space-y-1 mb-2 font-medium">
              {lastRefusal.motifsLabels.map((motif, i) => (
                <li key={i}>{motif}</li>
              ))}
            </ul>
          )}
          {lastRefusal?.comment && (
            <p className="text-[12px] italic text-[#5a5e66] mt-1">
              &quot;{lastRefusal.comment}&quot;
            </p>
          )}
          <p className="text-[12px] text-[#9a3b2f] mt-3 font-semibold">
            {t('dossierDetail.refusedFooter')}
          </p>
        </div>
      )}

      {/* Decision Banner if Validated */}
      {dossier.status === 'valide' && (
        <div className="mb-7 border border-[#bcd8c8] bg-[#e9f4ee] rounded-[12px] p-4.5 flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#2f6f4f] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
            ✓
          </div>
          <div className="font-medium text-[13px] leading-relaxed text-[#2f6f4f]">
            {t('dossierDetail.validatedA')}<strong className="font-bold">{t('dossierDetail.validatedB')}</strong>{t('dossierDetail.validatedC')}
          </div>
        </div>
      )}

      {/* Decision Banner if Pending (Soumis) */}
      {['soumis', 'en_attente_validation'].includes(dossier.status) && (
        <div className="mb-7 border border-[#ebdcc9] bg-[#faf1e4] rounded-[12px] p-4.5 flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#b3893f] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
            i
          </div>
          <div className="font-medium text-[13px] leading-relaxed text-[#8a6a2f]">
            {t('dossierDetail.pendingA')}<strong className="font-bold">{t('dossierDetail.pendingB')}</strong>{t('dossierDetail.pendingC')}
          </div>
        </div>
      )}

      {/* Information Grid (Read Only) */}
      <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#4c5058] mb-3">
        {t('dossierDetail.vehicleInfo')}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
        {vehicleDetails.map(([label, value]) => (
          <div key={String(label)} className="border border-[#eceadf] rounded-[10px] p-4 bg-white">
            <div className="font-medium text-[11px] text-[#5a5e66] uppercase tracking-[0.04em] mb-1">{label}</div>
            <div className="font-semibold text-[14px] text-[#13243c] break-words">{value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#4c5058] mb-3">{t('dossierDetail.locationDocs')}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
        <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white sm:col-span-2"><div className="font-medium text-[11px] text-[#5a5e66] uppercase mb-1">{t('dossierDetail.vehicleLocation')}</div><div className="font-semibold text-[14px] text-[#13243c]">{address || '—'}</div></div>
        <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white"><div className="font-medium text-[11px] text-[#5a5e66] uppercase mb-1">{t('dossierSummary.registrationCardAvailable')}</div><div className="font-semibold text-[14px] text-[#13243c]">{dossier.registrationCardAvailable ? t('common.yes') : t('common.no')}</div></div>
        <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white"><div className="font-medium text-[11px] text-[#5a5e66] uppercase mb-1">{t('dossierDetail.policeBook')}</div><div className="font-semibold text-[14px] text-[#13243c]">{dossier.policeBookNumber || '—'}</div></div>
        {!dossier.registrationCardAvailable && <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white sm:col-span-2"><div className="font-medium text-[11px] text-[#5a5e66] uppercase mb-1">{t('dossierSummary.missingReason')}</div><div className="font-semibold text-[14px] text-[#13243c]">{dossier.registrationCardMissingReasons?.map((reason) => t(`dossierMissing.${reason}`)).join(', ') || '—'}</div></div>}
        {!dossier.registrationCardAvailable && <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white"><div className="font-medium text-[11px] text-[#5a5e66] uppercase mb-1">{t('dossierDetail.identificationSheet')}</div><div className="font-semibold text-[14px] text-[#13243c]">{dossier.identificationSheetAvailable ? t('dossierDetail.available') : t('dossierDetail.notAvailable')}</div></div>}
      </div>

      {/* Description */}
      {dossier.description && (
        <div className="mb-7">
          <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#4c5058] mb-2">
            {t('dossierDetail.description')}
          </div>
          <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white text-[13px] leading-relaxed text-[#1a2230] whitespace-pre-wrap">
            {dossier.description.split(/(\*\*.*?\*\*)/g).map((part, index) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={index}>{part.slice(2, -2)}</strong>
                : <React.Fragment key={index}>{part}</React.Fragment>
            )}
          </div>
        </div>
      )}

      {dossier.conditionDetails && (
        <div className="mb-7">
          <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#4c5058] mb-2">{t('dossierDetail.conditionDetails')}</div>
          <div className="whitespace-pre-wrap rounded-[10px] border border-[#eceadf] bg-white p-4 text-[13px] leading-relaxed text-[#1a2230]">{dossier.conditionDetails}</div>
        </div>
      )}

      {/* Photos */}
      <div className="mb-7">
        <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#4c5058] mb-3">
          {t('dossierDetail.photos', { count: String(dossier.photos.length) })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {dossier.photos.map((p, i) => (
            <div key={p._id || i} className="relative aspect-[4/3] rounded-[9px] overflow-hidden bg-gray-100 border border-[#eceadf]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.processedUrl || p.originalUrl} alt="" className="w-full h-full object-cover" />
              {p.isCover && (
                <div className="absolute top-2 left-2 bg-[#2f6f4f] text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
                  {t('dossierSummary.cover')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-7">
        <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#4c5058] mb-3">{t('dossierDetail.documentsProvided')}</div>
        <div className="space-y-2">
          {dossier.expertReport && (
            <a href={dossier.expertReport.processedUrl || dossier.expertReport.originalUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[10px] border border-[#eceadf] p-4 text-[13px] font-semibold text-[#13243c] hover:bg-[#fbfaf7]">
              <span>{dossier.expertReport.label || t('dossierDetail.expertReport')}</span><span className="text-[#d9704f]">{t('dossierDetail.view')}</span>
            </a>
          )}
          {dossier.additionalDocuments.map((document, index) => (
            <a key={document._id || index} href={document.processedUrl || document.originalUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[10px] border border-[#eceadf] p-4 text-[13px] font-semibold text-[#13243c] hover:bg-[#fbfaf7]">
              <span>{document.label === 'Carte grise (recto)' ? t('dossierMedia.registrationRecto') : document.label === 'Carte grise (verso)' ? t('dossierMedia.registrationVerso') : document.label || t('dossierDetail.extraDocument', { n: String(index + 1) })}</span><span className="text-[#d9704f]">{t('dossierDetail.view')}</span>
            </a>
          ))}
          {!dossier.expertReport && dossier.additionalDocuments.length === 0 && <div className="rounded-[10px] border border-dashed border-[#dcd7cb] p-4 text-[13px] text-[#5a5e66]">{t('dossierDetail.noDocuments')}</div>}
        </div>
      </div>
    </div>
  );
}
