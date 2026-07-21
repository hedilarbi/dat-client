'use client';

import React from 'react';
import { useLanguage } from '../../i18n';
import Spinner from '../Spinner';
import type { FuelType, VehicleDossierPayload } from '../../lib/vehicleDossier';

interface StepVehicleInfoProps {
  values: VehicleDossierPayload;
  onChange: (patch: Partial<VehicleDossierPayload>) => void;
  onNext: () => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
}

export default function StepVehicleInfo({ values, onChange, onNext, onSaveDraft, savingDraft }: StepVehicleInfoProps) {
  const { t } = useLanguage();

  const isValid = Boolean(
    values.brand && values.model && values.year && values.mileage &&
    values.engine && values.fuelType && values.vin && values.description && values.vehicleCondition
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-9 lg:p-[36px_48px_40px] space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.brand')}</label>
          <input
            required
            type="text"
            value={values.brand || ''}
            onChange={(e) => onChange({ brand: e.target.value })}
            className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
            placeholder={t('vehicleDossier.brandPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.model')}</label>
          <input
            required
            type="text"
            value={values.model || ''}
            onChange={(e) => onChange({ model: e.target.value })}
            className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
            placeholder={t('vehicleDossier.modelPlaceholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.year')}</label>
          <input
            required
            type="number"
            value={values.year ?? ''}
            onChange={(e) => onChange({ year: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
            placeholder={t('vehicleDossier.yearPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.mileage')}</label>
          <input
            required
            type="number"
            value={values.mileage ?? ''}
            onChange={(e) => onChange({ mileage: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
            placeholder={t('vehicleDossier.mileagePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.fuelType')}</label>
          <select
            required
            value={values.fuelType || ''}
            onChange={(e) => onChange({ fuelType: e.target.value as FuelType })}
            className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none bg-white"
          >
            <option value="" disabled>—</option>
            <option value="essence">{t('vehicleDossier.fuel.essence')}</option>
            <option value="diesel">{t('vehicleDossier.fuel.diesel')}</option>
            <option value="hybride">{t('vehicleDossier.fuel.hybride')}</option>
            <option value="electrique">{t('vehicleDossier.fuel.electrique')}</option>
            <option value="gpl">{t('vehicleDossier.fuel.gpl')}</option>
            <option value="autre">{t('vehicleDossier.fuel.autre')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.engine')}</label>
          <input
            required
            type="text"
            value={values.engine || ''}
            onChange={(e) => onChange({ engine: e.target.value })}
            className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
            placeholder={t('vehicleDossier.enginePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.vin')}</label>
          <input
            required
            type="text"
            value={values.vin || ''}
            onChange={(e) => onChange({ vin: e.target.value })}
            className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 font-mono text-sm text-[#1a2230] focus:outline-none"
            placeholder={t('vehicleDossier.vinPlaceholder')}
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.condition')}</label>
        <input
          required
          type="text"
          value={values.vehicleCondition || ''}
          onChange={(e) => onChange({ vehicleCondition: e.target.value })}
          className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
          placeholder={t('vehicleDossier.conditionPlaceholder')}
        />
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('vehicleDossier.description')}</label>
        <textarea
          required
          rows={5}
          value={values.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full border border-[#dcd7cb] rounded-[9px] p-4 text-sm text-[#1a2230] focus:outline-none"
          placeholder={t('vehicleDossier.descriptionPlaceholder')}
        />
      </div>

      <div className="pt-4 border-t border-[#efece3] flex justify-between items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={savingDraft}
          className="h-12 px-6 border border-[#dcd7cb] rounded-[9px] text-[#13243c] font-semibold hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
        >
          {savingDraft && <Spinner />}
          {t('vehicleDossier.saveDraft')}
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className="h-12 px-8 bg-[#13243c] hover:bg-slate-800 text-white font-bold rounded-[9px] uppercase tracking-[0.03em] transition disabled:opacity-50"
        >
          {t('vehicleDossier.continue')}
        </button>
      </div>
    </form>
  );
}
