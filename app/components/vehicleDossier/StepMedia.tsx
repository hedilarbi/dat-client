'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../i18n';
import { apiRequest } from '../../api';
import { uploadFile } from '../../lib/uploadFile';
import Alert from '../Alert';
import Spinner from '../Spinner';
import PhotoTile from './PhotoTile';
import BlurZoneEditor from './BlurZoneEditor';
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

export default function StepMedia({
  photos, onPhotosChange, expertReport, onExpertReportChange, additionalDocuments, onAdditionalDocumentsChange,
  onNext, onBack, onSaveDraft, savingDraft
}: StepMediaProps) {
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);
  const [applyingBlur, setApplyingBlur] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const handlePhotosSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setError('');

    const placeholders: WizardPhoto[] = files.map((file, i) => ({
      localId: makeLocalId(),
      originalUrl: URL.createObjectURL(file),
      blurZones: [],
      isCover: photos.length === 0 && i === 0,
      uploading: true,
    }));
    onPhotosChange([...photos, ...placeholders]);

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile(files[i], 'vehicules/photos');
        onPhotosChange((prev: WizardPhoto[]) =>
          prev.map((p) => (p.localId === placeholders[i].localId ? { ...p, originalUrl: url, uploading: false } : p))
        );
      } catch (err: any) {
        setError(err.message || t('vehicleDossier.uploadError'));
        onPhotosChange((prev: WizardPhoto[]) => prev.filter((p) => p.localId !== placeholders[i].localId));
      }
    }
  };

  const setCover = (localId: string) => {
    onPhotosChange(photos.map((p) => ({ ...p, isCover: p.localId === localId })));
  };

  const moveTo = (localId: string, direction: -1 | 1) => {
    const index = photos.findIndex((p) => p.localId === localId);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= photos.length) return;
    const next = [...photos];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    onPhotosChange(next);
  };

  const removePhoto = (localId: string) => {
    onPhotosChange(photos.filter((p) => p.localId !== localId));
  };

  const handleDocumentSelected = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'expertReport' | 'additional') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploadingDocument(true);

    try {
      const url = await uploadFile(file, 'vehicules/documents');
      const doc: WizardDocument = {
        localId: makeLocalId(),
        type: kind === 'expertReport' ? 'rapport_expert' : 'complementaire',
        originalUrl: url,
        mimeType: file.type,
        blurZones: [],
        label: file.name,
        uploading: false,
      };
      if (kind === 'expertReport') {
        onExpertReportChange(doc);
      } else {
        onAdditionalDocumentsChange([...additionalDocuments, doc]);
      }
    } catch (err: any) {
      setError(err.message || t('vehicleDossier.uploadError'));
    } finally {
      setUploadingDocument(false);
    }
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

  return (
    <div className="p-6 sm:p-9 lg:p-[36px_48px_40px] space-y-10">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-[#13243c] uppercase tracking-wider">{t('vehicleDossier.photosTitle')}</h3>
          <label className="h-10 px-5 flex items-center bg-[#13243c] hover:bg-slate-800 text-white text-[12px] font-bold uppercase tracking-[0.03em] rounded-[9px] cursor-pointer transition">
            {t('vehicleDossier.addPhoto')}
            <input type="file" accept="image/*" multiple onChange={handlePhotosSelected} className="hidden" />
          </label>
        </div>

        {photos.length === 0 ? (
          <div className="bg-[#fbfaf7] border border-dashed border-[#dcd7cb] rounded-[10px] p-8 text-center text-[13px] text-[#9a917d]">
            {t('vehicleDossier.noPhotos')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <PhotoTile
                key={photo.localId}
                photo={photo}
                index={index}
                total={photos.length}
                onSetCover={() => setCover(photo.localId)}
                onMoveUp={() => moveTo(photo.localId, -1)}
                onMoveDown={() => moveTo(photo.localId, 1)}
                onRemove={() => removePhoto(photo.localId)}
                onEditBlur={() => setEditingTarget({ kind: 'photo', localId: photo.localId })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div>
        <h3 className="text-[14px] font-bold text-[#13243c] uppercase tracking-wider mb-4">{t('vehicleDossier.documentsTitle')}</h3>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-semibold text-[#13243c]">{t('vehicleDossier.expertReport')}</span>
            {expertReport && (
              <span className="text-[11px] font-semibold bg-[#e9f4ee] text-[#2f6f4f] px-[11px] py-1 rounded-full">✓</span>
            )}
          </div>
          <div className={`h-[54px] rounded-[9px] border-2 border-dashed flex items-center justify-between px-4 transition ${expertReport ? 'border-[#bcd8c8] bg-[#f2f8f4]' : 'border-[#d3ccbd] bg-[#fbfaf7]'}`}>
            <span className={`text-[13px] font-semibold truncate max-w-[60%] ${expertReport ? 'text-[#2f6f4f]' : 'text-[#9a917d]'}`}>
              {expertReport?.label || t('vehicleDossier.expertReportHint')}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {(expertReport?.mimeType?.startsWith('image/') || expertReport?.mimeType === 'application/pdf') && (
                <button
                  type="button"
                  onClick={() => setEditingTarget({ kind: 'expertReport' })}
                  className="text-[12px] font-semibold text-[#13243c] border border-[#dcd7cb] rounded-[7px] p-[8px_12px] bg-white hover:bg-gray-50"
                >
                  {t('vehicleDossier.blurEdit')}
                </button>
              )}
              <label className="text-[12px] font-semibold text-[#13243c] border border-[#dcd7cb] rounded-[7px] p-[8px_14px] bg-white cursor-pointer hover:bg-gray-50">
                {expertReport ? t('documentUpload.replace') : t('documentUpload.browse')}
                <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentSelected(e, 'expertReport')} className="hidden" disabled={uploadingDocument} />
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[#13243c]">{t('vehicleDossier.additionalDocuments')}</span>
            <label className="text-[12px] font-semibold text-[#13243c] border border-[#dcd7cb] rounded-[7px] p-[8px_14px] bg-white cursor-pointer hover:bg-gray-50">
              {uploadingDocument ? <Spinner /> : t('vehicleDossier.addDocument')}
              <input type="file" accept="application/pdf,image/*" onChange={(e) => handleDocumentSelected(e, 'additional')} className="hidden" disabled={uploadingDocument} />
            </label>
          </div>
          {additionalDocuments.length > 0 && (
            <div className="space-y-2">
              {additionalDocuments.map((doc) => (
                <div key={doc.localId} className="h-[54px] rounded-[9px] border-2 border-dashed border-[#bcd8c8] bg-[#f2f8f4] flex items-center justify-between px-4">
                  <span className="text-[13px] font-semibold text-[#2f6f4f] truncate max-w-[50%]">{doc.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {(doc.mimeType.startsWith('image/') || doc.mimeType === 'application/pdf') && (
                      <button
                        type="button"
                        onClick={() => setEditingTarget({ kind: 'document', localId: doc.localId })}
                        className="text-[12px] font-semibold text-[#13243c] border border-[#dcd7cb] rounded-[7px] p-[8px_12px] bg-white hover:bg-gray-50"
                      >
                        {t('vehicleDossier.blurEdit')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onAdditionalDocumentsChange(additionalDocuments.filter((d) => d.localId !== doc.localId))}
                      className="text-[12px] font-semibold text-[#b3261e] border border-[#dcd7cb] rounded-[7px] p-[8px_12px] bg-white hover:bg-red-50"
                    >
                      {t('vehicleDossier.removeDocument')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-[#efece3] flex justify-between items-center gap-3 flex-wrap">
        <div className="flex gap-3">
          <button type="button" onClick={onBack} className="h-12 px-6 border border-[#dcd7cb] rounded-[9px] text-[#13243c] font-semibold hover:bg-gray-50 transition">
            {t('vehicleDossier.back')}
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={savingDraft}
            className="h-12 px-6 border border-[#dcd7cb] rounded-[9px] text-[#13243c] font-semibold hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
          >
            {savingDraft && <Spinner />}
            {t('vehicleDossier.saveDraft')}
          </button>
        </div>
        <button type="button" onClick={onNext} className="h-12 px-8 bg-[#13243c] hover:bg-slate-800 text-white font-bold rounded-[9px] uppercase tracking-[0.03em] transition">
          {t('vehicleDossier.continue')}
        </button>
      </div>

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
