'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../api';
import { localizedPath, useLanguage } from '../../../i18n';
import Alert from '../../../components/Alert';
import { Badge, getVehicleDossierStatusBadge } from '../../../components/StatusBadge';
import VehicleDossierWizard from '../../../components/vehicleDossier/VehicleDossierWizard';
import type { VehicleDossier } from '../../../lib/vehicleDossier';

export default function DossierVehiculeDetailPage() {
  const params = useParams<{ id: string }>();
  const { language, t } = useLanguage();

  const [dossier, setDossier] = useState<VehicleDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiRequest(`/vehicle-dossiers/${params.id}`)
      .then((res) => { if (!cancelled) setDossier(res.dossier); })
      .catch(() => { if (!cancelled) setError(t('vehicleDossier.fetchError')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id, t]);

  if (loading) {
    return (
      <div className="flex-1 w-full bg-white p-8 text-[#9a917d] font-medium text-sm">
        Chargement du dossier...
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="flex-1 w-full bg-white p-8">
        <Alert variant="error">{error || 'Dossier introuvable.'}</Alert>
        <div className="mt-4">
          <Link href={localizedPath('/vendeur/dossiers', language)} className="text-xs font-bold text-[#d9704f] underline">
            ← Retour à la liste de mes dossiers
          </Link>
        </div>
      </div>
    );
  }

  const isEditable = ['brouillon', 'correction_demandee'].includes(dossier.status);
  const badge = getVehicleDossierStatusBadge(dossier.status, t);
  const vehicleLabel = [dossier.brand, dossier.model].filter(Boolean).join(' ') || 'Sans nom';
  const lastRefusal = dossier.refusals?.[dossier.refusals.length - 1];

  if (isEditable) {
    return <VehicleDossierWizard initialDossier={dossier} />;
  }

  // Read-only view for 'valide', 'refuse', 'soumis', 'en_attente_validation'
  return (
    <div className="flex-1 w-full bg-white text-black font-sans min-h-full p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={localizedPath('/vendeur/dossiers', language)}
          className="inline-flex items-center gap-1.5 font-semibold text-[12px] text-[#8a8270] hover:text-[#13243c] mb-3 transition-colors"
        >
          <span>←</span>
          <span className="uppercase">Mes dossiers · {vehicleLabel}</span>
        </Link>

        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="font-semibold text-[11px] uppercase tracking-[0.2em] text-[#a3987f] mb-1.5 font-sans">
              Dossier véhicule #{dossier._id.slice(-6).toUpperCase()}
            </div>
            <h1 className="m-0 font-bold text-[34px] leading-none uppercase text-[#13243c] font-['Saira_Condensed',sans-serif]">
              {vehicleLabel}
            </h1>
          </div>
          <Badge style={badge} className="px-3.5 py-2 shrink-0" />
        </div>
      </div>

      {/* Decision Banner if Refused */}
      {dossier.status === 'refuse' && (
        <div className="mb-7 border border-[#f0c9bd] bg-[#fbeae7] rounded-[12px] p-5">
          <div className="font-bold text-[13px] uppercase tracking-wide text-[#9a3b2f] mb-2.5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#9a3b2f] text-white flex items-center justify-center text-[10px] font-bold">×</span>
            Dossier refusé par l'administrateur
          </div>
          {lastRefusal?.motifsLabels && lastRefusal.motifsLabels.length > 0 && (
            <ul className="list-disc pl-5 text-[13px] text-[#1a2230] space-y-1 mb-2 font-medium">
              {lastRefusal.motifsLabels.map((motif, i) => (
                <li key={i}>{motif}</li>
              ))}
            </ul>
          )}
          {lastRefusal?.comment && (
            <p className="text-[12px] italic text-[#5a5e66] mt-1">
              &quot;{lastRefusal.comment}&quot;
            </p>
          )}
          <p className="text-[12px] text-[#9a3b2f] mt-3 font-semibold">
            Ce dossier a été rejeté. Il n'est plus modifiable. Pour tout renseignement, contactez le support.
          </p>
        </div>
      )}

      {/* Decision Banner if Validated */}
      {dossier.status === 'valide' && (
        <div className="mb-7 border border-[#bcd8c8] bg-[#e9f4ee] rounded-[12px] p-4.5 flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#2f6f4f] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
            ✓
          </div>
          <div className="font-medium text-[13px] leading-relaxed text-[#2f6f4f]">
            Votre dossier véhicule a été <strong className="font-bold">validé par l'administrateur</strong>. Il sera prochainement programmé dans une session d'enchères. Aucune modification supplémentaire n'est requise.
          </div>
        </div>
      )}

      {/* Decision Banner if Pending (Soumis) */}
      {['soumis', 'en_attente_validation'].includes(dossier.status) && (
        <div className="mb-7 border border-[#ebdcc9] bg-[#faf1e4] rounded-[12px] p-4.5 flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#b3893f] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
            i
          </div>
          <div className="font-medium text-[13px] leading-relaxed text-[#8a6a2f]">
            Votre dossier véhicule est <strong className="font-bold">en cours d'inspection par notre équipe</strong>. Vous recevrez une notification et un e-mail dès qu'une décision sera prise.
          </div>
        </div>
      )}

      {/* Information Grid (Read Only) */}
      <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#8a8270] mb-3">
        Informations du véhicule
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-7">
        <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white">
          <div className="font-medium text-[11px] text-[#9a917d] uppercase tracking-[0.04em] mb-1">
            Modèle / Année
          </div>
          <div className="font-semibold text-[14px] text-[#13243c]">
            {dossier.model || vehicleLabel} · {dossier.year || '—'}
          </div>
        </div>

        <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white">
          <div className="font-medium text-[11px] text-[#9a917d] uppercase tracking-[0.04em] mb-1">
            Immatriculation / VIN
          </div>
          <div className="font-semibold text-[14px] text-[#13243c] font-mono">
            {dossier.registrationNumber || dossier.vin || '—'}
          </div>
        </div>

        <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white">
          <div className="font-medium text-[11px] text-[#9a917d] uppercase tracking-[0.04em] mb-1">
            Kilométrage
          </div>
          <div className="font-semibold text-[14px] text-[#13243c]">
            {dossier.mileage ? `${dossier.mileage.toLocaleString('fr-FR')} km` : '—'}
          </div>
        </div>

        <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white">
          <div className="font-medium text-[11px] text-[#9a917d] uppercase tracking-[0.04em] mb-1">
            Type de dossier
          </div>
          <div className="font-semibold text-[14px] text-[#13243c]">
            {dossier.dossierType || 'Sinistré'}
          </div>
        </div>

        <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white">
          <div className="font-medium text-[11px] text-[#9a917d] uppercase tracking-[0.04em] mb-1">
            État général
          </div>
          <div className="font-semibold text-[14px] text-[#13243c]">
            {dossier.vehicleCondition || 'Roulant'}
          </div>
        </div>

        <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white">
          <div className="font-medium text-[11px] text-[#9a917d] uppercase tracking-[0.04em] mb-1">
            Prix de réserve
          </div>
          <div className="font-semibold text-[14px] text-[#13243c] font-mono">
            {dossier.reservePrice ? `${dossier.reservePrice.toLocaleString('fr-FR')} €` : 'Non défini'}
          </div>
        </div>
      </div>

      {/* Description */}
      {dossier.description && (
        <div className="mb-7">
          <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#8a8270] mb-2">
            Description
          </div>
          <div className="border border-[#eceadf] rounded-[10px] p-4 bg-white text-[13px] leading-relaxed text-[#1a2230]">
            {dossier.description}
          </div>
        </div>
      )}

      {/* Photos */}
      <div className="mb-7">
        <div className="font-bold text-[12px] uppercase tracking-[0.06em] text-[#8a8270] mb-3">
          Photos ({dossier.photos.length})
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {dossier.photos.map((p, i) => (
            <div key={p._id || i} className="relative aspect-[4/3] rounded-[9px] overflow-hidden bg-gray-100 border border-[#eceadf]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.processedUrl || p.originalUrl} alt="" className="w-full h-full object-cover" />
              {p.isCover && (
                <div className="absolute top-2 left-2 bg-[#2f6f4f] text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
                  COUVERTURE
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
