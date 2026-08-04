'use client';

import React from 'react';
import Link from 'next/link';
import { localizedPath, useLanguage } from '../i18n';

export default function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer id="contact" className="scroll-mt-[70px] border-t border-[#efece3] bg-white select-none">
      <div className="px-4 sm:px-[34px] py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8">
        <div>
          <div className="w-[118px] h-[34px] border border-dashed border-[#cfc8b8] rounded-[6px] flex items-center justify-center text-[9px] font-semibold tracking-widest uppercase text-[#a3987f] mb-3.5">
            {t('login.logo')}
          </div>
          <p className="text-[13px] leading-[1.6] text-[#4c5058] max-w-[260px]">
            {t('footer.tagline')}
          </p>
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#13243c] mb-3.5">
            {t('footer.platformTitle')}
          </div>
          <div className="flex flex-col gap-2.5 text-[13px] font-medium text-[#5a5e66]">
            <span>{t('nav.vehicles')}</span>
            <span>{t('nav.how')}</span>
            <span>{t('nav.sessions')}</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#13243c] mb-3.5">
            {t('footer.supportTitle')}
          </div>
          <div className="flex flex-col gap-2.5 text-[13px] font-medium text-[#5a5e66]">
            <span>{t('nav.help')}</span>
            <span>{t('footer.contactLink')}</span>
            <span>{t('footer.termsLink')}</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#13243c] mb-3.5">
            {t('footer.contactTitle')}
          </div>
          <div className="flex flex-col gap-2.5 text-[13px] font-medium text-[#5a5e66]">
            <span>{t('footer.contactEmail')}</span>
            <span>{t('footer.contactPhone')}</span>
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-[34px] py-4 border-t border-[#efece3] text-[11px] text-[#a3987f] flex flex-col sm:flex-row gap-2 justify-between">
        <span>{t('footer.copyright', { year: String(new Date().getFullYear()) })}</span>
        <Link href={localizedPath('/', language)} className="hover:text-[#5a5e66] transition">
          {t('home.title')}
        </Link>
      </div>
    </footer>
  );
}
