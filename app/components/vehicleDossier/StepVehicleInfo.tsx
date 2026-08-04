'use client';

import React, { useRef, useState } from 'react';
import { apiRequest } from '../../api';
import type { FuelType, VehicleDossierPayload } from '../../lib/vehicleDossier';
import Alert from '../Alert';
import Spinner from '../Spinner';

interface Props {
  values: VehicleDossierPayload;
  onChange: (patch: Partial<VehicleDossierPayload>) => void;
  onNext: () => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
}

const textFields: Array<{ key: keyof VehicleDossierPayload; label: string; required?: boolean }> = [
  { key: 'registrationCountry', label: 'Pays' },
  { key: 'brand', label: 'Marque', required: true },
  { key: 'model', label: 'Modèle', required: true },
  { key: 'firstRegistrationDate', label: 'Date de première circulation' },
  { key: 'co2', label: 'CO₂ (g/km)' },
  { key: 'energyLabel', label: 'Énergie' },
  { key: 'vehicleGenre', label: 'Genre' },
  { key: 'fiscalPower', label: 'Puissance fiscale' },
  { key: 'bodyType', label: 'Carrosserie' },
  { key: 'vin', label: 'N° de série (VIN)', required: true },
  { key: 'gearbox', label: 'Boîte de vitesse' },
  { key: 'passengerCount', label: 'Nombre de passagers' },
  { key: 'doorCount', label: 'Nombre de portes' },
  { key: 'color', label: 'Couleur' },
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

export default function StepVehicleInfo({ values, onChange, onNext }: Props) {
  const [searching, setSearching] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(Boolean(values.brand || values.model || values.vin));
  const [lookupError, setLookupError] = useState('');
  const [lookupSuccess, setLookupSuccess] = useState('');
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const lookupRegistration = async () => {
    if (!values.registrationNumber?.trim()) {
      setLookupError("Saisissez une immatriculation avant de lancer la recherche.");
      return;
    }
    setSearching(true);
    setLookupError('');
    setLookupSuccess('');
    try {
      const { data } = await apiRequest('/vehicle-dossiers/registration-lookup', {
        method: 'POST',
        body: JSON.stringify({ immatriculation: values.registrationNumber }),
      });
      if (!data || typeof data !== 'object') {
        throw new Error("Aucune information véhicule n'a été retournée pour cette immatriculation.");
      }
      const year = data.date1erCir_fr?.split('-')[2];
      onChange({
        registrationNumber: data.immat || values.registrationNumber,
        registrationCountry: data.pays || 'FR', brand: data.marque || '', model: data.modele || '',
        firstRegistrationDate: data.date1erCir_fr || '', year: year ? Number(year) : values.year,
        co2: data.co2 || '', energyLabel: data.energieNGC || '', fuelType: fuelFromLabel(data.energieNGC || ''),
        vehicleGenre: data.genreVCGNGC || '', fiscalPower: data.puisFisc || '', bodyType: data.carrosserieCG || '',
        vin: data.vin || '', gearbox: data.boite_vitesse || '', passengerCount: data.nr_passagers || '',
        doorCount: data.nb_portes || '', color: data.couleur || '',
      });
      setDetailsVisible(true);
      setLookupSuccess('Les informations du véhicule ont été trouvées et préremplies.');
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Recherche impossible. Vous pouvez remplir les champs manuellement.');
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
      <section>
        <label className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#4c5058] mb-2">Immatriculation</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input required value={values.registrationNumber || ''} onChange={(e) => { onChange({ registrationNumber: e.target.value.toUpperCase() }); setDetailsVisible(false); setLookupSuccess(''); }} placeholder="AA-123-BC" className="flex-1 h-12 border border-[#dcd7cb] rounded-[9px] px-4 font-mono uppercase focus:outline-none focus:border-[#13243c]" />
          <button type="button" onClick={lookupRegistration} disabled={searching} className="h-12 px-6 rounded-[9px] bg-[#13243c] text-white font-bold text-sm uppercase disabled:opacity-50 flex items-center justify-center gap-2">{searching && <Spinner />}{searching ? 'Recherche…' : 'Rechercher'}</button>
        </div>
        {lookupError && <Alert variant="error" className="mt-3">{lookupError}</Alert>}
        {lookupSuccess && <Alert variant="success" className="mt-3">{lookupSuccess}</Alert>}
      </section>

      {detailsVisible && <>
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {textFields.map(({ key, label, required }) => (
          <label key={key} className="block">
            <span className="block font-semibold text-[11px] uppercase tracking-[0.05em] text-[#4c5058] mb-2">{label}</span>
            <input required={required} value={String(values[key] ?? '')} onChange={(e) => onChange({ [key]: e.target.value } as Partial<VehicleDossierPayload>)} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm focus:outline-none focus:border-[#13243c]" />
          </label>
        ))}
        <label><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">Kilométrage</span><input required type="number" min="0" value={values.mileage ?? ''} onChange={(e) => onChange({ mileage: e.target.value ? Number(e.target.value) : undefined })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4" /></label>
        <label><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">VRADE</span><input value={values.vrade || ''} onChange={(e) => onChange({ vrade: e.target.value })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4" /></label>
        <label><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">Procédure</span><select required value={values.procedure || ''} onChange={(e) => onChange({ procedure: e.target.value as VehicleDossierPayload['procedure'] })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 bg-white"><option value="">Sélectionner</option>{['VEI', 'VE', 'TNR', 'RIV / VE', 'RIV'].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">Adresse de la voiture</span><input required value={values.vehicleAddress || ''} onChange={(e) => onChange({ vehicleAddress: e.target.value })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4" /></label>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2"><label className="font-semibold text-[11px] uppercase text-[#4c5058]">Description du choc</label><button type="button" onClick={makeSelectionBold} className="px-3 py-1.5 border border-[#dcd7cb] rounded-md font-bold text-sm">B</button></div>
        <textarea required ref={descriptionRef} rows={7} value={values.description || ''} onChange={(e) => onChange({ description: e.target.value })} placeholder={'Décrivez le choc…\nLes retours à la ligne seront conservés.'} className="w-full border border-[#dcd7cb] rounded-[9px] p-4 text-sm leading-6 resize-y whitespace-pre-wrap" />
        <p className="text-xs text-[#5a5e66] mt-1">Sélectionnez du texte puis cliquez sur B pour le mettre en gras. Les retours à la ligne sont conservés.</p>
      </section>

      <section className="space-y-4">
        <div><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">Carte grise disponible</span><div className="flex gap-2">{[true, false].map((choice) => <button key={String(choice)} type="button" onClick={() => onChange({ registrationCardAvailable: choice, registrationCardMissingReasons: choice ? [] : values.registrationCardMissingReasons })} className={`px-5 py-2 rounded-full border font-semibold ${values.registrationCardAvailable === choice ? 'bg-[#13243c] text-white' : 'bg-white'}`}>{choice ? 'Oui' : 'Non'}</button>)}</div></div>
        {values.registrationCardAvailable === false && (
          <div className="space-y-4 rounded-lg bg-[#fbfaf7] p-4">
            <div className="flex flex-wrap gap-4">{([['declaration_perte', 'Déclaration de perte'], ['declaration_vol', 'Déclaration de vol'], ['autre', 'Autre']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(values.registrationCardMissingReasons || []).includes(key)} onChange={() => toggleMissingReason(key)} />{label}</label>)}</div>
            <div><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">Fiche d’identification disponible</span><div className="flex gap-2">{[true, false].map((choice) => <button key={String(choice)} type="button" onClick={() => onChange({ identificationSheetAvailable: choice })} className={`px-5 py-2 rounded-full border font-semibold ${values.identificationSheetAvailable === choice ? 'bg-[#13243c] text-white' : 'bg-white'}`}>{choice ? 'Oui' : 'Non'}</button>)}</div></div>
            <label className="block max-w-md"><span className="block font-semibold text-[11px] uppercase text-[#4c5058] mb-2">Numéro du livre de police (optionnel)</span><input value={values.policeBookNumber || ''} onChange={(e) => onChange({ policeBookNumber: e.target.value })} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4" /></label>
          </div>
        )}
      </section>
      </>}
    </form>
  );
}
