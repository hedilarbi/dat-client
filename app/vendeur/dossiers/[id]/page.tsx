'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const isEditable = dossier ? ['brouillon', 'correction_demandee'].includes(dossier.status) : false;

  return (
    <div className="flex-1 w-full p-6 sm:p-[32px_40px_44px] text-black font-sans bg-[#fbfaf7]">
      <Link href={localizedPath('/vendeur/dossiers', language)} className="inline-block text-[12px] font-semibold text-[#8a8270] hover:text-[#13243c] mb-4">
        ← {t('vehicleDossier.listTitle')}
      </Link>

      {loading && <div className="text-[13px] text-[#9a917d]">…</div>}
      {error && <Alert variant="error">{error}</Alert>}

      {dossier && (
        isEditable ? (
          <VehicleDossierWizard initialDossier={dossier} />
        ) : (
          <div className="max-w-[1000px] mx-auto bg-white border border-[#efece3] rounded-[10px] p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[22px] font-bold font-heading uppercase text-[#13243c]">
                {[dossier.brand, dossier.model].filter(Boolean).join(' ') || t('vehicleDossier.untitled')}
              </h2>
              <Badge style={getVehicleDossierStatusBadge(dossier.status, t)} className="px-[12px] py-[6px]" />
            </div>
            <p className="text-[13px] text-[#9a917d]">{t('vehicleDossier.notEditableError')}</p>
          </div>
        )
      )}
    </div>
  );
}
