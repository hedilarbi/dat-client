'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '../../api';
import { useUser } from '../../components/LayoutWrapper';
import Alert from '../../components/Alert';
import OtpCodeInput from '../../components/OtpCodeInput';
import PasswordInput from '../../components/PasswordInput';
import Spinner from '../../components/Spinner';
import { getRoleHomePath, localizedPath, useLanguage } from '../../i18n';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useUser();
  const { language, t } = useLanguage();

  const email = searchParams.get('email')?.trim() || '';
  const codeSent = searchParams.get('sent') === '1';

  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showInitialCodeSentMessage, setShowInitialCodeSentMessage] = useState(codeSent);
  const displayedMessage = message || (showInitialCodeSentMessage ? t('forgotPassword.codeSentSuccess') : '');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setShowInitialCodeSentMessage(false);

    if (!email) {
      setError(t('forgotPassword.missingEmail'));
      return;
    }

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('forgotPassword.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError(t('forgotPassword.missingEmail'));
      return;
    }

    setResendLoading(true);
    setError('');
    setMessage('');
    setShowInitialCodeSentMessage(false);

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(t('forgotPassword.codeSentSuccess'));
      setOtpCode('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('forgotPassword.genericError'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-white rounded-[10px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.14)] p-8 sm:p-[40px_36px] font-sans text-black">
      <form onSubmit={handleResetPassword}>
        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#a3987f] mb-2">
          {t('forgotPassword.verification')}
        </div>
        <h2 className="text-[26px] font-bold font-heading uppercase text-[#13243c] mb-[10px]">
          {t('forgotPassword.newPasswordTitle')}
        </h2>
        <p className="text-[14px] text-[#5a5e66] mb-[24px]">
          {email ? (
            <>
              {t('forgotPassword.codeSentPrefix')} <strong className="text-[#13243c]">{email}</strong>{t('forgotPassword.codeSentSuffix')}
            </>
          ) : (
            t('forgotPassword.missingEmail')
          )}
        </p>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        {displayedMessage && <Alert variant="success" className="mb-4">{displayedMessage}</Alert>}

        <div className="mb-5">
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">
            {t('forgotPassword.verificationCodeLabel')}
          </label>
          <OtpCodeInput value={otpCode} onChange={setOtpCode} size="md" />
        </div>

        <div className="mb-5">
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">
            {t('forgotPassword.newPasswordTitle')}
          </label>
          <PasswordInput
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
            placeholder="••••••••••••"
          />
        </div>

        <div className="mb-6">
          <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">
            {t('register.confirmPassword')}
          </label>
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
          disabled={loading || !email || otpCode.length !== 6}
          className="w-full h-[52px] rounded-[9px] bg-[#d9704f] hover:bg-[#c26040] text-white text-[15px] font-bold uppercase tracking-[0.03em] transition disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2"
        >
          {loading && <Spinner />}
          {loading ? t('register.validating') : t('forgotPassword.resetButton')}
        </button>

        <div className="flex flex-col items-center gap-3 mt-6">
          <button
            type="button"
            disabled={resendLoading || !email}
            onClick={handleResendCode}
            className="text-[13px] font-semibold text-[#8a8270] hover:underline disabled:opacity-50"
          >
            {resendLoading ? t('forgotPassword.sending') : t('forgotPassword.resendCode')}
          </button>
          <Link href={localizedPath('/forgot-password', language)} className="text-[13px] font-semibold text-[#d9704f] hover:underline">
            {t('forgotPassword.changeEmail')}
          </Link>
        </div>
      </form>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="w-full max-w-[440px] bg-white rounded-[10px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.14)] p-8 sm:p-[40px_36px] font-sans text-black flex justify-center">
      <Spinner />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
