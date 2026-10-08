'use client';

import React from 'react';
import { useLanguage } from '../i18n';
import { useUser } from './LayoutWrapper';

type Side = 'seller' | 'buyer';

interface EsignatureStepProps {
  // Côté de la vente de l'utilisateur connecté
  side: Side;
  signUrl: string | null | undefined;
  sellerSignedAt: string | null | undefined;
  buyerSignedAt: string | null | undefined;
  isHistorical: boolean;
  // Retour depuis la plateforme de signature (?signature=retour), avant confirmation par OpenAPI
  returnedFromSigning: boolean;
  // La session de signature n'a pas pu être créée ; le serveur réessaie automatiquement
  setupFailed?: boolean;
}

/**
 * Étape 3.3 : signature électronique par les deux parties sur la plateforme OpenAPI.
 * Le premier signataire y voit « en attente des autres signataires » sans savoir s'il doit
 * attendre : ce bloc montre où en est chacun et lui confirme qu'il n'a plus rien à faire.
 */
export default function EsignatureStep({
  side,
  signUrl,
  sellerSignedAt,
  buyerSignedAt,
  isHistorical,
  returnedFromSigning,
  setupFailed = false,
}: EsignatureStepProps) {
  const { t } = useLanguage();
  // Dans la liste des parties, l'utilisateur est désigné par sa raison sociale plutôt que par « Vous »
  const { user } = useUser();
  const selfName = user?.companyName || t('esign.you');
  const otherSide: Side = side === 'seller' ? 'buyer' : 'seller';
  const mySignedAt = side === 'seller' ? sellerSignedAt : buyerSignedAt;
  const otherSignedAt = side === 'seller' ? buyerSignedAt : sellerSignedAt;

  const parties = [
    { key: side, label: selfName, signed: Boolean(mySignedAt) },
    { key: otherSide, label: t(`esign.party.${otherSide}`), signed: Boolean(otherSignedAt) },
  ];

  return (
    <div className="rounded-[10px] border border-dashed border-[#dcd7cb] bg-[#fbfaf7] p-4">
      <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">
        {t('esign.title')}
      </div>

      {isHistorical ? (
        <p className="text-[13px] leading-6 text-[#5a5e66]">{t('esign.historical')}</p>
      ) : (
        <>
          <ul className="mb-4 mt-3 grid gap-2 sm:grid-cols-2">
            {parties.map((party) => (
              <li key={party.key} className="flex items-center justify-between gap-3 rounded-[9px] border border-[#eceadf] bg-white px-3 py-2 text-[13px]">
                <span className="font-semibold text-[#13243c]">{party.label}</span>
                <span className={party.signed ? 'font-bold text-[#2f6f4f]' : 'text-[#7a756a]'}>
                  {party.signed ? `✓ ${t('esign.status.signed')}` : t('esign.status.pending')}
                </span>
              </li>
            ))}
          </ul>

          {mySignedAt ? (
            <div className="rounded-[10px] border-l-4 border-[#2f6f4f] bg-[#e9f4ee] p-3.5" role="status">
              <p className="text-sm font-bold text-[#2f6f4f]">{t('esign.signedTitle')}</p>
              <p className="mt-1 text-[13px] leading-6 text-[#2f6f4f]">{t(`esign.signedWaiting.${otherSide}`)}</p>
            </div>
          ) : (
            <>
              {returnedFromSigning ? (
                <div className="mb-4 rounded-[10px] border-l-4 border-[#2f6f4f] bg-[#e9f4ee] p-3.5" role="status">
                  <p className="text-sm font-bold text-[#2f6f4f]">{t('esign.returnedTitle')}</p>
                  <p className="mt-1 text-[13px] leading-6 text-[#2f6f4f]">{t(`esign.returnedText.${otherSide}`)}</p>
                </div>
              ) : otherSignedAt ? (
                <p className="mb-4 rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-[13px] font-semibold leading-6 text-[#8a4b24]">
                  {t(`esign.otherSigned.${otherSide}`)}
                </p>
              ) : null}

              <div className="mb-5 rounded-[12px] border-2 border-[#13243c] bg-[#f4f7fb] p-4 sm:p-5">
                <p className="mb-3 text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#13243c]">{t('esign.steps.title')}</p>
                <ol className="space-y-3.5">
                  {[
                    t('esign.steps.1'),
                    t('esign.steps.2'),
                    otherSignedAt ? t('esign.steps.3.last') : t(`esign.steps.3.${otherSide}`),
                  ].map((text, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d9704f] text-[13px] font-extrabold text-white" aria-hidden="true">{index + 1}</span>
                      <span className="pt-0.5 text-[14px] font-semibold leading-6 text-[#13243c]">{text}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {signUrl ? (
                <a
                  href={signUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-14 w-full items-center justify-center rounded-[10px] bg-[#2f6f4f] px-8 text-[14px] font-extrabold uppercase tracking-[0.03em] text-white shadow-md transition hover:bg-[#245a40] sm:w-auto"
                >
                  {t(returnedFromSigning ? 'esign.resume' : 'esign.sign')}
                </a>
              ) : setupFailed ? (
                <p className="rounded-[10px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-3.5 text-[13px] font-semibold leading-6 text-[#8a4b24]" role="alert">
                  {t('esign.setupFailed')}
                </p>
              ) : (
                <p className="text-[13px] italic text-[#5a5e66]">{t('esign.linkPending')}</p>
              )}

            </>
          )}
        </>
      )}
    </div>
  );
}
