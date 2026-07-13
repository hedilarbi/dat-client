'use client';

import React from 'react';
import PhoneInput from 'react-phone-number-input';
import { useLanguage } from '../i18n';

interface IdentityFieldsSectionProps {
  firstName: string;
  onFirstNameChange: (value: string) => void;
  lastName: string;
  onLastNameChange: (value: string) => void;
  companyName: string;
  onCompanyNameChange: (value: string) => void;
  activityType: string;
  onActivityTypeChange: (value: string) => void;
  activityOptions: Array<{ value: string; label: string; }>;
  phone: string;
  onPhoneChange: (value: string) => void;
}

export default function IdentityFieldsSection({
  firstName, onFirstNameChange,
  lastName, onLastNameChange,
  companyName, onCompanyNameChange,
  activityType, onActivityTypeChange,
  activityOptions,
  phone, onPhoneChange,
}: IdentityFieldsSectionProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <h5 className="font-bold text-xs text-gray-400 uppercase tracking-wider">{t('identityFields.heading')}</h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input required type="text" placeholder={t('identityFields.managerLastName')} className="h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={lastName} onChange={e => onLastNameChange(e.target.value)} />
        <input required type="text" placeholder={t('identityFields.managerFirstName')} className="h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={firstName} onChange={e => onFirstNameChange(e.target.value)} />
      </div>
      <input required type="text" placeholder={t('identityFields.companyName')} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={companyName} onChange={e => onCompanyNameChange(e.target.value)} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select value={activityType} onChange={e => onActivityTypeChange(e.target.value)} className="h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black bg-white">
          {activityOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <PhoneInput
          international
          defaultCountry="FR"
          countryCallingCodeEditable={false}
          value={phone}
          onChange={value => onPhoneChange(value || '')}
          className="phone-input w-full"
        />
      </div>
    </div>
  );
}
