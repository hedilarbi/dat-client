import React from 'react';
import { useLanguage } from '../i18n';

interface DraftPendingNoticeProps {
  onResume: () => void;
}

export function DraftPendingNotice({ onResume }: DraftPendingNoticeProps) {
  const { t } = useLanguage();
  return (
    <div className="flex-1 w-full p-6 sm:p-12 text-black font-sans text-center bg-white">
      <div className="w-[60px] h-[60px] rounded-full bg-[#eef1f5] text-[#13243c] flex items-center justify-center text-2xl mx-auto mb-4 font-bold">
        2
      </div>
      <h3 className="text-xl font-bold uppercase text-[#13243c] mb-2">{t('notice.draftTitle')}</h3>
      <p className="text-sm text-[#5a5e66] leading-[1.6] mb-6">
        {t('notice.draftDescription')}
      </p>
      <button
        type="button"
        onClick={onResume}
        className="btn btn-primary"
      >
        {t('notice.draftResume')}
      </button>
    </div>
  );
}

export function UnderReviewNotice() {
  const { t } = useLanguage();
  return (
    <div className="flex-1 w-full p-6 sm:p-12 text-black font-sans text-center bg-white">
      <div className="w-[60px] h-[60px] rounded-full bg-[#eef1f5] text-[#13243c] flex items-center justify-center text-2xl mx-auto mb-4 font-bold">
        ⏳
      </div>
      <h3 className="text-xl font-bold uppercase text-[#13243c] mb-2">{t('notice.reviewTitle')}</h3>
      <p className="text-sm text-[#5a5e66] leading-[1.6] mb-4">
        {t('notice.reviewDescription')}
      </p>
      <p className="text-xs text-gray-400">
        {t('notice.reviewFooter')}
      </p>
    </div>
  );
}

export interface Rejection {
  date: string;
  motifs: string[];
  motifsLabels?: string[];
  comment: string;
}

interface RejectionReasonsBoxProps {
  title: string;
  intro?: string;
  rejection: Rejection | null;
  footer?: string;
}

export function RejectionReasonsBox({ title, intro, rejection, footer }: RejectionReasonsBoxProps) {
  const { t } = useLanguage();
  const reasons = (rejection?.motifsLabels && rejection.motifsLabels.length > 0
    ? rejection.motifsLabels
    : rejection?.motifs) || [];

  return (
    <div className="bg-red-50 border border-red-200 rounded-[12px] p-6">
      <h3 className="text-lg font-bold text-red-800 uppercase mb-2">⚠️ {title}</h3>
      {intro && <p className="text-sm text-red-700 mb-3">{intro}</p>}
      <ul className="list-disc list-inside text-sm text-red-700 space-y-1 mb-4">
        {reasons.map((motif, index) => (
          <li key={index}><strong>{motif}</strong></li>
        ))}
      </ul>
      {rejection?.comment && (
        <div className="bg-white p-3 border rounded text-sm text-gray-700">
          <strong>{t('notice.adminComment')}</strong>
          <p className="italic mt-1">&quot;{rejection.comment}&quot;</p>
        </div>
      )}
      {footer && <p className="text-xs text-red-700 mt-4">{footer}</p>}
    </div>
  );
}

import Link from 'next/link';
import { useUser } from './LayoutWrapper';
import PendingCommissionCheckout from './PendingCommissionCheckout';
import { formatEuros } from '../lib/format';
import { localizedPath } from '../i18n';

export function SuspendedNotice() {
  const { user } = useUser();
  const { language } = useLanguage();
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  const supportPath = localizedPath(
    user?.role === 'vendeur' ? '/vendeur/tableau-de-bord/support' : '/acheteur/tableau-de-bord/support',
    language
  );

  return (
    <div className="flex-1 w-full p-6 sm:p-12 font-sans bg-white">
      <div className="max-w-2xl mx-auto rounded-[16px] border border-red-200 bg-red-50 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[48px] h-[48px] rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold shrink-0">
            ⚠️
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-800 uppercase tracking-wider font-heading">
              Compte suspendu
            </h2>
            <p className="text-xs text-red-600">
              L'accès à la plateforme est temporairement restreint.
            </p>
          </div>
        </div>

        {user?.pendingCommission ? (
          <div className="space-y-4">
            <p className="text-sm text-red-800 leading-relaxed">
              Votre compte a été suspendu suite au dépassement du délai de procédure. Pour réactiver votre compte et débloquer vos accès, vous devez régler les frais de dossier d'un montant de <strong>{formatEuros(user.pendingCommission.amount, language)}</strong>.
            </p>

            {checkoutOpen ? (
              <div className="mt-4 bg-white p-4 rounded-xl border border-red-200 text-left">
                <PendingCommissionCheckout onCancel={() => setCheckoutOpen(false)} />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  className="btn bg-red-600 text-white hover:bg-red-700 border-red-600 text-xs font-bold uppercase tracking-wide px-6 py-3 rounded-[9px] cursor-pointer"
                >
                  💳 Régler les frais et réactiver
                </button>
                <Link
                  href={supportPath}
                  className="btn bg-white text-red-800 border-red-300 hover:bg-red-100 text-xs font-bold uppercase tracking-wide px-6 py-3 rounded-[9px] text-center"
                >
                  💬 Contacter le Support
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-red-800 leading-relaxed">
              Votre compte a été suspendu par l'administration. Vos accès aux enchères et fonctionnalités sont actuellement bloqués.
            </p>
            <div className="pt-2">
              <Link
                href={supportPath}
                className="btn bg-red-600 text-white hover:bg-red-700 border-red-600 text-xs font-bold uppercase tracking-wide px-6 py-3 rounded-[9px] inline-flex items-center gap-2"
              >
                💬 Accéder au Support & Ouvrir une requête
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
