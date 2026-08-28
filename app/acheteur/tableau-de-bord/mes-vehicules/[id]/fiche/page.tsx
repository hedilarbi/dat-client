'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '../../../../../api';
import { localizedPath, useLanguage } from '../../../../../i18n';
import PhotoLightbox from '../../../../../components/PhotoLightbox';
import { energyLabel, gearboxLabel } from '../../../../../lib/vehicleLabels';

interface VehiclePhoto {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
  width: number | null;
  height: number | null;
}

interface VehicleDossier {
  _id: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  engine: string;
  fuelType: string;
  energyLabel: string;
  co2: string;
  firstRegistrationDate: string;
  vehicleGenre: string;
  fiscalPower: string;
  bodyType: string;
  gearbox: string;
  passengerCount: string;
  doorCount: string;
  color: string;
  vrade: string;
  procedure: string;
  registrationCardAvailable: boolean | null;
  identificationSheetAvailable: boolean | null;
  description: string;
  conditionDetails: string;
  listingCount: number;
  photos: VehiclePhoto[];
}

export default function WonVehicleSheetPage() {
  const params = useParams<{ id: string }>();
  const { language, t } = useLanguage();

  const [vehicle, setVehicle] = useState<VehicleDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest(`/sales/${params.id}/vehicle`)
      .then((res: { vehicle: VehicleDossier }) => {
        if (!cancelled && res.vehicle) {
          const raw = res.vehicle;
          const photos: VehiclePhoto[] = (raw.photos || [])
            .map((photo: any) => ({
              id: String(photo.id || photo._id || ''),
              url: photo.url || photo.processedUrl || photo.originalUrl || '',
              isCover: Boolean(photo.isCover),
              order: photo.order ?? 0,
              width: photo.width ?? null,
              height: photo.height ?? null,
            }))
            .filter((photo) => photo.url)
            .sort((a, b) => (Number(b.isCover) - Number(a.isCover)) || (a.order - b.order));

          setVehicle({
            ...raw,
            photos,
          });
        }
      })
      .catch(() => { if (!cancelled) setError(t('vehicle.notFound') || 'Véhicule introuvable'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id, t]);

  const router = useRouter();
  const backLink = (
    <button type="button" onClick={() => router.back()} className="text-[13px] font-bold text-[#d9704f] hover:underline flex items-center gap-1 cursor-pointer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      Retour
    </button>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 py-16 text-center text-sm text-[#5a5e66] sm:px-10">
        {t('vehicle.loading') || 'Chargement...'}
      </main>
    );
  }

  if (error || !vehicle) {
    return (
      <main className="min-h-screen bg-white px-4 py-16 sm:px-10">
        <p className="mb-5 rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">{error || 'Véhicule introuvable'}</p>
        <div className="text-center">{backLink}</div>
      </main>
    );
  }

  const title = [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || '—';
  const coverPhoto = vehicle.photos?.[0] || null;
  const yesNo = (value: boolean | null) => (value === null ? '' : value ? t('vehicle.yes') || 'Oui' : t('vehicle.no') || 'Non');

  const specs: Array<{ label: string; value: string }> = [
    { label: t('vehicle.field.year') || 'Année', value: vehicle.year != null ? String(vehicle.year) : '' },
    { label: t('vehicle.field.mileage') || 'Kilométrage', value: vehicle.mileage != null ? `${vehicle.mileage.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB')} km` : '' },
    { label: t('vehicle.field.energy') || 'Énergie', value: energyLabel(vehicle.fuelType, language) },
    { label: t('vehicle.field.gearbox') || 'Boîte', value: gearboxLabel(vehicle.gearbox, language) },
    { label: t('vehicle.field.engine') || 'Moteur', value: vehicle.engine },
    { label: t('vehicle.field.fiscalPower') || 'Puissance fis.', value: vehicle.fiscalPower },
    { label: t('vehicle.field.energyLabel') || 'Crit\'Air', value: vehicle.energyLabel },
    { label: t('vehicle.field.co2') || 'CO2', value: vehicle.co2 },
    { label: t('vehicle.field.firstRegistration') || '1re imm.', value: vehicle.firstRegistrationDate },
    { label: t('vehicle.field.bodyType') || 'Carrosserie', value: vehicle.bodyType },
    { label: t('vehicle.field.genre') || 'Genre', value: vehicle.vehicleGenre },
    { label: t('vehicle.field.color') || 'Couleur', value: vehicle.color },
    { label: t('vehicle.field.seats') || 'Places', value: vehicle.passengerCount },
    { label: t('vehicle.field.doors') || 'Portes', value: vehicle.doorCount },
    { label: t('vehicle.field.procedure') || 'Procédure', value: vehicle.procedure },
    { label: t('vehicle.field.vrade') || 'VRADE', value: vehicle.vrade },
    { label: t('vehicle.field.registrationCard') || 'Carte grise', value: yesNo(vehicle.registrationCardAvailable) },
    { label: t('vehicle.field.identificationSheet') || 'Fiche ident.', value: yesNo(vehicle.identificationSheetAvailable) },
  ].filter((spec) => spec.value);

  return (
    <main className="min-h-screen bg-white font-sans text-black">
      <div className="px-4 pt-6 sm:px-10">{backLink}</div>

      <section className="grid grid-cols-1 gap-6 px-4 pt-4 pb-8 sm:px-10 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
        <div className="flex flex-col gap-6">
          <div className="relative aspect-4/3 overflow-hidden rounded-[16px] bg-[#eef1f5]">
            {coverPhoto ? (
              <button
                type="button"
                className="h-full w-full cursor-zoom-in outline-none"
                onClick={() => setLightboxIndex(0)}
                aria-label={t('vehicle.viewPhotos') || 'Voir les photos'}
              >
                <img
                  src={coverPhoto.url}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
              </button>
            ) : (
              <div className="flex h-full items-center justify-center font-heading text-4xl font-bold text-[#8ea0bd]">
                {(vehicle.brand || '—').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {vehicle.photos && vehicle.photos.length > 1 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {vehicle.photos.slice(1).map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  className="relative aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-[10px] bg-[#eef1f5] outline-none"
                  onClick={() => setLightboxIndex(index + 1)}
                >
                  <img src={photo.url} alt="" className="h-full w-full object-cover transition-opacity hover:opacity-90" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-4">
            <h1 className="font-heading text-[32px] font-bold uppercase leading-none text-[#13243c] sm:text-[40px] md:text-[50px]">
              {title}
            </h1>
          </div>
        </div>
      </section>

      

      <div className="px-4 pb-16 sm:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-6 font-heading text-[20px] font-bold uppercase tracking-wide text-[#111827]">
              {t('vehicle.features') || 'Caractéristiques'}
            </h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {specs.map((spec) => (
                <div key={spec.label} className="border-b border-[#eceadf] pb-3">
                  <dt className="mb-1 text-[11px] font-bold uppercase tracking-[0.05em] text-[#7a756a]">{spec.label}</dt>
                  <dd className="text-sm font-semibold text-[#13243c]">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="space-y-8">
            {vehicle.description && (
              <div>
                <h2 className="mb-4 font-heading text-[20px] font-bold uppercase tracking-wide text-[#111827]">
                  {t('vehicle.description') || 'Description'}
                </h2>
                <div className="prose prose-sm prose-p:text-[#4c5058] prose-p:leading-relaxed max-w-none whitespace-pre-wrap">
                  {vehicle.description}
                </div>
              </div>
            )}
            {vehicle.conditionDetails && (
              <div>
                <h2 className="mb-4 font-heading text-[20px] font-bold uppercase tracking-wide text-[#111827]">
                  {t('vehicle.condition') || 'État / Frais'}
                </h2>
                <div className="rounded-[12px] bg-[#faf1e4] p-5 text-sm text-[#8a7249] whitespace-pre-wrap leading-relaxed shadow-inner">
                  {vehicle.conditionDetails}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Visionneuse contrôlée : `index` pilote l'affichage, `onIndexChange` gère la
          navigation gauche/droite entre les photos. */}
      <PhotoLightbox
        photos={vehicle.photos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
        alt={title}
      />
    </main>
  );
}
