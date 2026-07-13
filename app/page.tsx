'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRoleLoginPath, getRoleRegisterPath, localizedPath, useLanguage } from "./i18n";
import FilterPills from "./components/FilterPills";

export default function Home() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [role, setRole] = useState<'acheteur' | 'vendeur'>('acheteur');

  // Le français reste sur "/" (langue par défaut) ; l'anglais choisi précédemment
  // redirige automatiquement vers "/en" pour rester cohérent avec le reste du site.
  useEffect(() => {
    if (language === 'en') {
      router.replace('/en');
    }
  }, [language, router]);

  return (
    <div className="flex flex-col flex-1 min-h-full bg-white font-sans text-black p-6 sm:p-12">
      <main className="w-full flex-1 flex flex-col justify-center text-center space-y-8">
        <h1 className="text-3xl font-extrabold uppercase text-[#13243C]">{t('home.title')}</h1>
        <p className="text-sm text-gray-500 max-w-3xl mx-auto">
          {t('home.description')}
        </p>

        <div className="flex justify-center">
          <FilterPills
            options={[
              { value: 'acheteur', label: t('home.buyerSpace') },
              { value: 'vendeur', label: t('home.sellerSpace') },
            ]}
            value={role}
            onChange={setRole}
            baseClassName="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition"
            activeClassName="bg-[#13243C] text-white"
            inactiveClassName="bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={localizedPath(getRoleLoginPath(role), language)}
            className="w-full py-2.5 bg-[#13243C] text-white font-bold rounded uppercase text-sm hover:bg-slate-800 transition"
          >
            {t('home.login')}
          </Link>
          <Link
            href={localizedPath(getRoleRegisterPath(role), language)}
            className="w-full py-2.5 bg-[#D9704F] text-white font-bold rounded uppercase text-sm hover:bg-[#c26040] transition"
          >
            {t('home.register')}
          </Link>
        </div>

        <div className="border-t pt-4 text-xs text-gray-400">
          {t('home.proOnly')}
        </div>
      </main>
    </div>
  );
}
