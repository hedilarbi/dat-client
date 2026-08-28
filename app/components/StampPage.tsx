'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { apiRequest } from '../api';
import { useUser } from './LayoutWrapper';
import { getRoleHomePath, getRoleStampPath, localizedPath, useLanguage } from '../i18n';
import Alert from './Alert';
import Spinner from './Spinner';
import DocumentUploadRow from './DocumentUploadRow';
import { UnderReviewNotice } from './RegistrationStatusNotices';
import { compressImageIfNeeded, MAX_UPLOAD_BYTES } from '../lib/imageCompression';
import getCroppedImg from '../lib/cropImage';

export default function StampPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: userLoading, refreshProfile } = useUser();
  const { language, t } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [stampUrl, setStampUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const alertRef = useRef<HTMLDivElement>(null);

  // Cropper states
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Non connecté : renvoi vers la connexion, avec retour sur cette page
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(pathname || getRoleStampPath('acheteur'))}`, language));
    }
  }, [userLoading, user, router, language]);

  useEffect(() => {
    if (user) setStampUrl(user.stampUrl || '');
  }, [user]);

  // L'aperçu local est un blob : il doit être révoqué pour ne pas fuiter
  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileSelection = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = event.target.files?.[0];
    if (!rawFile) return;

    setError('');
    setMessage('');

    const objectUrl = URL.createObjectURL(rawFile);
    setCropSrc(objectUrl);
    setIsCropping(true);
    
    // Reset file input so same file can be selected again
    event.target.value = '';
  }, []);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Provide a default crop covering 80% of the image, centered
    setCrop({
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setCropSrc(null);
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !completedCrop || !imgRef.current) return;

    // react-image-crop gives coordinates based on the DOM element size.
    // getCroppedImg expects coordinates in the original image's natural size.
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const scaledCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    };

    try {
      const croppedFile = await getCroppedImg(cropSrc, scaledCrop);
      if (!croppedFile) throw new Error("Erreur lors du recadrage");

      const compressed = await compressImageIfNeeded(croppedFile);
      if (compressed.size > MAX_UPLOAD_BYTES) {
        setError(t('shared.fileTooLarge', {
          size: (compressed.size / (1024 * 1024)).toFixed(1),
          maxSize: String(MAX_UPLOAD_BYTES / (1024 * 1024)),
        }));
        return;
      }

      setFile(compressed);
      setIsCropping(false);
      setCropSrc(null);
    } catch (e: any) {
      setError(e.message || "Erreur de recadrage");
      setIsCropping(false);
      setCropSrc(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Endpoint dédié : le serveur détoure la photo avant de la stocker
      const response = await fetch('/api/upload/stamp', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const responseText = await response.text();
      let data: any = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(t('stamp.uploadError'));
        }
      }
      if (!response.ok || !data.url) {
        throw new Error(data.message || t('stamp.uploadError'));
      }

      await apiRequest('/auth/me/stamp', {
        method: 'PUT',
        body: JSON.stringify({ stampUrl: data.url }),
      });

      setStampUrl(data.url);
      setFile(null);
      setMessage(data.backgroundRemoved === false ? t('stamp.savedWithoutRemoval') : t('stamp.saved'));
      await refreshProfile();
    } catch (submitError: any) {
      setError(submitError.message || t('stamp.uploadError'));
    } finally {
      setSaving(false);
      alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError('');
    setMessage('');
    try {
      await apiRequest('/auth/me/stamp', {
        method: 'PUT',
        body: JSON.stringify({ stampUrl: '' }),
      });
      setStampUrl('');
      setFile(null);
      setMessage(t('stamp.removed'));
      await refreshProfile();
    } catch (removeError: any) {
      setError(removeError.message || t('stamp.uploadError'));
    } finally {
      setRemoving(false);
    }
  };

  if (userLoading || !user) return null;
  if (user.status !== 'valide') return <UnderReviewNotice />;

  const backPath = getRoleHomePath(user.role);
  const busy = saving || removing;

  return (
    <div className="flex-1 w-full p-6 sm:p-[32px_40px_44px] text-black font-sans bg-white">
      <Link
        href={localizedPath(backPath, language)}
        className="btn-back"
      >
        ← {t('stamp.back')}
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-4">
        <div className="flex-1 max-w-[640px] w-full">
          <div className="mb-7">
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#a3987f] mb-2">
              {user.companyName}
            </div>
            <h1 className="text-[28px] sm:text-[36px] font-bold font-heading uppercase text-[#13243c]">
              {t('stamp.title')}
            </h1>
            <p className="mt-3 text-[13px] leading-[20px] text-[#5a5e66]">
              {t('stamp.intro')}
            </p>
          </div>

          <div ref={alertRef}>
            {error && <Alert variant="error">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <DocumentUploadRow
            label={t('stamp.fieldLabel')}
            accept="image/*"
            file={file}
            existingUrl={stampUrl}
            onChange={handleFileSelection}
            selectedLabel={t('register.selected')}
          />

          {(previewUrl || stampUrl) && (
            <div>
              <div className="text-[12px] font-semibold text-[#4c5058] mb-2">
                {previewUrl ? t('stamp.previewBefore') : t('stamp.previewCurrent')}
              </div>
              {/* Le damier rappelle la transparence du PNG détouré */}
              <div
                className="rounded-[10px] border border-[#dcd7cb] p-4 flex items-center justify-center min-h-[180px]"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg,#eceadf 25%,transparent 25%),linear-gradient(-45deg,#eceadf 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eceadf 75%),linear-gradient(-45deg,transparent 75%,#eceadf 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl || stampUrl}
                  alt={t('stamp.fieldLabel')}
                  className="max-h-[220px] max-w-full object-contain"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={!file || busy}
              className="btn btn-primary disabled:opacity-50 gap-2 px-8"
            >
              {saving && <Spinner />}
              {saving ? t('stamp.saving') : t('stamp.submit')}
            </button>

            {stampUrl && !file && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="btn btn-secondary disabled:opacity-50 gap-2 px-8"
              >
                {removing && <Spinner />}
                {t('stamp.remove')}
              </button>
            )}
          </div>
        </form>
        </div>

        <aside className="w-full lg:w-[380px] self-start border-2 border-[#13243c] bg-[#fdfcfa] rounded-[16px] overflow-hidden shadow-[0_8px_30px_rgba(19,36,60,0.08)]">
          <div className="bg-[#13243c] p-4">
            <h3 className="font-heading text-[18px] font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#d9704f]">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              Conseils importants
            </h3>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e9f4ee] flex items-center justify-center text-[#2f6f4f] shrink-0 font-bold">1</div>
              <p className="text-[14px] leading-[22px] text-[#13243c] pt-1">
                <strong className="text-[#2f6f4f]">Feuille blanche :</strong> Tamponnez sur une feuille entièrement blanche, sans lignes ni carreaux.
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fdece4] flex items-center justify-center text-[#d9704f] shrink-0 font-bold">2</div>
              <p className="text-[14px] leading-[22px] text-[#13243c] pt-1">
                <strong className="text-[#d9704f]">Bonne lumière :</strong> Prenez la photo dans un endroit bien éclairé pour éviter les ombres grisâtres.
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e8effa] flex items-center justify-center text-[#2563eb] shrink-0 font-bold">3</div>
              <p className="text-[14px] leading-[22px] text-[#13243c] pt-1">
                <strong className="text-[#2563eb]">Cadrage :</strong> Le système supprimera automatiquement le fond blanc. Utilisez l'outil de recadrage pour ajuster au plus près de votre tampon.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {isCropping && cropSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#13243c]/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white rounded-[16px] overflow-hidden flex flex-col h-[90vh] shadow-2xl">
            <div className="px-6 py-4 border-b border-[#eceadf] flex justify-between items-center bg-[#fbfaf7]">
              <h3 className="font-heading text-[20px] font-bold text-[#13243c] uppercase">Recadrer le tampon</h3>
              <button onClick={handleCropCancel} className="text-[#5a5e66] hover:text-[#13243c] font-bold text-xl leading-none">
                &times;
              </button>
            </div>
            
            {/* The crop area */}
            <div className="flex-1 bg-black/10 overflow-auto flex items-center justify-center p-4">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={cropSrc}
                  onLoad={onImageLoad}
                  alt="Crop"
                  style={{ maxHeight: 'calc(90vh - 140px)', width: 'auto' }}
                  className="max-w-full"
                />
              </ReactCrop>
            </div>
            
            <div className="px-6 py-5 border-t border-[#eceadf] bg-white flex flex-col sm:flex-row items-center justify-end gap-4">
              <button type="button" onClick={handleCropCancel} className="btn border border-[#eceadf] text-[#5a5e66] hover:bg-[#fbfaf7] flex-1 sm:flex-none justify-center">
                Annuler
              </button>
              <button type="button" onClick={handleCropConfirm} className="btn btn-primary flex-1 sm:flex-none justify-center px-8">
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
