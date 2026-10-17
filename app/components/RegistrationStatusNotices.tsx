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

/** Met en gras la première phrase (« Votre demande de modification de compte a été soumise. »). */
function FirstSentenceBold({ text }: { text: string }) {
  const end = text.indexOf('. ');
  if (end === -1) return <strong>{text}</strong>;
  return <><strong className="font-bold text-[#13243c]">{text.slice(0, end + 1)}</strong>{text.slice(end + 1)}</>;
}

/** Texte d'un modèle contenant {amount}, avec le montant mis en gras. */
export function StrongAmount({ template, amount }: { template: string; amount: string }) {
  const [before, after = ''] = template.split('{amount}');
  return <>{before}<strong>{amount}</strong>{after}</>;
}

export function UnderReviewNotice() {
  const { t } = useLanguage();
  const { user } = useUser();
  // Un compte déjà validé qui a modifié son profil n'est pas « en cours d'inscription »
  const modification = isModificationReview(user);
  return (
    <div className="flex-1 w-full p-6 sm:p-12 text-black font-sans text-center bg-white">
      <div className="w-[60px] h-[60px] rounded-full bg-[#eef1f5] text-[#13243c] flex items-center justify-center text-2xl mx-auto mb-4 font-bold">
        ⏳
      </div>
      <h3 className="text-xl font-bold uppercase text-[#13243c] mb-2">{t(modification ? 'notice.profileReviewTitle' : 'notice.reviewTitle')}</h3>
      <p className="text-sm text-[#5a5e66] leading-[1.6] mb-4">
        {modification ? <FirstSentenceBold text={t('notice.profileReviewDescription')} /> : t('notice.reviewDescription')}
      </p>
      <p className="text-xs text-gray-400">
        {t(modification ? 'notice.profileReviewFooter' : 'notice.reviewFooter')}
      </p>
    </div>
  );
}

/**
 * Bandeau affiché dans l'espace d'un compte validé dont les modifications de profil attendent la
 * décision de l'admin : il peut finir ses ventes en cours, pas lancer de nouvelle action.
 */
export function ProfileReviewBanner() {
  const { t } = useLanguage();
  const { user } = useUser();
  if (!isProfileReviewPending(user)) return null;
  return (
    <div className="mb-6 rounded-[12px] border-l-4 border-[#e2a175] bg-[#fdf3ec] p-4 sm:p-5" role="status">
      <div className="text-[13px] font-extrabold uppercase tracking-[0.05em] text-[#8a4b24]">⏳ {t('notice.profileReviewTitle')}</div>
      <p className="mt-1.5 text-[13px] leading-6 text-[#8a4b24]"><FirstSentenceBold text={t('notice.profileReviewDescription')} /></p>
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
import { isModificationReview, isProfileReviewPending } from '../lib/userAccess';
import { localizedPath } from '../i18n';

export function SuspendedNotice() {
  const { user } = useUser();
  const { language, t } = useLanguage();
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
              {t('suspended.title')}
            </h2>
            <p className="text-xs text-red-600">
              {t('suspended.subtitle')}
            </p>
          </div>
        </div>

        {user?.pendingCommission ? (
          <div className="space-y-4">
            <p className="text-sm text-red-800 leading-relaxed">
              {user.pendingCommission.reason === 'penalite_etape_2'
                ? <StrongAmount template={t('suspended.penaltyStep2')} amount={formatEuros(user.pendingCommission.amount, language)} />
                : <StrongAmount template={t('suspended.penaltyStep1')} amount={formatEuros(user.pendingCommission.amount, language)} />}
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
                  {t('suspended.payAndReactivate')}
                </button>
                <Link
                  href={supportPath}
                  className="btn bg-white text-red-800 border-red-300 hover:bg-red-100 text-xs font-bold uppercase tracking-wide px-6 py-3 rounded-[9px] text-center"
                >
                  {t('suspended.contactSupport')}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-red-800 leading-relaxed">
              {t('suspended.byAdmin')}
            </p>
            <div className="pt-2">
              <Link
                href={supportPath}
                className="btn bg-red-600 text-white hover:bg-red-700 border-red-600 text-xs font-bold uppercase tracking-wide px-6 py-3 rounded-[9px] inline-flex items-center gap-2"
              >
                {t('suspended.openSupport')}
              </Link>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-red-200 text-xs text-red-700 font-medium">
          {t('suspended.ongoingSalesInfo')}
        </div>
      </div>
    </div>
  );
}
