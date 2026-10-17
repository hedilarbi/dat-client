'use client';

import React, { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../api';
import { countries } from '../../lib/countries';
import type { FuelType, VehicleAddressDetails, VehicleDossierPayload } from '../../lib/vehicleDossier';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { parseRegistrationDate } from '../../lib/registrationDate';
import { useLanguage } from '../../i18n';

interface Props {
  values: VehicleDossierPayload;
  onChange: (patch: Partial<VehicleDossierPayload>) => void;
  onNext: () => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
  isEditing?: boolean;
}

type ApiVehicleField = typeof textFields[number]['key'] | 'registrationNumber';

const apiVehicleValues = (data: Record<string, unknown>) => ({
  registrationNumber: String(data.immat || ''),
  registrationCountry: String(data.pays || ''),
  brand: String(data.marque || ''),
  model: String(data.modele || ''),
  firstRegistrationDate: String(data.date1erCir_fr || ''),
  co2: String(data.co2 || ''),
  energyLabel: String(data.energieNGC || ''),
  vehicleGenre: String(data.genreVCGNGC || ''),
  fiscalPower: String(data.puisFisc || ''),
  bodyType: String(data.carrosserieCG || ''),
  vin: String(data.vin || ''),
  // Seuls M, A et S sont proposés : toute autre valeur de l'API (X = inconnue, code imprévu) laisse le
  // champ vide et modifiable, pour que l'utilisateur choisisse lui-même la boîte.
  gearbox: ['M', 'A', 'S'].includes(String(data.boite_vitesse || '').toUpperCase()) ? String(data.boite_vitesse).toUpperCase() : '',
  passengerCount: String(data.nr_passagers || ''),
  doorCount: String(data.nb_portes || ''),
  color: String(data.couleur || ''),
});

const textFields: Array<{ key: keyof VehicleDossierPayload; label: string; required?: boolean }> = [
  { key: 'brand', label: 'dossierForm.brand', required: true },
  { key: 'model', label: 'dossierForm.model', required: true },
  { key: 'firstRegistrationDate', label: 'dossierForm.firstRegistrationDate', required: true },
  { key: 'energyLabel', label: 'dossierForm.energy', required: true },
  { key: 'vin', label: 'dossierForm.vin', required: true },
  { key: 'gearbox', label: 'dossierForm.gearbox', required: true },
  { key: 'registrationCountry', label: 'dossierForm.country' },
  { key: 'co2', label: 'dossierForm.co2' },
  { key: 'vehicleGenre', label: 'dossierForm.genre' },
  { key: 'fiscalPower', label: 'dossierForm.fiscalPower' },
  { key: 'bodyType', label: 'dossierForm.bodyType' },
  { key: 'passengerCount', label: 'dossierForm.passengerCount' },
  { key: 'doorCount', label: 'dossierForm.doorCount' },
  { key: 'color', label: 'dossierForm.color' },
];

const fuelFromLabel = (value: string): FuelType => {
  const normalized = value.toLowerCase();
  if (normalized.includes('diesel')) return 'diesel';
  if (normalized.includes('elect')) return 'electrique';
  if (normalized.includes('hybr')) return 'hybride';
  if (normalized.includes('gpl')) return 'gpl';
  if (normalized.includes('essence')) return 'essence';
  return 'autre';
};

export default function StepVehicleInfo({ values, onChange, onNext, isEditing = false }: Props) {
  const { language, t } = useLanguage();
  const [searching, setSearching] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(Boolean(values.brand || values.model || values.vin));
  const [lookupError, setLookupError] = useState('');
  const [lockedApiFields, setLockedApiFields] = useState<Set<ApiVehicleField>>(new Set());
  const [checkingApiFields, setCheckingApiFields] = useState(false);
  const verifiedRegistration = useRef('');
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const registration = values.registrationNumber?.trim();
    if (!isEditing || !registration || verifiedRegistration.current === registration) return;
    // En modification, seul le matricule est immuable. Les données récupérées lors de la
    // création ne doivent pas verrouiller les autres champs du véhicule.
    verifiedRegistration.current = registration;
    setLockedApiFields(new Set(['registrationNumber']));
  }, [values.registrationNumber, isEditing]);

  const updateVehicleAddress = (patch: Partial<VehicleAddressDetails>) => {
    const details: VehicleAddressDetails = {
      street: '',
      postalCode: '',
      city: '',
      country: 'France',
      ...values.vehicleAddressDetails,
      ...patch,
    };
    const formattedAddress = [
      details.street,
      `${details.postalCode} ${details.city}`.trim(),
      details.country,
    ].filter(Boolean).join(', ');
    onChange({ vehicleAddressDetails: details, vehicleAddress: formattedAddress });
  };

  const lookupRegistration = async () => {
    if (!values.registrationNumber?.trim()) {
      setLookupError(t('dossierForm.lookupMissing'));
      return;
    }
    setSearching(true);
    setLookupError('');
    try {
      const { data } = await apiRequest('/vehicle-dossiers/registration-lookup', {
        method: 'POST',
        body: JSON.stringify({ immatriculation: values.registrationNumber }),
      });
      if (!data || typeof data !== 'object') {
        throw new Error(t('dossierForm.lookupNoData'));
      }
      const apiValues = apiVehicleValues(data as Record<string, unknown>);
      const registration = parseRegistrationDate(apiValues.firstRegistrationDate);
      onChange({
        ...apiValues,
        firstRegistrationDate: registration?.date ?? apiValues.firstRegistrationDate,
        registrationNumber: apiValues.registrationNumber || values.registrationNumber,
        year: registration ? registration.year : values.year,
        fuelType: fuelFromLabel(apiValues.energyLabel),
      });
      setLockedApiFields(new Set(
        (Object.entries(apiValues) as Array<[ApiVehicleField, string]>)
          .filter(([, value]) => Boolean(value.trim()))
          .map(([key]) => key),
      ));
      setDetailsVisible(true);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : t('dossierForm.lookupFailed'));
    } finally {
      setSearching(false);
    }
  };

  const toggleMissingReason = (reason: 'declaration_perte' | 'declaration_vol' | 'autre') => {
    const reasons = values.registrationCardMissingReasons || [];
    onChange({ registrationCardMissingReasons: reasons.includes(reason) ? reasons.filter((item) => item !== reason) : [...reasons, reason] });
  };

  const makeSelectionBold = () => {
    const element = descriptionRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const text = values.description || '';
    const selected = text.slice(start, end);
    if (!selected) return;
    onChange({ description: `${text.slice(0, start)}**${selected}**${text.slice(end)}` });
    requestAnimationFrame(() => { element.focus(); element.setSelectionRange(start + 2, end + 2); });
  };

  return (
    <form id="step-vehicle-info-form" onSubmit={(event) => { event.preventDefault(); onNext(); }} className="max-w-[900px] w-full space-y-7">
      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-4">
        <h2 className="font-bold text-[16px] uppercase tracking-wide text-[#13243c]">{t('dossierForm.carInfo')}</h2>
        <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#4c5058] mb-2">{t('dossierForm.registration')}</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input required aria-label={t('dossierForm.registration')} readOnly={isEditing || checkingApiFields || lockedApiFields.has('registrationNumber')} value={values.registrationNumber || ''} onChange={(e) => { onChange({ registrationNumber: e.target.value.toUpperCase() }); setDetailsVisible(false); }} placeholder="AA-123-BC" className="flex-1 h-12 border border-[#dcd7cb] rounded-[9px] px-4 font-mono uppercase focus:outline-none focus:border-[#13243c] read-only:bg-[#f1efe8] read-only:text-[#5a5e66]" />
          {!isEditing && <button type="button" onClick={lookupRegistration} disabled={searching} className="btn btn-primary disabled:opacity-50 gap-2">{searching && <Spinner />}{searching ? t('dossierForm.searching') : t('dossierForm.search')}</button>}
        </div>
        {isEditing && <p className="mt-2 text-[11px] text-[#5a5e66]">{t('dossierForm.registrationLocked')}</p>}
        {lookupError && <Alert variant="error" className="mt-3">{lookupError}</Alert>}

      {detailsVisible && (
      <div className="border-t border-[#e5e1d7] pt-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {textFields.map(({ key, label: labelKey, required }) => {
          const label = t(labelKey);
          return (
          <label key={key} className="block">
            <span className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#4c5058] mb-2">{label}{required && <span className="text-[#b42318]"> *</span>}</span>
            {key === 'gearbox' ? (
              <select required aria-label={label} disabled={checkingApiFields || lockedApiFields.has(key)} value={values.gearbox || ''} onChange={(e) => onChange({ gearbox: e.target.value })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 bg-white focus:outline-none focus:border-[#13243c] disabled:bg-[#f1efe8] disabled:text-[#5a5e66]"><option value="">{t('dossierForm.select')}</option><option value="M">{t('dossierForm.gearboxM')}</option><option value="A">{t('dossierForm.gearboxA')}</option><option value="S">{t('dossierForm.gearboxS')}</option></select>
            ) : (
              <input required={required} aria-label={label} readOnly={checkingApiFields || lockedApiFields.has(key)} value={String(values[key] ?? '')} onChange={(e) => onChange({ [key]: e.target.value } as Partial<VehicleDossierPayload>)} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm focus:outline-none focus:border-[#13243c] read-only:bg-[#f1efe8] read-only:text-[#5a5e66]" />
            )}
          </label>
          );
        })}
        </div>
      </div>
      )}
      </section>

      {detailsVisible && <>
      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-4">
        <h2 className="font-bold text-[16px] uppercase tracking-wide text-[#13243c]">{t('dossierForm.mileage')}</h2>
        <label><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">{t('dossierForm.mileage')} <span className="text-[#b42318]">*</span></span><input required aria-label={t('dossierForm.mileage')} type="number" min="0" value={values.mileage ?? ''} onChange={(e) => onChange({ mileage: e.target.value ? Number(e.target.value) : undefined })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 bg-white" /></label>
      </section>

      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-4">
        <h2 className="font-bold text-[16px] uppercase tracking-wide text-[#13243c]">{t('vehicle.field.vrade')}</h2>
        <label>
          <span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-1">{t('vehicle.field.vrade')}</span>
          <span className="block text-xs leading-5 text-[#5a5e66] mb-2">{t('dossierForm.vradeHelp')}</span>
          <input value={values.vrade || ''} onChange={(e) => onChange({ vrade: e.target.value })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 bg-white" />
        </label>
      </section>

      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-4">
        <h2 className="font-bold text-[16px] uppercase tracking-wide text-[#13243c]">{t('dossierForm.procedure')}</h2>
        <label className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">{t('dossierForm.procedure')} <span className="text-[#b42318]">*</span></label>
        <select required aria-label={t('dossierForm.procedure')} value={values.procedure || ''} onChange={(e) => onChange({ procedure: e.target.value as VehicleDossierPayload['procedure'] })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 bg-white"><option value="">{t('dossierForm.select')}</option>{['VEI', 'VE', 'TNR', 'RIV / VE', 'RIV'].map((item) => <option key={item}>{item}</option>)}</select>
      </section>

      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-4">
        <h2 className="font-bold text-[16px] uppercase tracking-wide text-[#13243c]">{t('dossierForm.carLocation')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="sm:col-span-2">
            <span className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#4c5058] mb-2">{t('dossierForm.address')}</span>
            <input required value={values.vehicleAddressDetails?.street || ''} onChange={(e) => updateVehicleAddress({ street: e.target.value })} placeholder={t('dossierForm.addressPlaceholder')} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm focus:outline-none focus:border-[#13243c]" />
          </label>
          <label>
            <span className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#4c5058] mb-2">{t('dossierForm.postalCode')}</span>
            <input required value={values.vehicleAddressDetails?.postalCode || ''} onChange={(e) => updateVehicleAddress({ postalCode: e.target.value })} placeholder="75001" className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm focus:outline-none focus:border-[#13243c]" />
          </label>
          <label>
            <span className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#4c5058] mb-2">{t('dossierForm.city')}</span>
            <input required value={values.vehicleAddressDetails?.city || ''} onChange={(e) => updateVehicleAddress({ city: e.target.value })} placeholder="Paris" className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm focus:outline-none focus:border-[#13243c]" />
          </label>
          <label className="sm:col-span-2">
            <span className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#4c5058] mb-2">{t('dossierForm.country')}</span>
            <select required value={values.vehicleAddressDetails?.country || 'France'} onChange={(e) => updateVehicleAddress({ country: e.target.value })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm bg-white focus:outline-none focus:border-[#13243c]">
              {countries.map((country) => <option key={country.code} value={country.fr}>{country[language]}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-4">
        <h2 className="font-bold text-[16px] uppercase tracking-wide text-[#13243c]">{t('dossierForm.damage')}</h2>
        <div className="flex items-center justify-between mb-2"><label className="font-semibold text-[11px] uppercase text-[#4c5058]">{t('dossierForm.damage')}</label><button type="button" onClick={makeSelectionBold} className="btn btn-secondary">B</button></div>
        <textarea required aria-label={t('dossierForm.damage')} ref={descriptionRef} rows={7} value={values.description || ''} onChange={(e) => onChange({ description: e.target.value })} placeholder={t('dossierForm.damagePlaceholder')} className="w-full border border-[#dcd7cb] rounded-[9px] p-4 text-sm leading-6 resize-y whitespace-pre-wrap" />
        <p className="text-xs text-[#5a5e66] mt-1">{t('dossierForm.damageHelp')}</p>
      </section>

      <section className="rounded-xl border border-[#e5e1d7] bg-white p-5 space-y-4">
        <h2 className="font-bold text-[16px] uppercase tracking-wide text-[#13243c]">{t('dossierForm.registrationCard')}</h2>
        <div><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">{t('dossierForm.registrationCard')}</span><div className="flex gap-2">{[true, false].map((choice) => <button key={String(choice)} type="button" onClick={() => onChange({ registrationCardAvailable: choice, registrationCardMissingReasons: choice ? [] : values.registrationCardMissingReasons })} className={`px-5 py-2 rounded-full border font-semibold ${values.registrationCardAvailable === choice ? 'bg-[#13243c] text-white' : 'bg-white'}`}>{choice ? t('common.yes') : t('common.no')}</button>)}</div></div>
        {values.registrationCardAvailable === true && (
          <label className="block max-w-md"><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">{t('dossierForm.policeBook')}</span><input value={values.policeBookNumber || ''} onChange={(e) => onChange({ policeBookNumber: e.target.value })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4" /></label>
        )}
        {values.registrationCardAvailable === false && (
          <div className="space-y-4 rounded-lg bg-[#fbfaf7] p-4">
            <div className="flex flex-wrap gap-4">{(['declaration_perte', 'declaration_vol', 'autre'] as const).map((key) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(values.registrationCardMissingReasons || []).includes(key)} onChange={() => toggleMissingReason(key)} />{t(`dossierMissing.${key}`)}</label>)}</div>
            <div><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">{t('dossierForm.identificationSheet')}</span><div className="flex gap-2">{[true, false].map((choice) => <button key={String(choice)} type="button" onClick={() => onChange({ identificationSheetAvailable: choice })} className={`px-5 py-2 rounded-full border font-semibold ${values.identificationSheetAvailable === choice ? 'bg-[#13243c] text-white' : 'bg-white'}`}>{choice ? t('common.yes') : t('common.no')}</button>)}</div></div>
          </div>
        )}
      </section>
      </>}
    </form>
  );
}
