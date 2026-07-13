'use client';

import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { useLanguage } from '../../i18n';

export default function VendeurDossiersPage() {
  const { t } = useLanguage();
  return (
    <div className="flex-1 w-full p-6 sm:p-[32px_40px_44px] text-black font-sans bg-white">
      <PageHeader eyebrow={t('login.sellerSpace')} title={t('vendeurDashboard.myVehicleFiles')} />
      <EmptyState
        title={t('vendeurDossiers.constructionTitle')}
        description={t('vendeurDossiers.constructionDescription')}
      />
    </div>
  );
}
