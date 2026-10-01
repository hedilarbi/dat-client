'use client';

import Link from 'next/link';
import { useLanguage } from '../i18n';

/**
 * Étape 3 : les documents portent les tampons des deux parties. Tant qu'une partie n'a pas
 * déposé le sien, elle voit cette bannière ; la page tampon la ramène ensuite sur la vente.
 */
export default function StampRequiredBanner({ stampHref }: { stampHref: string }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-[10px] border border-[#e2a175] bg-[#fdf3ec] p-4" role="alert">
      <p className="mb-3 text-[13px] font-semibold leading-6 text-[#8a4b24]">{t('saleDocs.stampRequired')}</p>
      <Link
        href={stampHref}
        className="inline-flex min-h-11 items-center justify-center rounded-[9px] bg-[#13243c] px-5 text-[13px] font-bold text-white transition hover:bg-[#203a61]"
      >
        {t('saleDocs.stampCta')}
      </Link>
    </div>
  );
}
