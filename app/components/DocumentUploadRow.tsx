'use client';

import React from 'react';
import { useLanguage } from '../i18n';

interface DocumentUploadRowProps {
  label: string;
  accept: string;
  file: File | null;
  existingUrl: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedLabel?: string;
  maxWidthClass?: string;
}

export default function DocumentUploadRow({
  label,
  accept,
  file,
  existingUrl,
  onChange,
  selectedLabel,
  maxWidthClass = 'max-w-[620px]',
}: DocumentUploadRowProps) {
  const { t } = useLanguage();
  const hasDocument = Boolean(file || existingUrl);
  const resolvedSelectedLabel = selectedLabel ?? t('documentUpload.selected');

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] font-semibold text-[#13243c]">{label}</span>
        {hasDocument && (
          <span className="text-[11px] font-semibold bg-[#e9f4ee] text-[#2f6f4f] px-[11px] py-1 rounded-full">
            {resolvedSelectedLabel}
          </span>
        )}
      </div>
      <div className={`h-[54px] rounded-[9px] border-2 border-dashed flex items-center justify-between px-4 transition ${hasDocument ? 'border-[#bcd8c8] bg-[#f2f8f4]' : 'border-[#d3ccbd] bg-[#fbfaf7]'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-[30px] h-[30px] rounded-[7px] border flex items-center justify-center font-bold text-sm bg-white shrink-0 ${hasDocument ? 'text-[#2f6f4f] border-[#bcd8c8]' : 'text-gray-400 border-[#d3ccbd]'}`}>
            {hasDocument ? '✓' : '↑'}
          </span>
          <span className={`text-[13px] font-semibold truncate ${maxWidthClass} ${hasDocument ? 'text-[#2f6f4f]' : 'text-[#9a917d]'}`}>
            {file?.name || (existingUrl ? t('documentUpload.alreadySubmitted') : t('documentUpload.selectDocument'))}
          </span>
        </div>
        <label className="text-[12px] font-semibold text-[#13243c] border border-[#dcd7cb] rounded-[7px] p-[8px_14px] bg-white cursor-pointer hover:bg-gray-50 shrink-0">
          {hasDocument ? t('documentUpload.replace') : t('documentUpload.browse')}
          <input type="file" accept={accept} onChange={onChange} className="hidden" />
        </label>
      </div>
    </div>
  );
}
