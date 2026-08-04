'use client';

import React, { useRef, useState, useEffect } from 'react';

interface ImageCropEditorProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
  onClose: () => void;
}

export default function ImageCropEditor({ imageSrc, onCropComplete, onClose }: ImageCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [displayedSize, setDisplayedSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Crop frame in percentage coordinates (0..1)
  // Default to 4:3 ratio centered
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.6,
  });

  const [dragging, setDragging] = useState<{ isMoving: boolean; handle?: string; startX: number; startY: number; initialCrop: typeof crop } | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalSize({ width: nw, height: nh });

    const dw = img.clientWidth;
    const dh = img.clientHeight;
    setDisplayedSize({ width: dw, height: dh });

    // Initial 4:3 crop box calculation
    const targetAspect = 4 / 3;

    let cropW = 0.85;
    let cropH = (cropW * dw) / targetAspect / dh;

    if (cropH > 0.85) {
      cropH = 0.85;
      cropW = (cropH * dh * targetAspect) / dw;
    }

    const cropX = (1 - cropW) / 2;
    const cropY = (1 - cropH) / 2;

    setCrop({ x: cropX, y: cropY, width: cropW, height: cropH });
    setImgLoaded(true);
  };

  // Recalculate displayed dimensions on window resize
  useEffect(() => {
    const updateSize = () => {
      if (imgRef.current) {
        setDisplayedSize({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, handle?: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragging({
      isMoving: !handle,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !displayedSize.width || !displayedSize.height) return;

    const dx = (e.clientX - dragging.startX) / displayedSize.width;
    const dy = (e.clientY - dragging.startY) / displayedSize.height;
    const targetAspect = (4 / 3) * (displayedSize.height / displayedSize.width);

    let { x, y, width, height } = dragging.initialCrop;

    if (dragging.isMoving) {
      x = Math.max(0, Math.min(1 - width, x + dx));
      y = Math.max(0, Math.min(1 - height, y + dy));
    } else if (dragging.handle) {
      if (dragging.handle === 'se') {
        width = Math.max(0.2, Math.min(1 - x, width + dx));
        height = width / targetAspect;
        if (y + height > 1) {
          height = 1 - y;
          width = height * targetAspect;
        }
      } else if (dragging.handle === 'sw') {
        const newW = Math.max(0.2, Math.min(x + width, width - dx));
        x = x + (width - newW);
        width = newW;
        height = width / targetAspect;
        if (y + height > 1) {
          height = 1 - y;
          width = height * targetAspect;
        }
      } else if (dragging.handle === 'ne') {
        width = Math.max(0.2, Math.min(1 - x, width + dx));
        height = width / targetAspect;
        const newY = y - (height - dragging.initialCrop.height);
        if (newY >= 0) {
          y = newY;
        }
      } else if (dragging.handle === 'nw') {
        const newW = Math.max(0.2, Math.min(x + width, width - dx));
        x = x + (width - newW);
        width = newW;
        height = width / targetAspect;
        const newY = y - (height - dragging.initialCrop.height);
        if (newY >= 0) {
          y = newY;
        }
      }
    }

    setCrop({ x, y, width, height });
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  const handleConfirmCrop = () => {
    if (!imgRef.current || !naturalSize.width || !naturalSize.height) return;

    const canvas = document.createElement('canvas');
    const targetW = 1200;
    const targetH = 900;
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceX = crop.x * naturalSize.width;
    const sourceY = crop.y * naturalSize.height;
    const sourceWidth = crop.width * naturalSize.width;
    const sourceHeight = crop.height * naturalSize.height;

    ctx.drawImage(
      imgRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetW,
      targetH
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          onCropComplete(blob, previewUrl);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/75 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-[840px] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#efece3]">
          <div>
            <h3 className="text-[18px] font-bold font-heading uppercase text-[#13243c]">
              Recadrer la photo
            </h3>
            <p className="text-[12px] text-[#4c5058] mt-0.5">
              Déplacez et ajustez le cadre pour définir la zone d'affichage (format 4:3).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#4c5058] hover:text-[#13243c] text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>

        {/* Cropper Container */}
        <div className="p-4 sm:p-6 bg-[#0f1926] flex items-center justify-center min-h-[380px] max-h-[550px] overflow-hidden select-none">
          <div
            ref={containerRef}
            className="relative touch-none inline-block max-w-full max-h-[500px]"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={handleImageLoad}
              draggable={false}
              className="max-w-full max-h-[480px] object-contain block mx-auto pointer-events-none"
            />

            {imgLoaded && (
              <>
                {/* Dark Overlay around crop box */}
                <div
                  className="absolute inset-0 bg-black/60 pointer-events-none"
                  style={{
                    clipPath: `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                      ${crop.x * 100}% ${crop.y * 100}%,
                      ${crop.x * 100}% ${(crop.y + crop.height) * 100}%,
                      ${(crop.x + crop.width) * 100}% ${(crop.y + crop.height) * 100}%,
                      ${(crop.x + crop.width) * 100}% ${crop.y * 100}%,
                      ${crop.x * 100}% ${crop.y * 100}%
                    )`,
                  }}
                />

                {/* 4:3 Crop Selection Box */}
                <div
                  className="absolute border-2 border-[#d9704f] cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.width * 100}%`,
                    height: `${crop.height * 100}%`,
                  }}
                  onPointerDown={(e) => handlePointerDown(e)}
                >
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-white/30" />
                    <div className="border-r border-white/30" />
                    <div />
                  </div>

                  {/* Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-[#d9704f] border-2 border-white rounded-full cursor-nwse-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-[#d9704f] border-2 border-white rounded-full cursor-nesw-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#d9704f] border-2 border-white rounded-full cursor-nesw-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#d9704f] border-2 border-white rounded-full cursor-nwse-resize"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#efece3] flex justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 border border-[#dcd7cb] rounded-[9px] text-[#13243c] font-semibold text-[13px] hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            className="h-11 px-6 bg-[#13243c] hover:bg-slate-800 text-white font-bold text-[13px] rounded-[9px] uppercase tracking-[0.03em] transition shadow-sm"
          >
            Valider le recadrage
          </button>
        </div>
      </div>
    </div>
  );
}
