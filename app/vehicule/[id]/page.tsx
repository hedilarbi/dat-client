'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '../../api';
import { getRoleLoginPath, localizedPath, useLanguage } from '../../i18n';
import BidModal from '../../components/BidModal';
import PhotoLightbox from '../../components/PhotoLightbox';
import { useUser } from '../../components/LayoutWrapper';
import { formatTimeLeft } from '../../lib/currentSales';
import { formatEuros } from '../../lib/format';
import { energyLabel, gearboxLabel } from '../../lib/vehicleLabels';

interface VehiclePhoto {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
  width: number | null;
  height: number | null;
}

interface PublicVehicle {
  id: string;
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
  lotNumber: number | null;
  photos: VehiclePhoto[];
  /** Offre active de l'acheteur connecté sur ce véhicule, s'il en a déjà déposé une */
  myOffer: { id: string; amount: number; fees: { total: number }; createdAt: string } | null;
  session: { id: string; name: string; startDate: string; endDate: string; status: string } | null;
}

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { user } = useUser();

  const [vehicle, setVehicle] = useState<PublicVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [bidOpen, setBidOpen] = useState(false);
  const [, setClock] = useState(0);

  const loadVehicle = useCallback(() => apiRequest(`/public/vehicles/${params.id}`)
    .then((res) => setVehicle(res.vehicle))
    .catch(() => setError(t('vehicle.notFound')))
    .finally(() => setLoading(false)), [params.id, t]);

  useEffect(() => {
    let cancelled = false;
    apiRequest(`/public/vehicles/${params.id}`)
      .then((res) => { if (!cancelled) setVehicle(res.vehicle); })
      .catch(() => { if (!cancelled) setError(t('vehicle.notFound')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id, t]);

  // Le compte à rebours de la session doit s'égrener comme sur les pages de listing
  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const router = useRouter();
  const backLink = (
    <button type="button" onClick={() => router.back()} className="btn-back mb-6 cursor-pointer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      Retour
    </button>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 py-16 text-center text-sm text-[#5a5e66] sm:px-10">
        {t('vehicle.loading')}
      </main>
    );
  }

  if (error || !vehicle) {
    return (
      <main className="min-h-screen bg-white px-4 py-16 sm:px-10">
        <p className="mb-5 rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">{error || t('vehicle.notFound')}</p>
        <div className="text-center">{backLink}</div>
      </main>
    );
  }

  const title = [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || '—';
  const coverPhoto = vehicle.photos[0] || null;
  const canBid = user?.role === 'acheteur' && user.status === 'valide';
  // Une offre déjà déposée se modifie, elle ne se double pas
  const myOffer = vehicle.myOffer;
  // Chemin localisé pour revenir sur cette fiche après connexion (le formulaire de connexion
  // pousse la valeur de `next` telle quelle : elle doit déjà porter le préfixe de langue).
  const returnPath = localizedPath(`/vehicule/${vehicle.id}`, language);
  const yesNo = (value: boolean | null) => (value === null ? '' : value ? t('vehicle.yes') : t('vehicle.no'));

  const specs: Array<{ label: string; value: string }> = [
    { label: t('vehicle.field.year'), value: vehicle.year != null ? String(vehicle.year) : '' },
    { label: t('vehicle.field.mileage'), value: vehicle.mileage != null ? `${vehicle.mileage.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB')} km` : '' },
    { label: t('vehicle.field.energy'), value: energyLabel(vehicle.fuelType, language) },
    { label: t('vehicle.field.gearbox'), value: gearboxLabel(vehicle.gearbox, language) },
    { label: t('vehicle.field.engine'), value: vehicle.engine },
    { label: t('vehicle.field.fiscalPower'), value: vehicle.fiscalPower },
    { label: t('vehicle.field.energyLabel'), value: vehicle.energyLabel },
    { label: t('vehicle.field.co2'), value: vehicle.co2 },
    { label: t('vehicle.field.firstRegistration'), value: vehicle.firstRegistrationDate },
    { label: t('vehicle.field.bodyType'), value: vehicle.bodyType },
    { label: t('vehicle.field.genre'), value: vehicle.vehicleGenre },
    { label: t('vehicle.field.color'), value: vehicle.color },
    { label: t('vehicle.field.seats'), value: vehicle.passengerCount },
    { label: t('vehicle.field.doors'), value: vehicle.doorCount },
    { label: t('vehicle.field.procedure'), value: vehicle.procedure },
    { label: t('vehicle.field.vrade'), value: vehicle.vrade },
    { label: t('vehicle.field.registrationCard'), value: yesNo(vehicle.registrationCardAvailable) },
    { label: t('vehicle.field.identificationSheet'), value: yesNo(vehicle.identificationSheetAvailable) },
    { label: t('vehicle.field.listingCount'), value: vehicle.listingCount > 0 ? String(vehicle.listingCount) : '' },
  ].filter((spec) => spec.value);

  return (
    <main className="min-h-screen bg-white font-sans text-black">
      <div className="px-4 pt-6 sm:px-10">{backLink}</div>

      <section className="grid grid-cols-1 gap-6 px-4 pt-4 pb-8 sm:px-10 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
        {/* Photo de couverture */}
        <div className="flex flex-col gap-6">
          <div className="relative aspect-4/3 overflow-hidden rounded-[16px] bg-[#eef1f5]">
            {coverPhoto ? (
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                aria-label={t('vehicle.openGallery')}
                className="group h-full w-full cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPhoto.url} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
              </button>
            ) : (
              <div className="flex h-full items-center justify-center font-heading text-4xl font-bold text-[#8ea0bd]">
                {(vehicle.brand || '—').slice(0, 2).toUpperCase()}
              </div>
            )}

            {vehicle.session && (
              <span className="pointer-events-none absolute right-3 top-3 rounded-[7px] bg-[rgba(19,36,60,.78)] px-2.5 py-1.5 font-mono text-[11px] font-bold text-white">
                {formatTimeLeft(vehicle.session.endDate)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-heading text-base font-bold uppercase text-[#13243c]">{t('vehicle.photos')}</h2>
              {vehicle.photos.length > 0 && (
                <span className="text-xs font-semibold text-[#5a5e66]">
                  {t('vehicle.photoCount', { count: String(vehicle.photos.length) })}
                </span>
              )}
            </div>

            {vehicle.photos.length === 0 ? (
              <p className="rounded-[12px] bg-[#f8f7f2] p-6 text-center text-sm text-[#5a5e66]">{t('vehicle.noPhoto')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {vehicle.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={t('vehicle.openGallery')}
                    className="group relative aspect-4/3 overflow-hidden rounded-[12px] bg-[#eef1f5] cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`${title} — ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Identité + caractéristiques */}
        <div className="flex flex-col">
          {vehicle.session && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#a3987f]">
              {vehicle.session.name} · {t('vehicle.closesIn')} {formatTimeLeft(vehicle.session.endDate)}
            </p>
          )}
          {vehicle.lotNumber && (
            <div className="mb-2">
              <span className="inline-block rounded-[6px] bg-[#faf1e4] px-2.5 py-1 font-mono text-[12px] font-bold text-[#b3893f]">
                {t('vehicle.lot', { number: String(vehicle.lotNumber) })}
              </span>
            </div>
          )}
          <h1 className="mb-2 font-heading text-[34px] font-extrabold uppercase leading-[.98] text-[#13243c] sm:text-[44px]">
            {title}
          </h1>
          <p className="mb-6 text-sm text-[#5a5e66]">
            {[
              vehicle.year != null ? String(vehicle.year) : null,
              vehicle.mileage != null ? `${vehicle.mileage.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB')} km` : null,
              energyLabel(vehicle.fuelType, language) || null,
              gearboxLabel(vehicle.gearbox, language) || null,
            ].filter(Boolean).join(' · ') || '—'}
          </p>

          {/* Description et état, directement sous le résumé : c'est ce que l'acheteur lit
              en premier pour juger le véhicule, avant même les caractéristiques. */}
          {vehicle.description && (
            <div className="mb-5">
              <h2 className="mb-2 font-heading text-base font-bold uppercase text-[#13243c]">{t('vehicle.description')}</h2>
              <p className="whitespace-pre-wrap rounded-[12px] bg-[#f8f7f2] p-4 text-sm leading-6 text-[#13243c]">{vehicle.description}</p>
            </div>
          )}
          {vehicle.conditionDetails && (
            <div className="mb-5">
              <h2 className="mb-2 font-heading text-base font-bold uppercase text-[#13243c]">{t('vehicle.condition')}</h2>
              <p className="whitespace-pre-wrap rounded-[12px] bg-[#f8f7f2] p-4 text-sm leading-6 text-[#13243c]">{vehicle.conditionDetails}</p>
            </div>
          )}

          <h2 className="mb-3 font-heading text-base font-bold uppercase text-[#13243c]">{t('vehicle.specs')}</h2>
          <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {specs.map((spec) => (
              <div key={spec.label} className="rounded-[10px] bg-[#f8f7f2] p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7a756a]">{spec.label}</dt>
                <dd className="mt-1 text-sm font-semibold text-[#13243c]">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 rounded-[14px] border border-[#eceadf] bg-[#f8f7f2] p-4 sm:p-5">
            {canBid && myOffer && (
              <>
                <div className="rounded-[10px] border border-[#bcd8c8] bg-[#f2f8f4] p-4 text-center">
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#2f6f4f]">
                    {t('bid.alreadyPlaced')}
                  </div>
                  <div className="mt-1.5 font-heading text-2xl font-bold text-[#13243c]">
                    {formatEuros(myOffer.amount, language)}
                  </div>
                  <div className="mt-1 text-xs text-[#5a5e66]">
                    {t('bid.alreadyPlacedTotal', { total: formatEuros(myOffer.fees.total, language) })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBidOpen(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#dcd7cb] bg-white px-6 py-3.5 font-heading text-sm font-bold uppercase tracking-[.04em] text-[#13243c] transition hover:bg-gray-50 cursor-pointer"
                >
                  {t('bid.editCta')}
                </button>
                <p className="mt-2.5 text-center text-xs leading-5 text-[#5a5e66]">{t('bid.alreadyPlacedHint')}</p>
              </>
            )}

            {canBid && !myOffer && (
              <>
                <button
                  type="button"
                  onClick={() => setBidOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#d9704f] px-6 py-4 font-heading text-base font-bold uppercase tracking-[.04em] text-white shadow-[0_8px_20px_rgba(217,112,79,.35)] transition hover:bg-[#c66042] cursor-pointer"
                >
                  {t('bid.cta')}
                </button>
                <p className="mt-2.5 text-center text-xs leading-5 text-[#5a5e66]">{t('bid.ctaHint')}</p>
              </>
            )}

            {!user && (
              <>
                <Link
                  href={localizedPath(`${getRoleLoginPath('acheteur')}?next=${encodeURIComponent(returnPath)}`, language)}
                  className="btn btn-primary w-full gap-2 font-heading"
                >
                  {t('bid.loginCta')}
                </Link>
                <p className="mt-2.5 text-center text-xs leading-5 text-[#5a5e66]">{t('bid.ctaHint')}</p>
              </>
            )}

            {user && user.status !== 'valide' && (
              <p className="text-center text-sm leading-6 text-[#5a5e66]">{t('bid.accountPending')}</p>
            )}

            {user && user.status === 'valide' && user.role !== 'acheteur' && (
              <p className="text-center text-sm leading-6 text-[#5a5e66]">{t('bid.sellerNotice')}</p>
            )}
          </div>
        </div>
      </section>

      

      <PhotoLightbox
        photos={vehicle.photos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
        alt={title}
      />

      {bidOpen && (
        <BidModal
          vehicleId={vehicle.id}
          vehicleTitle={title}
          offerId={myOffer?.id}
          initialAmount={myOffer?.amount}
          onClose={() => setBidOpen(false)}
          onSaved={loadVehicle}
        />
      )}
    </main>
  );
}
