'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../api';
import { useUser } from '../components/LayoutWrapper';
import { getRoleHomePath, getRoleLoginPath, getRoleRegisterPath, localizedPath, useLanguage } from '../i18n';
import PasswordInput from '../components/PasswordInput';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import Link from 'next/link';

export default function LoginForm({ role }: { role: 'acheteur' | 'vendeur' }) {
  const router = useRouter();
  const { user, refreshProfile } = useUser();
  const { language, t } = useLanguage();
  const otherRole = role === 'acheteur' ? 'vendeur' : 'acheteur';
  const forgotPasswordPath = localizedPath('/forgot-password', language);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Déjà connecté : renvoi hors de la page de connexion
  useEffect(() => {
    if (!user) return;
    const nextPath = user.status === 'brouillon' && user.emailVerified
      ? localizedPath(`${getRoleRegisterPath(user.role)}?step=documents`, language)
      : localizedPath(getRoleHomePath(user.role), language);
    router.replace(nextPath);
  }, [user, router, language]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      setMessage(t('login.successMessage'));
      localStorage.setItem('userRole', res.user.role);

      // Refresh context profile
      await refreshProfile();

      const nextPath = res.user.status === 'brouillon' && res.user.emailVerified
        ? localizedPath(`${getRoleRegisterPath(res.user.role)}?step=documents`, language)
        : localizedPath(getRoleHomePath(res.user.role), language);

      setTimeout(() => {
        router.push(nextPath);
      }, 1200);
    } catch (err: any) {
      if (err.code === 'auth.email_not_verified') {
        setError(t('login.emailNotVerified'));
        localStorage.setItem('verifyEmail', email);
        setTimeout(() => {
          router.push(localizedPath(`${getRoleRegisterPath(role)}?step=otp`, language));
        }, 2000);
      } else if (err.code === 'auth.role_mismatch') {
        setError(t('login.roleMismatch'));
      } else {
        setError(err.message || t('login.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 bg-white flex flex-col lg:flex-row font-sans">
      {/* Left Info Panel (Dark blue) - covers the whole screen height, more width */}
      <div className="w-full lg:w-[420px] xl:w-[480px] bg-[#13243c] p-8 sm:p-10 lg:p-[64px_48px] flex flex-col justify-between select-none shrink-0">
        <div className="  flex items-center justify-center text-[9px] font-semibold tracking-widest uppercase text-[#8ea0bd]">

        </div>

        <div>

          <h2 className="text-[34px] font-bold font-heading uppercase text-white leading-[1.1] mb-[16px]">
            {role === 'acheteur' ? t('login.buyerHeadline') : t('login.sellerHeadline')}
          </h2>
          <p className="text-[14px] font-semibold text-white leading-[1.6]">
            {role === 'acheteur' ? t('login.buyerDescription') : t('login.sellerDescription')}
          </p>
        </div>

        <div className="text-[12px] font-medium text-[#7e90ac]">

        </div>
      </div>

      {/* Right Login Panel - centers the form content */}
      <div className="flex-1 p-6 sm:p-10 lg:p-16 flex items-center justify-center bg-white text-black">
        <div className="w-full max-w-[440px] flex flex-col justify-center">
          <h2 className="text-[32px] font-bold font-heading uppercase text-[#13243c] mb-[6px]">
            {t('login.title')}
          </h2>


          {error && <Alert variant="error" className="mb-4">{error}</Alert>}
          {message && <Alert variant="success" className="mb-4">{message}</Alert>}

          <form onSubmit={handleLogin} className="space-y-[18px]">
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-[8px]">
                {t('login.emailLabel')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[48px] border border-[#dcd7cb] rounded-[9px] px-[16px] text-[14px] text-[#1a2230] focus:outline-none focus:ring-1 focus:ring-[#d9704f]"
                placeholder={role === 'acheteur' ? 'contact@garage-meunier.fr' : 'contact@vhu-nord.fr'}
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-[8px]">
                {t('login.passwordLabel')}
              </label>
              <PasswordInput
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[48px] border border-[#dcd7cb] rounded-[9px] px-[16px] text-[14px] text-[#1a2230] focus:outline-none focus:ring-1 focus:ring-[#d9704f]"
                placeholder="••••••••••"
              />
            </div>

            <div className="flex justify-end text-[13px]">
              <a
                href={forgotPasswordPath}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(forgotPasswordPath);
                }}
                className="text-[#8a8270] hover:underline"
              >
                {t('login.forgotPassword')}
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-[52px] rounded-[9px] text-white text-[15px] font-bold uppercase tracking-[0.03em] flex items-center justify-center gap-2 transition disabled:opacity-50 select-none cursor-pointer ${role === 'acheteur'
                ? 'bg-[#d9704f] hover:bg-[#c26040]'
                : 'bg-[#13243c] hover:bg-[#1f375a]'
                }`}
            >
              {loading && <Spinner />}
              {loading ? t('login.submitting') : t('login.submit')}
            </button>
          </form>

          <div className="text-center text-[14px] text-[#5a5e66] mt-[22px]">
            {t('login.noAccount')}{' '}
            <Link href={localizedPath(getRoleRegisterPath(role), language)} className="text-[#d9704f] font-semibold hover:underline">
              {t('login.createAccountWithRole', { role: t(`role.${role}`) })}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
