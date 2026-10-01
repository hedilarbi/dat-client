'use client';

import { useLanguage } from '../i18n';
import type { SaleEsignatureState } from '../lib/saleSteps';

/**
 * Vente finalisée : bon d'enlèvement et documents signés et tamponnés, identiques pour les
 * deux parties. La signature électronique vaut pour le dossier complet ; le certificat et la
 * déclaration sont aussi proposés séparément pour la consultation.
 */
export default function SignedDocuments({ esignature, bonEnlevementUrl }: {
  esignature: SaleEsignatureState | null;
  bonEnlevementUrl: string | null | undefined;
}) {
  const { t } = useLanguage();
  const documents = [
    { key: 'bonEnlevement', url: bonEnlevementUrl },
    { key: 'certificate', url: esignature?.signedCertificateUrl },
    { key: 'purchaseDeclaration', url: esignature?.signedPurchaseDeclarationUrl },
    { key: 'bundle', url: esignature?.signedDocumentUrl },
    { key: 'audit', url: esignature?.auditUrl },
  ].filter((document): document is { key: string; url: string } => Boolean(document.url));

  if (documents.length === 0) return null;

  return (
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
  );
}
