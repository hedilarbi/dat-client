'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../api';
import { localizedPath, useLanguage } from '../../i18n';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import SkeletonRows from '../../components/SkeletonRows';
import Alert from '../../components/Alert';
import { Badge, getVehicleDossierStatusBadge } from '../../components/StatusBadge';
import type { VehicleDossier } from '../../lib/vehicleDossier';

export default function VendeurDossiersPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [dossiers, setDossiers] = useState<VehicleDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDossiers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/vehicle-dossiers');
      setDossiers(res.dossiers);
      setError('');
    } catch {
      setError(t('vehicleDossier.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('vehicleDossier.deleteConfirm'))) return;
    setDeletingId(id);
    try {
      await apiRequest(`/vehicle-dossiers/${id}`, { method: 'DELETE' });
      setDossiers((prev) => prev.filter((d) => d._id !== id));
    } catch {
      setError(t('vehicleDossier.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 w-full p-6 sm:p-[32px_40px_44px] text-black font-sans bg-white">
      <PageHeader
        eyebrow={t('login.sellerSpace')}
        title={t('vehicleDossier.listTitle')}
        action={
          <button
            onClick={() => router.push(localizedPath('/vendeur/dossiers/nouveau', language))}
            className="h-11 px-6 bg-[#13243c] hover:bg-slate-800 text-white text-[13px] font-bold uppercase tracking-[0.03em] rounded-[9px] transition"
          >
            {t('vehicleDossier.createButton')}
          </button>
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <div className="border border-[#eceadf] rounded-[12px] overflow-hidden">
          <SkeletonRows />
        </div>
      ) : dossiers.length === 0 ? (
        <EmptyState title={t('vehicleDossier.emptyTitle')} description={t('vehicleDossier.emptyDescription')} />
      ) : (
        <div className="border border-[#eceadf] rounded-[12px] divide-y divide-[#efece3] overflow-hidden">
          {dossiers.map((dossier) => {
            const badge = getVehicleDossierStatusBadge(dossier.status, t);
            const cover = dossier.photos.find((p) => p.isCover) || dossier.photos[0];
            const label = [dossier.brand, dossier.model].filter(Boolean).join(' ') || t('vehicleDossier.untitled');

            return (
              <div
                key={dossier._id}
                onClick={() => router.push(localizedPath(`/vendeur/dossiers/${dossier._id}`, language))}
                className="flex items-center gap-4 p-[16px_20px] hover:bg-[#fbfaf7] cursor-pointer transition"
              >
                <div className="w-[64px] h-[48px] rounded-[7px] bg-[#13243c] shrink-0 overflow-hidden">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.processedUrl || cover.originalUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#13243c] truncate">{label}</div>
                  <div className="text-[12px] text-[#9a917d]">
                    {t('vehicleDossier.updatedAt', { date: new Date(dossier.updatedAt).toLocaleDateString(language) })}
                  </div>
                </div>
                <Badge style={badge} className="px-[12px] py-[6px] shrink-0" />
                {dossier.status === 'brouillon' && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(dossier._id); }}
                    disabled={deletingId === dossier._id}
                    className="text-[12px] font-semibold text-[#b3261e] border border-[#dcd7cb] rounded-[7px] px-3 py-2 hover:bg-red-50 transition disabled:opacity-50 shrink-0"
                  >
                    {t('vehicleDossier.deleteDraft')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
