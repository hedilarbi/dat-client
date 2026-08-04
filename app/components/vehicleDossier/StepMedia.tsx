'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../i18n';
import { apiRequest } from '../../api';
import { uploadFile } from '../../lib/uploadFile';
import Alert from '../Alert';
import Spinner from '../Spinner';
import BlurZoneEditor from './BlurZoneEditor';
import ImageCropEditor from './ImageCropEditor';
import type { WizardDocument, WizardPhoto } from './types';
import type { BlurZone } from '../../lib/vehicleDossier';

interface StepMediaProps {
  photos: WizardPhoto[];
  onPhotosChange: React.Dispatch<React.SetStateAction<WizardPhoto[]>>;
  expertReport: WizardDocument | null;
  onExpertReportChange: React.Dispatch<React.SetStateAction<WizardDocument | null>>;
  additionalDocuments: WizardDocument[];
  onAdditionalDocumentsChange: React.Dispatch<React.SetStateAction<WizardDocument[]>>;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
}

type EditingTarget = { kind: 'photo'; localId: string } | { kind: 'expertReport' } | { kind: 'document'; localId: string } | null;

const makeLocalId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const STANDARD_SLOTS = [
  { id: 'front', label: 'Face avant', icon: '/face-avant.png' },
  { id: 'rear', label: 'Face arrière', icon: '/face-arriere.png' },
  { id: 'left_profile', label: 'Profil gauche', icon: '/profil-gauche.png' },
  { id: 'right_profile', label: 'Profil droit', icon: '/profil-droit.png' },
  { id: 'interior', label: 'Intérieur / habitacle', icon: '/interieur.png' },
  { id: 'odometer', label: 'Compteur kilométrique', icon: '/compteur.png' },
] as const;

