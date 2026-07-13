'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../api';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { localizedPath, useLanguage } from '../i18n';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail }),
      });

      router.push(
        localizedPath(
          `/forgot-password/reset?email=${encodeURIComponent(normalizedEmail)}&sent=1`,
          language
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('forgotPassword.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-white rounded-[10px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.14)] p-8 sm:p-[40px_36px] font-sans text-black">
      <form onSubmit={handleRequestCode}>
        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#a3987f] mb-2">
          {t('forgotPassword.title')}
        </div>
        <h2 className="text-[26px] font-bold font-heading uppercase text-[#13243c] mb-[10px]">
          {t('forgotPassword.heading')}
        </h2>
        <p className="text-[14px] text-[#5a5e66] mb-[24px]">
          {t('forgotPassword.description')}
        </p>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">
          {t('login.emailLabel')}
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none focus:ring-1 focus:ring-[#d9704f] mb-6"
          placeholder={t('register.professionalEmailPlaceholder')}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-[9px] bg-[#13243c] hover:bg-slate-800 text-white text-[15px] font-bold uppercase tracking-[0.03em] transition disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2"
        >
          {loading && <Spinner />}
          {loading ? t('forgotPassword.sending') : t('forgotPassword.sendCode')}
        </button>

        <div className="text-center mt-6">
          <Link href={localizedPath('/login', language)} className="text-[13px] font-semibold text-[#d9704f] hover:underline">
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}
