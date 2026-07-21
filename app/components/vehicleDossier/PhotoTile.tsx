'use client';

import React from 'react';
import { useLanguage } from '../../i18n';
import type { WizardPhoto } from './types';

interface PhotoTileProps {
  photo: WizardPhoto;
  index: number;
  total: number;
  onSetCover: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onEditBlur: () => void;
}

export default function PhotoTile({ photo, index, total, onSetCover, onMoveUp, onMoveDown, onRemove, onEditBlur }: PhotoTileProps) {
  const { t } = useLanguage();
  const displayUrl = photo.processedUrl || photo.originalUrl;

  return (
    <div className="relative rounded-[10px] border border-[#dcd7cb] bg-[#fbfaf7] overflow-hidden">
      <div className="relative aspect-[4/3] bg-[#13243c]">
        {displayUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        )}
        {photo.uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[12px] font-semibold">
            {t('vehicleDossier.uploadingFile')}
          </div>
        )}
        {photo.isCover && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-[#2f6f4f] text-white px-2 py-1 rounded-full">
            {t('vehicleDossier.cover')}
          </span>
        )}
        {photo.processedUrl && (
          <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide bg-[#d9704f] text-white px-2 py-1 rounded-full">
            {t('vehicleDossier.blurEdited')}
          </span>
        )}
      </div>

      <div className="p-2 flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onEditBlur}
            disabled={photo.uploading}
            className="flex-1 h-8 text-[11px] font-semibold border border-[#dcd7cb] rounded-[7px] hover:bg-gray-50 transition disabled:opacity-50"
          >
            {t('vehicleDossier.blurEdit')}
          </button>
          <button
            type="button"
            onClick={onSetCover}
            disabled={photo.isCover || photo.uploading}
            className="flex-1 h-8 text-[11px] font-semibold border border-[#dcd7cb] rounded-[7px] hover:bg-gray-50 transition disabled:opacity-50"
          >
            {t('vehicleDossier.setAsCover')}
          </button>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={t('vehicleDossier.moveUp')}
            className="w-8 h-8 text-[13px] border border-[#dcd7cb] rounded-[7px] hover:bg-gray-50 transition disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label={t('vehicleDossier.moveDown')}
            className="w-8 h-8 text-[13px] border border-[#dcd7cb] rounded-[7px] hover:bg-gray-50 transition disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex-1 h-8 text-[11px] font-semibold border border-[#dcd7cb] rounded-[7px] text-[#b3261e] hover:bg-red-50 transition"
          >
            {t('vehicleDossier.removePhoto')}
          </button>
        </div>
      </div>
    </div>
  );
}
