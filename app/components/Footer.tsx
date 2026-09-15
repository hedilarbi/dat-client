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
            <Link href={localizedPath('/vehicules', language)} className="hover:text-[#d9704f] transition">{t('nav.vehicles')}</Link>
            <Link href={localizedPath('/acheter', language)} className="hover:text-[#d9704f] transition">Acheter un véhicule</Link>
            <Link href={localizedPath('/vendre', language)} className="hover:text-[#d9704f] transition">{t('nav.sellWithUs')}</Link>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#13243c] mb-3.5">
            {t('footer.supportTitle')}
          </div>
          <div className="flex flex-col gap-2.5 text-[13px] font-medium text-[#5a5e66]">
            <Link href={localizedPath('/comment-ca-marche', language)} className="hover:text-[#d9704f] transition">{t('nav.how')}</Link>
            <Link href={localizedPath('/a-propos', language)} className="hover:text-[#d9704f] transition">{t('nav.about')}</Link>
            <Link href={localizedPath('/securite-conformite', language)} className="hover:text-[#d9704f] transition">Sécurité & Conformité</Link>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#13243c] mb-3.5">
            {t('footer.contactTitle')}
          </div>
          <div className="flex flex-col gap-2.5 text-[13px] font-medium text-[#5a5e66]">
            <Link href={localizedPath('/contact', language)} className="hover:text-[#d9704f] transition">{t('footer.contactLink')}</Link>
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
