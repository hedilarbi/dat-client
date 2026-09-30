'use client';

import React, { useEffect } from 'react';
import { apiRequest } from '../api';
import { useLanguage } from '../i18n';

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
  // Remplace le bouton de signature quand un prérequis manque (tampon de l'acheteur)
  blocker?: React.ReactNode;
}

/**
 * Étape 3 : signature électronique par les deux parties sur la plateforme OpenAPI.
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
  blocker,
}: EsignatureStepProps) {
  const { t } = useLanguage();
  const otherSide: Side = side === 'seller' ? 'buyer' : 'seller';
  const mySignedAt = side === 'seller' ? sellerSignedAt : buyerSignedAt;
  const otherSignedAt = side === 'seller' ? buyerSignedAt : sellerSignedAt;

  const parties = [
    { key: side, label: t('esign.you'), signed: Boolean(mySignedAt) },
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

              <p className="mb-4 text-[13px] leading-6 text-[#5a5e66]">{t('esign.instructions')}</p>

              {blocker || (signUrl ? (
                <a
                  href={signUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-[9px] bg-[#13243c] px-6 text-[13px] font-bold text-white transition hover:bg-[#203a61]"
                >
                  {t(returnedFromSigning ? 'esign.resume' : 'esign.sign')}
                </a>
              ) : (
                <p className="text-[13px] italic text-[#5a5e66]">{t('esign.linkPending')}</p>
              ))}

              {!otherSignedAt && (
                <div className="mt-4 border-t border-[#eceadf] pt-3">
                  <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-[#4c5058]">{t('esign.help.title')}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-[13px] leading-6 text-[#5a5e66]">
                    <li>{t('esign.help.otp')}</li>
                    <li>{t(`esign.help.waiting.${otherSide}`)}</li>
                    <li>{t(`esign.help.leave.${otherSide}`)}</li>
                  </ol>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Tient l'étape 3 à jour sans rechargement : la signature se fait dans un autre onglet, on relit
 * donc l'avancement à l'affichage, au retour sur l'onglet, puis toutes les 30 secondes tant que
 * la page est visible. La vente passe ainsi d'elle-même à l'étape suivante.
 */
export function useEsignatureSync(saleId: string | undefined, active: boolean, refresh: () => Promise<unknown>) {
  useEffect(() => {
    if (!saleId || !active) return;
    let running = false;

    const sync = () => {
      if (running || document.visibilityState !== 'visible') return;
      running = true;
      apiRequest(`/sales/${saleId}/esignature/sync`, { method: 'POST' })
        .then(() => refresh())
        // En cas d'échec, la page garde le dernier état connu et réessaie au prochain passage.
        .catch(() => {})
        .finally(() => { running = false; });
    };

    sync();
    const timer = window.setInterval(sync, 30_000);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, [saleId, active, refresh]);
}
