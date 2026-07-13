'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRoleRegisterPath, localizedPath, useLanguage } from '../i18n';

// /register n'a plus de contenu propre : chaque rôle a sa route dédiée (/register/acheteur,
// /register/vendeur). Cette page ne sert qu'à rediriger les liens/anciens favoris, en
// conservant l'ancien ?role= et ?step= s'ils sont présents.
function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  useEffect(() => {
    const role = searchParams.get('role') === 'vendeur' ? 'vendeur' : 'acheteur';
    const step = searchParams.get('step');
    const target = getRoleRegisterPath(role) + (step ? `?step=${step}` : '');
    router.replace(localizedPath(target, language));
  }, [router, searchParams, language]);

  return null;
}

export default function RegisterRedirectPage() {
  return (
    <Suspense fallback={null}>
      <RegisterRedirect />
    </Suspense>
  );
}
