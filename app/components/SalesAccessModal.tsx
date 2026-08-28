'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { getRoleLoginPath, getRoleProfilePath, getRoleRegisterPath, localizedPath, useLanguage } from '../i18n';
import { useUser } from './LayoutWrapper';
import type { SalesAccessReason } from '../lib/currentSales';

interface SalesAccessModalProps {
  open: boolean;
  reason: SalesAccessReason;
  /** Chemin localisé de retour après connexion */
  returnPath: string;
  onClose: () => void;
}

/**
 * Modale déclenchée au moment où l'utilisateur atteint le bas de la première page sans
 * pouvoir charger la suivante : visiteur anonyme invité à s'inscrire ou se connecter,
 * compte en attente informé de sa situation.
 *
 * Elle reprend volontairement les textes de la bannière : c'est le même message, porté au
 * premier plan au moment précis où la limite est atteinte.
 */
export default function SalesAccessModal({ open, reason, returnPath, onClose }: SalesAccessModalProps) {
  const { language, t } = useLanguage();
  const { user } = useUser();

  // Fermeture au clavier, et blocage du défilement de l'arrière-plan tant que la modale est
  // ouverte : sans ça, la page continue de défiler derrière elle.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#13243c]/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sales-access-modal-title"
    >
      <div
        className="w-full max-w-[480px] rounded-[16px] bg-white p-6 text-center shadow-[0_26px_60px_rgba(0,0,0,0.28)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p
          id="sales-access-modal-title"
          className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#a3987f]"
        >
          {t('sales.lockedTitle')}
        </p>
        <p className="mx-auto mb-6 max-w-[380px] text-sm leading-6 text-[#5a5e66]">
          {reason === 'anonymous' ? t('sales.lockedAnonymous') : t('sales.lockedPending')}
        </p>

        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          {reason === 'anonymous' ? (
            <>
              <Link
                href={localizedPath(getRoleRegisterPath('acheteur'), language)}
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
    </div>
  );
}
