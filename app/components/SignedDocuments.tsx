'use client';

import { useLanguage } from '../i18n';
import type { SaleEsignatureState } from '../lib/saleSteps';

/**
 * Vente clôturée : le bon d'enlèvement, mis en avant puisqu'il sert à récupérer le véhicule,
 * puis le certificat de cession et la déclaration d'achat signés. Identique pour les deux parties.
 */
export default function SignedDocuments({ esignature, bonEnlevementUrl }: {
  esignature: SaleEsignatureState | null;
  bonEnlevementUrl: string | null | undefined;
}) {
  const { t } = useLanguage();
  const documents = [
    { key: 'certificate', url: esignature?.signedCertificateUrl },
    { key: 'purchaseDeclaration', url: esignature?.signedPurchaseDeclarationUrl },
    { key: 'audit', url: esignature?.auditUrl },
  ].filter((document): document is { key: string; url: string } => Boolean(document.url));

  return (
    <div className="space-y-3">
      {bonEnlevementUrl && (
        <a
          href={bonEnlevementUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-3 rounded-[12px] bg-[#2f6f4f] px-5 py-4 text-white transition hover:bg-[#25593f] sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            <span className="block text-[16px] font-bold">{t('saleDocs.signed.bonEnlevement')}</span>
            <span className="mt-0.5 block text-[13px] text-white/80">{t('saleDocs.signed.bonEnlevementHint')}</span>
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
