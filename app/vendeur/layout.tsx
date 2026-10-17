'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../components/LayoutWrapper';
import { localizedPath, canonicalPathFromPathname, useLanguage } from '../i18n';
import { hasSpaceAccess } from '../lib/userAccess';

interface NavItem { href: string; label: string; exact: boolean; /** Intertitre affiché au-dessus de l'entrée dans la navigation latérale */ heading?: string; sub?: boolean }

/**
 * Squelette de l'espace vendeur, identique à celui de l'acheteur : l'en-tête du site (fourni par
 * LayoutWrapper) puis la navigation latérale et le contenu.
 */
export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const canonicalPath = canonicalPathFromPathname(pathname);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(canonicalPath)}`, language));
    }
  }, [loading, user, router, language, canonicalPath]);

  if (loading || !user) return null;
  // Un acheteur qui atteint une page vendeur est redirigé par LayoutWrapper : pas de navigation vendeur
  if (user.role !== 'vendeur') return <>{children}</>;

  const validated = hasSpaceAccess(user);
  const navItems: NavItem[] = [
    { href: '/vendeur/tableau-de-bord', label: t('nav.dashboard'), exact: true },
    ...(validated ? [
      // « Mes véhicules » regroupe les deux phases d'avant-vente : le dépôt, où le vendeur agit, et le suivi
      { href: '/vendeur/dossiers', label: t('nav.deposits'), exact: false, heading: t('nav.myVehicles'), sub: true },
      { href: '/vendeur/en-vente', label: t('nav.forSale'), exact: false, sub: true },
      { href: '/vendeur/ventes', label: t('nav.sales'), exact: false },
      // Un compte suspendu ne peut plus déposer d'offres : ses achats en cours restent suivis
      ...(user.status !== 'suspendu' ? [{ href: '/vendeur/mes-offres', label: t('nav.myOffers'), exact: false }] : []),
      { href: '/vendeur/mes-achats', label: t('nav.myPurchases'), exact: false },
    ] : []),
    { href: '/vendeur/tableau-de-bord/profil', label: t('nav.profile'), exact: true },
    { href: '/vendeur/tableau-de-bord/support', label: t('nav.support'), exact: true },
  ];

  const isActive = (item: NavItem) => (item.exact ? canonicalPath === item.href : canonicalPath.startsWith(item.href));

  return (
    <div className="flex flex-col md:flex-row flex-1 w-full bg-[#f8f7f2] min-h-0">
      <aside className="w-[220px] shrink-0 bg-[#13243c] p-[28px_18px] flex-col select-none overflow-y-auto hidden md:flex">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <React.Fragment key={item.href}>
              {item.heading && (
                <div className="mt-3 px-[14px] pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6f8f]">{item.heading}</div>
              )}
              <Link
                href={localizedPath(item.href, language)}
                className={`flex items-center ${item.sub ? 'pl-[24px] pr-[14px]' : 'px-[14px]'} py-[12px] rounded-[9px] font-[500] text-[14px] transition ${
                  isActive(item) ? 'bg-[#1c3050] text-white font-semibold' : 'text-[#9fb0c9] hover:bg-[#1a2b44]'
                }`}
              >
                {item.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden bg-white border-b border-[#eceadf] flex overflow-x-auto p-4 gap-2 sticky top-0 z-10">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={localizedPath(item.href, language)}
            className={`flex items-center shrink-0 h-10 px-4 rounded-[8px] text-[12px] font-bold uppercase tracking-[0.03em] transition-all duration-200 ${
              isActive(item) ? 'bg-[#13243c] text-white shadow-md' : 'text-[#111827] bg-[#f8f7f2] border border-[#eceadf]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
