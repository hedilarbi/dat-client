'use client';

import React from 'react';
import Link from 'next/link';
import { getRoleLoginPath, getRoleProfilePath, getRoleRegisterPath, localizedPath, useLanguage } from '../i18n';
import { useUser } from './LayoutWrapper';
import type { SalesAccessReason } from '../lib/currentSales';

interface SalesAccessBannerProps {
  reason: SalesAccessReason;
  /** Chemin localisé de retour après connexion */
  returnPath: string;
}

/**
 * Bannière affichée en bas de liste quand l'utilisateur a atteint la limite de la première page :
 * visiteur anonyme invité à s'inscrire ou se connecter, compte en attente informé de sa situation.
 */
export default function SalesAccessBanner({ reason, returnPath }: SalesAccessBannerProps) {
  const { language, t } = useLanguage();
  const { user } = useUser();

  return (
    <div className="rounded-[16px] border border-[#eceadf] bg-[#f8f7f2] p-6 text-center sm:p-9">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#a3987f]">
        {t('sales.lockedTitle')}
      </p>
      <p className="mx-auto mb-6 max-w-[560px] text-sm leading-6 text-[#5a5e66]">
        {reason === 'anonymous' ? t('sales.lockedAnonymous') : t('sales.lockedPending')}
      </p>

      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
        {reason === 'anonymous' ? (
          <>
            <Link
              href={localizedPath(`${getRoleRegisterPath('acheteur')}`, language)}
              className="btn btn-accent w-full leading-[48px] sm:w-auto"
            >
              {t('sales.lockedRegister')}
            </Link>
            <Link
              href={localizedPath(`${getRoleLoginPath('acheteur')}?next=${encodeURIComponent(returnPath)}`, language)}
              className="btn btn-secondary w-full leading-[46px] sm:w-auto"
            >
              {t('sales.lockedLogin')}
            </Link>
          </>
        ) : (
          <Link
            href={localizedPath(getRoleProfilePath(user?.role || 'acheteur'), language)}
            className="btn btn-primary w-full leading-[48px] sm:w-auto"
          >
            {t('sales.lockedProfile')}
          </Link>
        )}
      </div>
    </div>
  );
}
