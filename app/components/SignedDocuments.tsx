'use client';

import { useLanguage } from '../i18n';
import type { SaleEsignatureState } from '../lib/saleSteps';

/**
 * Vente clôturée : l'acheteur voit le bon d'enlèvement mis en avant (il lui sert à récupérer le
 * véhicule), puis le certificat de cession et la déclaration d'achat signés. Pour le vendeur, le
 * bon d'enlèvement figure simplement parmi les autres documents.
 */
export default function SignedDocuments({ esignature, bonEnlevementUrl, side = 'buyer' }: {
  esignature: SaleEsignatureState | null;
  bonEnlevementUrl: string | null | undefined;
  side?: 'buyer' | 'seller';
}) {
  const { t } = useLanguage();
  const highlightPickup = side === 'buyer';
  const documents = [
    { key: 'certificate', url: esignature?.signedCertificateUrl },
    { key: 'purchaseDeclaration', url: esignature?.signedPurchaseDeclarationUrl },
    ...(highlightPickup ? [] : [{ key: 'bonEnlevement', url: bonEnlevementUrl }]),
    { key: 'audit', url: esignature?.auditUrl },
  ].filter((document): document is { key: string; url: string } => Boolean(document.url));

  return (
    <div className="space-y-3">
      {highlightPickup && bonEnlevementUrl && (
        <a
          href={bonEnlevementUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-3 rounded-[12px] bg-[#2f6f4f] px-5 py-4 text-white transition hover:bg-[#25593f] sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            <span className="block text-[16px] font-bold">{t('saleDocs.signed.bonEnlevement')}</span>
            <span className="mt-1.5 block text-[15px] font-bold text-[#c6f3d9]">{t('saleDocs.signed.bonEnlevementHint')}</span>
          </span>
          <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-[9px] bg-white px-5 text-[13px] font-bold uppercase text-[#2f6f4f]">
            {t('saleDocs.download')} ↓
          </span>
        </a>
      )}

      {documents.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {documents.map((document) => (
            <a
              key={document.key}
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-[10px] border border-[#dcd7cb] bg-white px-4 py-3 text-[13px] font-bold text-[#13243c] transition hover:bg-[#f1f4f8]"
            >
              <span>{t(`saleDocs.signed.${document.key}`)}</span>
              <span aria-hidden="true">↓</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
