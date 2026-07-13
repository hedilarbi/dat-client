'use client';

import React from 'react';
import { useLanguage } from '../i18n';

interface SimpleFileFieldProps {
  label: string;
  accept: string;
  uploading: boolean;
  hasValue: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SimpleFileField({ label, accept, uploading, hasValue, onChange }: SimpleFileFieldProps) {
  const { t } = useLanguage();
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input type="file" accept={accept} onChange={onChange} className="text-xs" />
      {uploading && <p className="text-xs text-yellow-600">{t('shared.uploading')}</p>}
      {hasValue && !uploading && <p className="text-[10px] text-green-600 truncate font-mono mt-1">OK</p>}
    </div>
  );
}
