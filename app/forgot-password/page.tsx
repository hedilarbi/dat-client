'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../api';
import { useUser } from '../components/LayoutWrapper';
import { getRoleHomePath, localizedPath, useLanguage } from '../i18n';
import PasswordInput from '../components/PasswordInput';
import OtpCodeInput from '../components/OtpCodeInput';
import Alert from '../components/Alert';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { refreshProfile } = useUser();
  const { language, t } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(t('forgotPassword.codeSentSuccess'));
      setStep(2);
    } catch (err: any) {
      setError(err.message || t('forgotPassword.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code: otpCode, newPassword }),
      });
      setMessage(t('forgotPassword.resetSuccess'));
      await refreshProfile();
      setTimeout(() => {
        router.push(localizedPath(getRoleHomePath(res.user.role), language));
      }, 1200);
    } catch (err: any) {
      setError(err.message || t('forgotPassword.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-white rounded-[10px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.14)] p-8 sm:p-[40px_36px] font-sans text-black">
      {step === 1 ? (
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
          {message && <Alert variant="success" className="mb-4">{message}</Alert>}

          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('login.emailLabel')}</label>
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
            className="w-full h-[52px] rounded-[9px] bg-[#13243c] hover:bg-slate-800 text-white text-[15px] font-bold uppercase tracking-[0.03em] transition disabled:opacity-50 select-none cursor-pointer"
          >
            {loading ? t('forgotPassword.sending') : t('forgotPassword.sendCode')}
          </button>

          <div className="text-center mt-6">
            <Link href={localizedPath('/login', language)} className="text-[13px] font-semibold text-[#d9704f] hover:underline">
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#a3987f] mb-2">
            {t('forgotPassword.verification')}
          </div>
          <h2 className="text-[26px] font-bold font-heading uppercase text-[#13243c] mb-[10px]">
            {t('forgotPassword.newPasswordTitle')}
          </h2>
          <p className="text-[14px] text-[#5a5e66] mb-[24px]">
            {t('forgotPassword.codeSentPrefix')} <strong className="text-[#13243c]">{email}</strong>{t('forgotPassword.codeSentSuffix')}
          </p>

          {error && <Alert variant="error" className="mb-4">{error}</Alert>}
          {message && <Alert variant="success" className="mb-4">{message}</Alert>}

          <div className="mb-5">
            <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('forgotPassword.verificationCodeLabel')}</label>
            <OtpCodeInput value={otpCode} onChange={setOtpCode} size="md" />
          </div>

          <div className="mb-5">
            <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('forgotPassword.newPasswordTitle')}</label>
            <PasswordInput
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
              placeholder="••••••••••••"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.confirmPassword')}</label>
            <PasswordInput
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full h-[52px] rounded-[9px] bg-[#d9704f] hover:bg-[#c26040] text-white text-[15px] font-bold uppercase tracking-[0.03em] transition disabled:opacity-50 select-none cursor-pointer"
          >
            {loading ? t('register.validating') : t('forgotPassword.resetButton')}
          </button>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13px] font-semibold text-[#8a8270] hover:underline"
            >
              {t('forgotPassword.resendCode')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
