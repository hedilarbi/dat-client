'use client';

import Link from 'next/link';
import { getRoleLoginPath, getRoleRegisterPath, localizedPath, useLanguage } from '../i18n';

const benefits = [1, 2, 3] as const;

export default function SellWithUsPage() {
  const { language, t } = useLanguage();

  return (
    <div className="flex-1 bg-[#f8f7f2] pb-16 text-[#13243c] sm:pb-24">
      <section className="relative overflow-hidden bg-[#0c1626] px-4 py-16 sm:px-10 sm:py-24">
        <div className="absolute -right-28 -top-36 h-[420px] w-[420px] rounded-full bg-[#d9704f]/20 blur-3xl" />
        <div className="relative mx-auto max-w-[1120px]">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#e2a175]">{t('sell.eyebrow')}</p>
          <h1 className="max-w-[850px] font-heading text-4xl font-bold uppercase leading-[1.02] text-white sm:text-6xl">{t('sell.title')}</h1>
          <p className="mt-6 max-w-[720px] text-base leading-7 text-[#c3cedd]">{t('sell.intro')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={localizedPath(getRoleLoginPath('vendeur'), language)}
              className="rounded-lg border border-white/70 px-7 py-3.5 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-[#13243c]"
            >
              {t('sell.login')}
            </Link>
            <Link
              href={localizedPath(getRoleRegisterPath('vendeur'), language)}
              className="rounded-lg bg-[#d9704f] px-7 py-3.5 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c26040]"
            >
              {t('sell.register')}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 py-12 sm:grid-cols-3 sm:px-10 sm:py-16">
        {benefits.map((number) => (
          <article key={number} className="rounded-2xl border border-[#e7e1d5] bg-white p-7 shadow-[0_8px_28px_rgba(19,36,60,.06)]">
            <span className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[#13243c] font-heading text-lg font-bold text-white">{number}</span>
            <h2 className="font-heading text-xl font-bold uppercase">{t(`sell.benefit${number}Title`)}</h2>
            <p className="mt-3 text-sm leading-6 text-[#5a5e66]">{t(`sell.benefit${number}Text`)}</p>
          </article>
        ))}
      </section>

      <section className="mx-4 rounded-2xl bg-white px-6 py-10 text-center shadow-[0_12px_36px_rgba(19,36,60,.08)] sm:mx-auto sm:max-w-[1120px] sm:px-12 sm:py-14">
        <h2 className="font-heading text-3xl font-bold uppercase">{t('sell.actionsTitle')}</h2>
        <p className="mx-auto mt-3 max-w-[620px] text-sm leading-6 text-[#5a5e66]">{t('sell.actionsText')}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={localizedPath(getRoleRegisterPath('vendeur'), language)} className="rounded-lg bg-[#d9704f] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c26040]">{t('sell.register')}</Link>
          <Link href={localizedPath(getRoleLoginPath('vendeur'), language)} className="rounded-lg border border-[#13243c] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#13243c] transition hover:bg-[#13243c] hover:text-white">{t('sell.login')}</Link>
        </div>
      </section>
    </div>
  );
}
