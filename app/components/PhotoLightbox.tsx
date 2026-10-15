'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n';

export interface LightboxPhoto {
  id: string;
  url: string;
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  /** Index de la photo affichée, ou null quand la visionneuse est fermée */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  alt: string;
}

const SWIPE_THRESHOLD_PX = 45;

export default function PhotoLightbox({ photos, index, onIndexChange, onClose, alt }: PhotoLightboxProps) {
  const { t } = useLanguage();
  const touchStartX = useRef<number | null>(null);
  // Identifiant de la dernière photo affichée : évite le flash de l'image précédente pendant
  // le chargement de la suivante, sans effet de bord au changement d'index.
  const [loadedPhotoId, setLoadedPhotoId] = useState<string | null>(null);
  // Zoom : photo actuellement agrandie et point sous le curseur (en %). Lié à l'identifiant de la
  // photo, il retombe de lui-même quand on passe à une autre photo.
  const [zoomedPhotoId, setZoomedPhotoId] = useState<string | null>(null);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  const isOpen = index !== null && photos.length > 0;

  // Le défilement boucle : après la dernière photo on revient à la première, et inversement.
  const goTo = useCallback((offset: number) => {
    if (index === null || photos.length === 0) return;
    onIndexChange((index + offset + photos.length) % photos.length);
  }, [index, onIndexChange, photos.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight') goTo(1);
      else if (event.key === 'ArrowLeft') goTo(-1);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goTo, isOpen, onClose]);

  // Visionneuse fermée (par n'importe quel moyen, Échap compris) : plus aucun zoom à la réouverture
  if (!isOpen && zoomedPhotoId !== null) setZoomedPhotoId(null);

  if (!isOpen) return null;

  const current = photos[index];
  if (!current) return null;

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    // Photo agrandie : le geste sert à la déplacer, pas à changer de photo
    if (zoomedPhotoId === current.id) return;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) goTo(deltaX < 0 ? 1 : -1);
  };

  const isZoomed = zoomedPhotoId === current.id;
  const pointOnImage = (clientX: number, clientY: number) => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 50, y: 50 };
    return {
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  };
  // Clic sur la photo : loupe + / loupe − ; l'agrandissement part du point cliqué
  const toggleZoom = (event: React.MouseEvent) => {
    if (isZoomed) {
      setZoomedPhotoId(null);
      return;
    }
    setZoomOrigin(pointOnImage(event.clientX, event.clientY));
    setZoomedPhotoId(current.id);
  };
  // Photo agrandie : le déplacement du curseur fait glisser la photo pour en explorer chaque zone
  const panZoom = (event: React.MouseEvent) => {
    if (isZoomed) setZoomOrigin(pointOnImage(event.clientX, event.clientY));
  };
  const close = () => {
    setZoomedPhotoId(null);
    onClose();
  };


  return (
    <div
      className="fixed inset-0 z-100 flex flex-col bg-[rgba(8,15,27,.96)]"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onTouchStart={(event) => { touchStartX.current = event.changedTouches[0].clientX; }}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
        <span className="font-mono text-sm font-bold text-white">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={close}
          aria-label={t('vehicle.closeGallery')}
          className="flex h-10 w-10 items-center justify-center rounded-[9px] border border-white/25 text-xl leading-none text-white transition hover:bg-white/10 cursor-pointer"
        >
          ×
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 pb-2 sm:px-16"
        onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          ref={imageRef}
          src={current.url}
          alt={alt}
          onLoad={() => setLoadedPhotoId(current.id)}
          onClick={toggleZoom}
          onMouseMove={panZoom}
          draggable={false}
          style={isZoomed ? { transform: 'scale(2.5)', transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` } : undefined}
          className={`max-h-full max-w-full select-none object-contain transition-[opacity,transform] duration-200 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'} ${loadedPhotoId === current.id ? 'opacity-100' : 'opacity-0'}`}
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label={t('vehicle.previousPhoto')}
              className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl leading-none text-white backdrop-blur-xs transition hover:bg-black/70 sm:left-4 cursor-pointer"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label={t('vehicle.nextPhoto')}
              className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl leading-none text-white backdrop-blur-xs transition hover:bg-black/70 sm:right-4 cursor-pointer"
            >
              ›
            </button>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="shrink-0 overflow-x-auto px-4 pb-4 sm:px-6">
          <div className="flex gap-2">
            {photos.map((photo, photoIndex) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => onIndexChange(photoIndex)}
                className={`h-14 w-20 shrink-0 overflow-hidden rounded-[7px] border-2 transition cursor-pointer ${
                  photoIndex === index ? 'border-[#e2a175]' : 'border-transparent opacity-55 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-full w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
