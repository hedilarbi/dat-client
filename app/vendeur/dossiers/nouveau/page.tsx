'use client';

import React from 'react';
import Link from 'next/link';
import VehicleDossierWizard from '../../../components/vehicleDossier/VehicleDossierWizard';
import { localizedPath, useLanguage } from '../../../i18n';

export default function NouveauDossierVehiculePage() {
  const { language, t } = useLanguage();
  return (
    <div className="flex-1 w-full p-6 sm:p-[32px_40px_44px] text-black font-sans bg-[#fbfaf7]">
      <Link href={localizedPath('/vendeur/dossiers', language)} className="inline-block text-[12px] font-semibold text-[#8a8270] hover:text-[#13243c] mb-4">
        ← {t('vehicleDossier.listTitle')}
      </Link>
      <VehicleDossierWizard />
    </div>
  );
}
