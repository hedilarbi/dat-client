'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../../components/LayoutWrapper';
import { localizedPath, canonicalPathFromPathname, useLanguage } from '../../i18n';

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const canonicalPath = canonicalPathFromPathname(pathname);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'acheteur')) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(canonicalPath)}`, language));
    }
  }, [loading, user, router, language, canonicalPath]);

  if (loading || !user) return null;

  const navItems = [
    { href: '/acheteur/tableau-de-bord', label: 'Tableau de bord', exact: true },
    ...(user.status !== 'suspendu' ? [{ href: '/acheteur/tableau-de-bord/mes-offres', label: 'Mes offres', exact: false }] : []),
    { href: '/acheteur/tableau-de-bord/mes-vehicules', label: 'Mes véhicules', exact: false },
    { href: '/acheteur/tableau-de-bord/profil', label: 'Mon profil', exact: false },
    { href: '/acheteur/tableau-de-bord/support', label: 'Support', exact: false },
  ];

  return (
    <div className="flex flex-col md:flex-row flex-1 w-full bg-[#f8f7f2] min-h-0">
      <aside className="w-[220px] shrink-0 bg-[#13243c] p-[28px_18px] flex-col select-none overflow-y-auto hidden md:flex">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? canonicalPath === item.href 
              : canonicalPath.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={localizedPath(item.href, language)}
                className={`flex items-center px-[14px] py-[12px] rounded-[9px] font-[500] text-[14px] transition ${
                  isActive 
                    ? 'bg-[#1c3050] text-white font-semibold' 
                    : 'text-[#9fb0c9] hover:bg-[#1a2b44]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden bg-white border-b border-[#eceadf] flex overflow-x-auto p-4 gap-2 sticky top-0 z-10">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? canonicalPath === item.href 
            : canonicalPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={localizedPath(item.href, language)}
              className={`flex items-center shrink-0 h-10 px-4 rounded-[8px] text-[12px] font-bold uppercase tracking-[0.03em] transition-all duration-200 ${
                isActive 
                  ? 'bg-[#13243c] text-white shadow-md' 
                  : 'text-[#111827] bg-[#f8f7f2] border border-[#eceadf]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