export default function StepMedia({
  photos, onPhotosChange, expertReport, onExpertReportChange, additionalDocuments, onAdditionalDocumentsChange,
}: StepMediaProps) {
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);
  const [croppingImageSrc, setCroppingImageSrc] = useState<string | null>(null);
  const [cropTargetIndex, setCropTargetIndex] = useState<number | null>(null);
  const [applyingBlur, setApplyingBlur] = useState(false);

  // Document upload state flags
  const [uploadingRecto, setUploadingRecto] = useState(false);
  const [uploadingVerso, setUploadingVerso] = useState(false);
  const [uploadingExpert, setUploadingExpert] = useState(false);

  // Cover photo
  const coverPhoto = photos.find((p) => p.isCover);
  const handleCoverFileSelected = (e: React.ChangeEvent<HTMLInputElement>, index = 0) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');

    const objectUrl = URL.createObjectURL(file);
    setCropTargetIndex(index);
    setCroppingImageSrc(objectUrl);
  };

  const handleCropComplete = async (croppedBlob: Blob, previewUrl: string) => {
    setCroppingImageSrc(null);

    const targetIndex = cropTargetIndex ?? 0;
    const currentPhoto = photos[targetIndex];
    const tempLocalId = currentPhoto?.localId || makeLocalId();
    const file = new File([croppedBlob], `photo-${targetIndex + 1}.jpg`, { type: 'image/jpeg' });

    const placeholder: WizardPhoto = {
      localId: tempLocalId,
      originalUrl: previewUrl,
      blurZones: currentPhoto?.blurZones || [],
      isCover: targetIndex === 0,
      uploading: true,
    };

    onPhotosChange((prev) => {
      const next = prev.map((p, index) => ({ ...p, isCover: index === 0 }));
      next[targetIndex] = placeholder;
      return next;
    });

    try {
      const url = await uploadFile(file, 'vehicules/photos');
      onPhotosChange((prev) =>
        prev.map((p) => (p.localId === tempLocalId ? { ...p, originalUrl: url, uploading: false } : p))
      );
      setEditingTarget({ kind: 'photo', localId: tempLocalId });
    } catch (err: any) {
      setError(err.message || t('vehicleDossier.uploadError'));
      onPhotosChange((prev) => prev.filter((p) => p.localId !== tempLocalId));
    }
  };

  const removeCoverPhoto = () => {
    if (!coverPhoto) return;
    onPhotosChange((prev) => prev.filter((p) => p.localId !== coverPhoto.localId));
  };

  const handleSlotUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => handleCoverFileSelected(e, index);

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => handleCoverFileSelected(e, photos.length);

  const removeSlotPhoto = (localId: string) => {
    onPhotosChange((prev) => prev.filter((p) => p.localId !== localId).map((p, index) => ({ ...p, isCover: index === 0 })));
  };

  // Carte grise documents
  const carteGriseRecto = additionalDocuments.find((d) => d.label === 'Carte grise (recto)');
  const carteGriseVerso = additionalDocuments.find((d) => d.label === 'Carte grise (verso)');

  const processCarteGriseFile = async (file: File, side: 'recto' | 'verso') => {
    if (!file) return;
    setError('');
    if (side === 'recto') setUploadingRecto(true);
    else setUploadingVerso(true);

    try {
      const url = await uploadFile(file, 'vehicules/documents');
      const docLabel = side === 'recto' ? 'Carte grise (recto)' : 'Carte grise (verso)';
      const doc: WizardDocument = {
        localId: makeLocalId(),
        type: 'complementaire',
        originalUrl: url,
        mimeType: file.type,
        blurZones: [],
        label: docLabel,
        uploading: false,
      };

      onAdditionalDocumentsChange((prev) => [
        ...prev.filter((d) => d.label !== docLabel),
        doc,
      ]);
    } catch (err: any) {
      setError(err.message || t('vehicleDossier.uploadError'));
    } finally {
      if (side === 'recto') setUploadingRecto(false);
      else setUploadingVerso(false);
    }
  };

  const handleCarteGriseInputChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'recto' | 'verso') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processCarteGriseFile(file, side);
  };

  const removeCarteGriseSide = (side: 'recto' | 'verso') => {
    const docLabel = side === 'recto' ? 'Carte grise (recto)' : 'Carte grise (verso)';
    onAdditionalDocumentsChange((prev) => prev.filter((d) => d.label !== docLabel));
  };

  // Expert report document
  const processExpertReportFile = async (file: File) => {
    if (!file) return;
    setError('');
    setUploadingExpert(true);

    try {
      const url = await uploadFile(file, 'vehicules/documents');
      const doc: WizardDocument = {
        localId: makeLocalId(),
        type: 'rapport_expert',
        originalUrl: url,
        mimeType: file.type,
        blurZones: [],
        label: file.name,
        uploading: false,
      };
      onExpertReportChange(doc);
    } catch (err: any) {
      setError(err.message || t('vehicleDossier.uploadError'));
    } finally {
      setUploadingExpert(false);
    }
  };

  const handleExpertReportInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processExpertReportFile(file);
  };

  const removeExpertReport = () => {
    onExpertReportChange(null);
  };

  const editingItem: { originalUrl: string; blurZones: BlurZone[]; mimeType?: string } | null = (() => {
    if (!editingTarget) return null;
    if (editingTarget.kind === 'photo') return photos.find((p) => p.localId === editingTarget.localId) || null;
    if (editingTarget.kind === 'expertReport') return expertReport;
    return additionalDocuments.find((d) => d.localId === editingTarget.localId) || null;
  })();

  const isEditingPdf = editingItem?.mimeType === 'application/pdf';

  const groupZonesByPage = (zones: BlurZone[]) => {
    const byPage = new Map<number, BlurZone[]>();
    for (const zone of zones) {
      const page = zone.page ?? 0;
      if (!byPage.has(page)) byPage.set(page, []);
      byPage.get(page)!.push({ x: zone.x, y: zone.y, width: zone.width, height: zone.height } as BlurZone);
    }
    return Array.from(byPage.entries()).map(([page, zs]) => ({ page, zones: zs }));
  };

  const updateEditingZones = (zones: BlurZone[]) => {
    if (!editingTarget) return;
    if (editingTarget.kind === 'photo') {
      onPhotosChange(photos.map((p) => (p.localId === editingTarget.localId ? { ...p, blurZones: zones } : p)));
    } else if (editingTarget.kind === 'expertReport') {
      if (expertReport) onExpertReportChange({ ...expertReport, blurZones: zones });
    } else {
      onAdditionalDocumentsChange(additionalDocuments.map((d) => (d.localId === editingTarget.localId ? { ...d, blurZones: zones } : d)));
    }
  };

  const applyBlurToEditingItem = async () => {
    if (!editingTarget || !editingItem) return;
    setApplyingBlur(true);
    setError('');
    try {
      const res = isEditingPdf
        ? await apiRequest('/vehicle-dossiers/media/pdf-blur', {
            method: 'POST',
            body: JSON.stringify({ pdfUrl: editingItem.originalUrl, pagesZones: groupZonesByPage(editingItem.blurZones) }),
          })
        : await apiRequest('/vehicle-dossiers/media/blur', {
            method: 'POST',
            body: JSON.stringify({ imageUrl: editingItem.originalUrl, zones: editingItem.blurZones }),
          });
      if (editingTarget.kind === 'photo') {
        onPhotosChange(photos.map((p) => (p.localId === editingTarget.localId ? { ...p, processedUrl: res.url } : p)));
      } else if (editingTarget.kind === 'expertReport') {
        if (expertReport) onExpertReportChange({ ...expertReport, processedUrl: res.url });
      } else {
        onAdditionalDocumentsChange(additionalDocuments.map((d) => (d.localId === editingTarget.localId ? { ...d, processedUrl: res.url } : d)));
      }
      setEditingTarget(null);
    } catch (err: any) {
      setError(err.message || t('vehicleDossier.blurApplyError'));
    } finally {
      setApplyingBlur(false);
    }
  };

  const carteGriseComplete = Boolean(carteGriseRecto && carteGriseVerso);

  return (
    <div className="max-w-[900px] w-full">
      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {/* 1. Section Photo de Couverture */}
      <div className="hidden">
        <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#4c5058] mb-1.5">
          Photo de couverture
        </div>
        <p className="font-normal text-[12px] text-[#5a5e66] mb-3">
          Photo principale affichée sur la carte du véhicule lors des ventes et enchères.
        </p>

        <div className="w-full max-w-[500px]">
          <div
            className={`relative aspect-[16/9] border-[1.5px] border-dashed rounded-[12px] flex flex-col items-center justify-center p-3 text-center transition-all overflow-hidden ${
              coverPhoto
                ? 'border-[#bcd8c8] bg-[#f2f8f4]'
                : 'border-[#d3ccbd] bg-[#fbfaf7] hover:border-[#8a8270]'
            }`}
          >
            {coverPhoto ? (
              <div className="relative w-full h-full rounded-[8px] overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPhoto.processedUrl || coverPhoto.originalUrl}
                  alt="Photo de couverture"
                  className="w-full h-full object-cover"
                />
                {coverPhoto.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[12px] font-semibold">
                    <Spinner />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-[#2f6f4f] text-white font-bold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full shadow">
                  COUVERTURE
                </div>
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2f6f4f] text-white font-bold text-[11px] leading-5 text-center shadow">
                  ✓
                </div>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2 text-white">
                  <button
                    type="button"
                    onClick={() => setCroppingImageSrc(coverPhoto.originalUrl)}
                    className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-[12px] font-semibold"
                  >
                    Recadrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTarget({ kind: 'photo', localId: coverPhoto.localId })}
                    className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-[12px] font-semibold"
                  >
                    Flouter
                  </button>
                  <label className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-[12px] font-semibold cursor-pointer">
                    Remplacer
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileSelected}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={removeCoverPhoto}
                    className="px-2.5 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-md text-[12px] font-semibold"
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center gap-2.5 cursor-pointer p-4 group">
                <div className="w-12 h-12 rounded-full bg-white border border-[#e2ddd1] flex items-center justify-center text-[#13243c] shadow-sm group-hover:scale-105 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 16L8.58579 11.4142C9.36683 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="#13243c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="font-bold text-[13px] text-[#13243c]">
                  Ajouter la photo de couverture
                </div>
                <div className="font-normal text-[11px] text-[#5a5e66]">
                  Glissez un fichier ou cliquez pour parcourir et cadrer en 16:9
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileSelected}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* 2. Section Photos du Véhicule */}
      <div className="mb-8">
        <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#4c5058] mb-3">
          Photos du véhicule
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 mb-4">
          {STANDARD_SLOTS.map((slot, index) => {
            const photo = photos[index];
            const hasPhoto = Boolean(photo && (photo.originalUrl || photo.processedUrl));

            return (
              <div
                key={slot.id}
                className={`relative aspect-[4/3] border-[1.5px] border-dashed rounded-[10px] flex flex-col items-center justify-center p-3 text-center transition-all ${
                  hasPhoto
                    ? 'border-[#bcd8c8] bg-[#f2f8f4]'
                    : 'border-[#d3ccbd] bg-[#fbfaf7] hover:border-[#8a8270]'
                }`}
              >
                {hasPhoto && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2f6f4f] text-white font-bold text-[11px] leading-5 text-center shadow z-10">
                    ✓
                  </div>
                )}
                {hasPhoto && index === 0 && (
                  <div className="absolute top-2 left-2 z-10 rounded-full bg-[#2f6f4f] px-2 py-1 text-[9px] font-bold uppercase text-white shadow">Couverture</div>
                )}

                {hasPhoto ? (
                  <div className="relative w-full h-full rounded-[6px] overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.processedUrl || photo.originalUrl}
                      alt={slot.label}
                      className="w-full h-full object-cover"
                    />
                    {photo.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[12px] font-semibold">
                        <Spinner />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity p-2 text-white">
                      <div className="font-semibold text-[12px] truncate w-full text-center">{slot.label}</div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTarget({ kind: 'photo', localId: photo.localId })}
                          className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px] font-semibold"
                        >
                          Flouter
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlotPhoto(photo.localId)}
                          className="px-2 py-1 bg-red-600/80 hover:bg-red-700 rounded text-[11px] font-semibold"
                        >
                          Suppr.
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer p-1.5 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slot.icon}
                      alt={slot.label}
                      className="w-20 h-20 sm:w-24 sm:h-24 max-h-[72px] sm:max-h-[84px] object-contain transition-transform group-hover:scale-105"
                    />
                    <span className="font-semibold text-[12px] leading-tight text-[#5a5e66] text-center">
                      {slot.label}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSlotUpload(e, index)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {photos.length > STANDARD_SLOTS.length && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 mb-4">
            {photos.slice(STANDARD_SLOTS.length).map((photo, offset) => (
              <div key={photo.localId} className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-[#eceadf] bg-[#f2f8f4] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.processedUrl || photo.originalUrl} alt={`Photo supplémentaire ${offset + 1}`} className="h-full w-full object-cover" />
                {photo.uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white"><Spinner /></div>}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100">
                  <button type="button" onClick={() => setEditingTarget({ kind: 'photo', localId: photo.localId })} className="rounded bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">Flouter</button>
                  <button type="button" onClick={() => removeSlotPhoto(photo.localId)} className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Suppr.</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload custom photos if needed */}
        {photos.length < 20 && (
          <div className="flex justify-end mb-4">
            <label className="px-4 py-2 bg-white border border-[#dcd7cb] hover:bg-gray-50 rounded-[9px] text-[12px] font-semibold text-[#13243c] cursor-pointer inline-flex items-center gap-2 transition">
              + Ajouter une photo
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomPhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* 3. Section Documents */}
      <div>
        <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#4c5058] mb-3">
          Documents du véhicule
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Carte grise */}
          <div className="hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="font-semibold text-[14px] leading-snug text-[#13243c]">
                Carte grise
              </div>
              <div
                className={`font-semibold text-[11px] px-2.5 py-1 rounded-full ${
                  carteGriseComplete
                    ? 'bg-[#e9f4ee] text-[#2f6f4f]'
                    : 'bg-[#fdece4] text-[#d9704f]'
                }`}
              >
                {carteGriseComplete ? 'Ajouté' : 'Requis'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Recto */}
              <div>
                <div className="font-semibold text-[11px] text-[#4c5058] uppercase tracking-[0.04em] mb-1.5">
                  Recto
                </div>

                <label
                  className={`h-[54px] border-[1.5px] border-dashed rounded-[9px] flex items-center gap-2.5 px-3.5 cursor-pointer transition select-none ${
                    carteGriseRecto
                      ? 'border-[#bcd8c8] bg-[#f2f8f4]'
                      : 'border-[#d3ccbd] bg-[#fbfaf7] hover:border-[#8a8270]'
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processCarteGriseFile(file, 'recto');
                  }}
                >
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleCarteGriseInputChange(e, 'recto')}
                    className="hidden"
                    disabled={uploadingRecto}
                  />

                  {uploadingRecto ? (
                    <div className="flex items-center gap-2 text-[#2f6f4f] text-[12px] font-semibold">
                      <Spinner />
                      <span>Téléversement...</span>
                    </div>
                  ) : carteGriseRecto ? (
                    <>
                      <div className="w-7 h-7 rounded-[7px] bg-[#2f6f4f] text-white flex items-center justify-center font-bold text-[13px] shrink-0">
                        ✓
                      </div>
                      <div className="flex-1 font-semibold text-[12px] leading-snug text-[#2f6f4f] truncate">
                        Carte grise (recto)
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={carteGriseRecto.processedUrl || carteGriseRecto.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[11px] text-[#13243c] underline hover:opacity-80 px-1.5 py-1"
                        >
                          Consulter
                        </a>
                        <label className="font-semibold text-[11px] text-[#13243c] border border-[#dcd7cb] rounded-[6px] px-2 py-1 bg-white cursor-pointer hover:bg-gray-50 transition">
                          Remplacer
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => handleCarteGriseInputChange(e, 'recto')}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeCarteGriseSide('recto')}
                          className="font-semibold text-[11px] text-red-600 hover:text-red-800 px-1 py-1"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-[7px] bg-white border border-[#e2ddd1] flex items-center justify-center font-bold text-[13px] text-[#5a5e66] shrink-0">
                        ↑
                      </div>
                      <div className="flex-1 font-medium text-[12px] leading-snug text-[#5a5e66] truncate">
                        Glissez un fichier ou cliquez pour parcourir
                      </div>
                      <span className="font-semibold text-[12px] text-[#13243c] border border-[#dcd7cb] rounded-[7px] px-3 py-1.5 bg-white hover:bg-gray-50 transition shrink-0">
                        Parcourir
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Verso */}
              <div>
                <div className="font-semibold text-[11px] text-[#4c5058] uppercase tracking-[0.04em] mb-1.5">
                  Verso
                </div>

                <label
                  className={`h-[54px] border-[1.5px] border-dashed rounded-[9px] flex items-center gap-2.5 px-3.5 cursor-pointer transition select-none ${
                    carteGriseVerso
                      ? 'border-[#bcd8c8] bg-[#f2f8f4]'
                      : 'border-[#d3ccbd] bg-[#fbfaf7] hover:border-[#8a8270]'
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processCarteGriseFile(file, 'verso');
                  }}
                >
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleCarteGriseInputChange(e, 'verso')}
                    className="hidden"
                    disabled={uploadingVerso}
                  />

                  {uploadingVerso ? (
                    <div className="flex items-center gap-2 text-[#2f6f4f] text-[12px] font-semibold">
                      <Spinner />
                      <span>Téléversement...</span>
                    </div>
                  ) : carteGriseVerso ? (
                    <>
                      <div className="w-7 h-7 rounded-[7px] bg-[#2f6f4f] text-white flex items-center justify-center font-bold text-[13px] shrink-0">
                        ✓
                      </div>
                      <div className="flex-1 font-semibold text-[12px] leading-snug text-[#2f6f4f] truncate">
                        Carte grise (verso)
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={carteGriseVerso.processedUrl || carteGriseVerso.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[11px] text-[#13243c] underline hover:opacity-80 px-1.5 py-1"
                        >
                          Consulter
                        </a>
                        <label className="font-semibold text-[11px] text-[#13243c] border border-[#dcd7cb] rounded-[6px] px-2 py-1 bg-white cursor-pointer hover:bg-gray-50 transition">
                          Remplacer
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => handleCarteGriseInputChange(e, 'verso')}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeCarteGriseSide('verso')}
                          className="font-semibold text-[11px] text-red-600 hover:text-red-800 px-1 py-1"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-[7px] bg-white border border-[#e2ddd1] flex items-center justify-center font-bold text-[13px] text-[#5a5e66] shrink-0">
                        ↑
                      </div>
                      <div className="flex-1 font-medium text-[12px] leading-snug text-[#5a5e66] truncate">
                        Glissez un fichier ou cliquez pour parcourir
                      </div>
                      <span className="font-semibold text-[12px] text-[#13243c] border border-[#dcd7cb] rounded-[7px] px-3 py-1.5 bg-white hover:bg-gray-50 transition shrink-0">
                        Parcourir
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="font-normal text-[12px] leading-relaxed text-[#5a5e66] mt-2">
              Recto et verso · original ou certificat de cession
            </div>
          </div>

          {/* Rapport d'expertise sinistre */}
          <div className="border border-[#eceadf] rounded-[12px] p-4 sm:p-4.5 bg-white">
            <div className="flex items-center justify-between mb-2.5">
              <div className="font-semibold text-[14px] leading-snug text-[#13243c]">
                Rapport d'expertise sinistre
              </div>
              <div
                className={`font-semibold text-[11px] px-2.5 py-1 rounded-full ${
                  expertReport ? 'bg-[#e9f4ee] text-[#2f6f4f]' : 'bg-[#fdece4] text-[#d9704f]'
                }`}
              >
                {expertReport ? 'Ajouté' : 'Optionnel'}
              </div>
            </div>

            <label
              className={`h-[54px] border-[1.5px] border-dashed rounded-[9px] flex items-center gap-3 px-3.5 cursor-pointer transition select-none ${
                expertReport
                  ? 'border-[#bcd8c8] bg-[#f2f8f4]'
                  : 'border-[#d3ccbd] bg-[#fbfaf7] hover:border-[#8a8270]'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) processExpertReportFile(file);
              }}
            >
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleExpertReportInputChange}
                className="hidden"
                disabled={uploadingExpert}
              />

              {uploadingExpert ? (
                <div className="flex items-center gap-2 text-[#2f6f4f] text-[13px] font-semibold">
                  <Spinner />
                  <span>Téléversement du rapport d'expertise...</span>
                </div>
              ) : expertReport ? (
                <>
                  <div className="w-7.5 h-7.5 rounded-[7px] bg-[#2f6f4f] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
                    ✓
                  </div>
                  <div className="flex-1 font-semibold text-[13px] leading-snug text-[#2f6f4f] truncate">
                    {expertReport.label || "Rapport d'expertise"}
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={expertReport.processedUrl || expertReport.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[12px] text-[#13243c] underline hover:opacity-80 px-1 py-1"
                    >
                      Consulter
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditingTarget({ kind: 'expertReport' })}
                      className="font-semibold text-[12px] text-[#13243c] border border-[#dcd7cb] rounded-[7px] px-3 py-1.5 bg-white hover:bg-gray-50 transition"
                    >
                      Flouter
                    </button>
                    <label className="font-semibold text-[12px] text-[#13243c] border border-[#dcd7cb] rounded-[7px] px-3 py-1.5 bg-white cursor-pointer hover:bg-gray-50 transition">
                      Remplacer
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={handleExpertReportInputChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={removeExpertReport}
                      className="font-semibold text-[12px] text-red-600 hover:text-red-800 px-1.5 py-1"
                    >
                      Suppr.
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-7.5 h-7.5 rounded-[7px] bg-white border border-[#e2ddd1] flex items-center justify-center font-bold text-[14px] text-[#5a5e66] shrink-0">
                    ↑
                  </div>
                  <div className="flex-1 font-medium text-[13px] leading-snug text-[#5a5e66] truncate">
                    Glissez un fichier PDF ou cliquez pour parcourir
                  </div>
                  <span className="font-semibold text-[12px] text-[#13243c] border border-[#dcd7cb] rounded-[7px] px-3.5 py-1.5 bg-white hover:bg-gray-50 transition shrink-0">
                    Parcourir
                  </span>
                </>
              )}
            </label>

            <div className="font-normal text-[12px] leading-relaxed text-[#5a5e66] mt-2">
              Optionnel, mais fortement recommandé · PDF ou image
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 16:9 Image Cropper Modal */}
      {croppingImageSrc && (
        <ImageCropEditor
          imageSrc={croppingImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => { setCroppingImageSrc(null); setCropTargetIndex(null); }}
        />
      )}

      {/* Blur Zone Editor Modal */}
      {editingTarget && editingItem && (
        <BlurZoneEditor
          imageUrl={editingItem.originalUrl}
          mimeType={editingItem.mimeType}
          zones={editingItem.blurZones}
          onZonesChange={updateEditingZones}
          onValidate={applyBlurToEditingItem}
          validating={applyingBlur}
          onClose={() => setEditingTarget(null)}
        />
      )}
    </div>
  );
}
