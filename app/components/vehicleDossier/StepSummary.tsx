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

const PHOTO_LABELS = ['Face avant', 'Face arrière', 'Profil gauche', 'Profil droit', 'Compteur', 'Intérieur'];

const MISSING_REASON_LABELS: Record<string, string> = {
  declaration_perte: 'Déclaration de perte',
  declaration_vol: 'Déclaration de vol',
  autre: 'Autre',
};

function SummaryField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-[9px] bg-[#f8f7f2] p-3.5">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#4c5058]">{label}</div>
      <div className="text-[13px] font-semibold leading-relaxed text-[#13243c]">{value || 'Non renseigné'}</div>
    </div>
  );
}

function FormattedDescription({ value }: { value?: string }) {
  if (!value) return <>Non renseignée</>;
  return <>{value.split(/(\*\*.*?\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : <React.Fragment key={index}>{part}</React.Fragment>)}</>;
}

export default function StepSummary({
  values,
  photos,
  additionalDocuments,
  expertReport,
}: StepSummaryProps) {
  const address = values.vehicleAddressDetails;
  const formattedAddress = address
    ? [address.street, `${address.postalCode} ${address.city}`.trim(), address.country].filter(Boolean).join(', ')
    : values.vehicleAddress;
  const missingReasons = (values.registrationCardMissingReasons || [])
    .map((reason) => MISSING_REASON_LABELS[reason] || reason)
    .join(', ');
  const reservePrice = values.reservePrice != null
    ? `${values.reservePrice.toLocaleString('fr-FR')} €`
    : 'Non défini';

  return (
    <div className="max-w-[900px] w-full space-y-6">
      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d9704f]">Étape 1</div>
          <h2 className="text-[17px] font-bold uppercase text-[#13243c]">Informations du véhicule</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <SummaryField label="Immatriculation" value={values.registrationNumber} />
          <SummaryField label="Marque" value={values.brand} />
          <SummaryField label="Modèle" value={values.model} />
          <SummaryField label="Première circulation" value={values.firstRegistrationDate} />
          <SummaryField label="Énergie" value={values.energyLabel} />
          <SummaryField label="Boîte de vitesse" value={values.gearbox === 'M' ? 'M — Manuelle' : values.gearbox === 'A' ? 'A — Automatique' : values.gearbox} />
          <SummaryField label="VIN" value={values.vin} />
          <SummaryField label="Kilométrage" value={values.mileage != null ? `${values.mileage.toLocaleString('fr-FR')} km` : undefined} />
          <SummaryField label="VRADE" value={values.vrade} />
          <SummaryField label="Procédure" value={values.procedure} />
          <SummaryField label="Pays d'immatriculation" value={values.registrationCountry} />
          <SummaryField label="CO₂" value={values.co2 ? `${values.co2} g/km` : undefined} />
          <SummaryField label="Genre" value={values.vehicleGenre} />
          <SummaryField label="Puissance fiscale" value={values.fiscalPower} />
          <SummaryField label="Carrosserie" value={values.bodyType} />
          <SummaryField label="Passagers" value={values.passengerCount} />
          <SummaryField label="Portes" value={values.doorCount} />
          <SummaryField label="Couleur" value={values.color} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryField label="Adresse de la voiture" value={formattedAddress} />
          <SummaryField label="Carte grise disponible" value={values.registrationCardAvailable === false ? 'Non' : 'Oui'} />
          {values.registrationCardAvailable === false && <SummaryField label="Motif d'absence" value={missingReasons} />}
          {values.registrationCardAvailable === false && <SummaryField label="Fiche d'identification disponible" value={values.identificationSheetAvailable ? 'Oui' : 'Non'} />}
          {values.registrationCardAvailable === false && <SummaryField label="Numéro du livre de police" value={values.policeBookNumber} />}
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4c5058]">Description du choc</div>
          <div className="whitespace-pre-wrap rounded-[9px] bg-[#f8f7f2] p-4 text-[13px] leading-relaxed text-[#13243c]">
            <FormattedDescription value={values.description} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d9704f]">Étape 2</div>
          <h2 className="text-[17px] font-bold uppercase text-[#13243c]">Photos et documents</h2>
          <p className="mt-1 text-[12px] text-[#5a5e66]">{photos.length} photo(s) ajoutée(s)</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.localId}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[9px] bg-[#eef1f5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.processedUrl || photo.originalUrl} alt={PHOTO_LABELS[index] || `Photo supplémentaire ${index - PHOTO_LABELS.length + 1}`} className="h-full w-full object-cover" />
                {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-[#2f6f4f] px-2 py-1 text-[9px] font-bold uppercase text-white">Couverture</span>}
                {photo.blurZones.length > 0 && <span className="absolute bottom-2 right-2 rounded-full bg-[#13243c] px-2 py-1 text-[9px] font-bold text-white">{photo.blurZones.length} floutage(s)</span>}
              </div>
              <div className="mt-1.5 text-center text-[11px] font-medium text-[#5a5e66]">{PHOTO_LABELS[index] || `Photo supplémentaire ${index - PHOTO_LABELS.length + 1}`}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryField label="Rapport d'expert" value={expertReport ? <a href={expertReport.processedUrl || expertReport.originalUrl} target="_blank" rel="noreferrer" className="text-[#d9704f] underline">Document ajouté{expertReport.blurZones.length ? ` — ${expertReport.blurZones.length} floutage(s)` : ''}</a> : 'Non ajouté (optionnel)'} />
          <SummaryField label="Documents complémentaires" value={additionalDocuments.length ? `${additionalDocuments.length} document(s)` : 'Aucun'} />
        </div>
        {additionalDocuments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {additionalDocuments.map((document, index) => <a key={document.localId} href={document.processedUrl || document.originalUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#dcd7cb] px-3 py-1.5 text-[11px] font-semibold text-[#13243c] hover:bg-[#f8f7f2]">{document.label || `Document ${index + 1}`}</a>)}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d9704f]">Étape 3</div>
          <h2 className="text-[17px] font-bold uppercase text-[#13243c]">Mise en vente</h2>
        </div>
        <SummaryField label="Prix de réserve" value={reservePrice} />
      </section>

      <div className="bg-[#faf1e4] rounded-[11px] p-4.5 sm:p-[18px_20px] flex items-center gap-3.5">
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
