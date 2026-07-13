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
        className="h-12 px-8 bg-[#13243c] hover:bg-slate-800 text-white font-bold rounded-[9px] uppercase tracking-[0.03em] transition select-none cursor-pointer"
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
