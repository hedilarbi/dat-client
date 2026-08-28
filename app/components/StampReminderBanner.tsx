'use client';

import React from 'react';
import Link from 'next/link';
import { getRoleStampPath, localizedPath, useLanguage } from '../i18n';
import { useUser } from './LayoutWrapper';

/**
 * Incite un compte validé sans tampon à en déposer un. Le tampon est facultatif, la
 * bannière n'est donc jamais bloquante : elle propose simplement le raccourci vers la
 * page de dépôt.
 */
export default function StampReminderBanner() {
  const { language, t } = useLanguage();
  const { user } = useUser();

  return (
    <div className="mb-7 rounded-[12px] border border-[#e6d8bd] bg-[#faf1e4] p-[18px_20px] flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <span
          aria-hidden="true"
          className="w-[34px] h-[34px] shrink-0 rounded-[9px] bg-white border border-[#e6d8bd] flex items-center justify-center text-[#b3893f] text-[15px]"
        >
          ✦
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[#13243c]">{t('stamp.bannerTitle')}</div>
          <p className="mt-1 text-[12px] leading-[17px] text-[#5a5e66]">{t('stamp.bannerText')}</p>
        </div>
      </div>

      <Link
        href={localizedPath(getRoleStampPath(user?.role || 'acheteur'), language)}
        className="btn btn-primary shrink-0"
      >
        {t('stamp.bannerCta')}
      </Link>
    </div>
  );
}
