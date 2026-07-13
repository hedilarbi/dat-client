'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRoleLoginPath, localizedPath, useLanguage } from '../i18n';

// /login n'a plus de contenu propre : chaque rôle a sa route dédiée (/login/acheteur,
// /login/vendeur). Cette page ne sert qu'à rediriger les liens/anciens favoris, en
// conservant l'ancien ?role= s'il est présent.
function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  useEffect(() => {
    const role = searchParams.get('role') === 'vendeur' ? 'vendeur' : 'acheteur';
    router.replace(localizedPath(getRoleLoginPath(role), language));
  }, [router, searchParams, language]);

  return null;
}

export default function LoginRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LoginRedirect />
    </Suspense>
  );
}
