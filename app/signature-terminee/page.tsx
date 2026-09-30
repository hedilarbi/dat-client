'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '../api';
import { useUser } from '../components/LayoutWrapper';
import Spinner from '../components/Spinner';
import { getBuyingPaths, getRoleHomePath, localizedPath, useLanguage } from '../i18n';

// Page de retour de la plateforme de signature (options.ui.completeUrl côté serveur). L'adresse
// est commune au vendeur et à l'acheteur : le serveur relit la signature et indique de quel côté
// est l'utilisateur, qui est renvoyé sur sa page de vente. Sans session (lien ouvert depuis
// l'application mobile ou un autre appareil), un simple message confirme qu'il n'a plus rien à faire.
function SignatureReturn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleId = searchParams.get('vente');
  const { user, loading } = useUser();
  const { language, t } = useLanguage();
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);
  // La langue du compte peut s'appliquer pendant l'appel : la redirection prend la plus récente.
  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    if (loading || !user || !saleId || startedRef.current) return;
    startedRef.current = true;
    apiRequest(`/sales/${encodeURIComponent(saleId)}/esignature/sync`, { method: 'POST' })
      .then((res) => {
        const salesPath = res.side === 'seller' ? '/vendeur/ventes' : getBuyingPaths(user.role).purchases;
        router.replace(localizedPath(`${salesPath}/${saleId}?signature=retour`, languageRef.current));
      })
      .catch(() => setFailed(true));
  }, [loading, user, saleId, router]);

  if (!failed && (loading || (user && saleId))) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 px-4 text-sm text-[#5a5e66]">
        <Spinner />
        {t('signatureReturn.checking')}
      </div>
    );
  }

  const returnPath = localizedPath(`/signature-terminee${saleId ? `?vente=${encodeURIComponent(saleId)}` : ''}`, language);
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-[14px] border border-[#dcd7cb] bg-white p-6">
        <p className="text-2xl text-[#2f6f4f]" aria-hidden="true">✓</p>
        <h1 className="mt-2 font-heading text-[20px] font-bold text-[#13243c]">{t('signatureReturn.title')}</h1>
        <p className="mt-3 text-sm leading-6 text-[#5a5e66]">{t('signatureReturn.text')}</p>
        <Link
          href={user
            ? localizedPath(getRoleHomePath(user.role), language)
            : localizedPath(`/login?next=${encodeURIComponent(returnPath)}`, language)}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[9px] bg-[#13243c] px-5 text-[13px] font-bold text-white transition hover:bg-[#203a61]"
        >
          {t(user ? 'signatureReturn.dashboard' : 'signatureReturn.login')}
        </Link>
      </div>
    </div>
  );
}

export default function SignatureReturnPage() {
  return (
    <Suspense fallback={null}>
      <SignatureReturn />
    </Suspense>
  );
}
