'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PhoneInput from 'react-phone-number-input';
import { apiRequest } from '../api';
import { useUser } from '../components/LayoutWrapper';
import { getRoleHomePath, getRoleRegisterPath, localizedPath, useLanguage } from '../i18n';
import PasswordInput from '../components/PasswordInput';
import OtpCodeInput from '../components/OtpCodeInput';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import DocumentUploadRow from '../components/DocumentUploadRow';
import { countries } from '../lib/countries';

type DocumentType = 'kbis' | 'cinRecto' | 'cinVerso' | 'rib';

export default function RegisterForm({ role }: { role: 'acheteur' | 'vendeur' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshProfile } = useUser();
  const { language, t } = useLanguage();
  const otherRole = role === 'acheteur' ? 'vendeur' : 'acheteur';

  // Step state: 1, 2 (OTP), 3 (Documents), 4 (Bank info - Vendeur only)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [activityType, setActivityType] = useState(role === 'vendeur' ? 'Centre VHU' : 'Garagiste');
  const [phone, setPhone] = useState('');

  // Step 2 OTP
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(45);

  // Step 3 Documents (Common)
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');
  const [postalCode, setPostalCode] = useState('');
  const [kbisUrl, setKbisUrl] = useState('');
  const [cinRectoUrl, setCinRectoUrl] = useState('');
  const [cinVersoUrl, setCinVersoUrl] = useState('');
  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [cinRectoFile, setCinRectoFile] = useState<File | null>(null);
  const [cinVersoFile, setCinVersoFile] = useState<File | null>(null);
  const [vhuNumber, setVhuNumber] = useState('');

  // Step 4 Bank Info (Vendeur only)
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [ribUrl, setRibUrl] = useState('');
  const [ribFile, setRibFile] = useState<File | null>(null);

  // UI States
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const s = searchParams.get('step');
    if (s === 'otp') {
      const savedEmail = localStorage.getItem('verifyEmail');
      if (savedEmail) setEmail(savedEmail);
      // useSearchParams() isn't guaranteed referentially stable across every re-render (any
      // router activity elsewhere in the app can retrigger this effect), so this must never
      // regress an already-advanced step back down to the OTP screen.
      setStep(prev => (prev === 1 ? 2 : prev));
    }
  }, [searchParams]);

  useEffect(() => {
    const requestedStep = searchParams.get('step');
    if (requestedStep !== 'documents' || !user || !user.emailVerified || user.role !== role) return;

    setActivityType(user.activityType || (role === 'vendeur' ? 'Centre VHU' : 'Garagiste'));
    setEmail(user.email || '');
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setCompanyName(user.companyName || '');
    setPhone(user.phone || '');
    setStreet(user.address?.street || '');
    setCity(user.address?.city || '');
    setCountry(user.address?.country || 'France');
    setPostalCode(user.address?.postalCode || '');
    setKbisUrl(user.kbisUrl || '');
    setCinRectoUrl(user.cinRectoUrl || '');
    setCinVersoUrl(user.cinVersoUrl || '');
    setVhuNumber(user.vhuNumber || '');
    setBankName(user.bankInfo?.bankName || '');
    setAccountHolder(user.bankInfo?.accountHolder || '');
    setIban(user.bankInfo?.iban || '');
    setBic(user.bankInfo?.bic || '');
    setRibUrl(user.bankInfo?.ribUrl || '');
    // Same idempotency concern as the OTP-resume effect above: never regress a further step
    // (4, bank info) back down to 3 if this effect re-fires.
    setStep(prev => (prev < 3 ? 3 : prev));
  }, [searchParams, user, role]);

  // Déjà connecté avec une inscription déjà complétée : renvoi hors de la page d'inscription
  // (un utilisateur en brouillon, ou repris via ?step=otp / ?step=documents, reste sur place)
  useEffect(() => {
    if (!user) return;
    const requestedStep = searchParams.get('step');
    if (requestedStep === 'otp' || requestedStep === 'documents') return;
    if (user.status === 'brouillon') return;
    router.replace(localizedPath(getRoleHomePath(user.role), language));
  }, [user, searchParams, router, language]);

  // Handle OTP countdown timer
  useEffect(() => {
    if (step === 2 && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, otpTimer]);

  // Handler Step 1
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!phone) {
      setError(t('register.phoneRequired'));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      await apiRequest('/auth/register-step1', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          companyName,
          activityType,
          phone,
          role,
          language,
        }),
      });

      localStorage.setItem('verifyEmail', email);
      setMessage(t('register.step1Success'));
      setOtpTimer(45);
      setTimeout(() => {
        setStep(2);
      }, 1000);
    } catch (err: any) {
      setError(err.message || t('register.genericError'));
    } finally {
      setLoading(false);
    }
  };

  // Handler Step 2 (Verify OTP)
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email || localStorage.getItem('verifyEmail'),
          code: otpCode,
        }),
      });

      setMessage(t('register.otpSuccess'));
      localStorage.setItem('userRole', res.user.role);
      await refreshProfile();

      setTimeout(() => {
        setStep(3);
      }, 1000);
    } catch (err: any) {
      setError(err.message || t('register.otpError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    try {
      const res = await apiRequest('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email || localStorage.getItem('verifyEmail') }),
      });
      setMessage(res.message || t('register.resendOtp'));
      setOtpTimer(45);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    if (docType === 'kbis') {
      setKbisFile(file);
      setKbisUrl('');
    }
    if (docType === 'cinRecto') {
      setCinRectoFile(file);
      setCinRectoUrl('');
    }
    if (docType === 'cinVerso') {
      setCinVersoFile(file);
      setCinVersoUrl('');
    }
    if (docType === 'rib') {
      setRibFile(file);
      setRibUrl('');
    }
  };

  const uploadFile = async (file: File, docType: DocumentType) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const responseText = await res.text();
    let data: any = {};

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(t('register.invalidUploadResponse', { status: res.status, docType }));
      }
    }

    if (!res.ok || !data.url) {
      throw new Error(data.message || t('register.uploadError', { docType }));
    }

    return data.url as string;
  };

  const uploadSelectedDocuments = async (includeRib: boolean) => {
    if ((!kbisFile && !kbisUrl) || (!cinRectoFile && !cinRectoUrl) || (!cinVersoFile && !cinVersoUrl)) {
      throw new Error(t('register.documentsRequired'));
    }

    if (includeRib && !ribFile && !ribUrl) {
      throw new Error(t('register.ribRequired'));
    }

    setUploading('documents');

    try {
      const [nextKbisUrl, nextCinRectoUrl, nextCinVersoUrl, nextRibUrl] = await Promise.all([
        kbisFile ? uploadFile(kbisFile, 'kbis') : Promise.resolve(kbisUrl),
        cinRectoFile ? uploadFile(cinRectoFile, 'cinRecto') : Promise.resolve(cinRectoUrl),
        cinVersoFile ? uploadFile(cinVersoFile, 'cinVerso') : Promise.resolve(cinVersoUrl),
        includeRib && ribFile ? uploadFile(ribFile, 'rib') : Promise.resolve(ribUrl),
      ]);

      setKbisUrl(nextKbisUrl);
      setCinRectoUrl(nextCinRectoUrl);
      setCinVersoUrl(nextCinVersoUrl);
      if (includeRib) setRibUrl(nextRibUrl);

      return {
        kbisUrl: nextKbisUrl,
        cinRectoUrl: nextCinRectoUrl,
        cinVersoUrl: nextCinVersoUrl,
        ribUrl: nextRibUrl,
      };
    } finally {
      setUploading(null);
    }
  };

  // Handler Step 3 (Submit Documents / Address)
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'vendeur') {
      // Vendeur continues to step 4 (Bank Info)
      setStep(4);
      return;
    }

    // Acheteur submits directly
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const uploadedDocuments = await uploadSelectedDocuments(false);

      await apiRequest('/auth/register-step2', {
        method: 'POST',
        body: JSON.stringify({
          address: { street, city, country, postalCode },
          kbisUrl: uploadedDocuments.kbisUrl,
          cinRectoUrl: uploadedDocuments.cinRectoUrl,
          cinVersoUrl: uploadedDocuments.cinVersoUrl,
        }),
      });

      setMessage(t('register.completeBuyer'));
      await refreshProfile();
      setTimeout(() => {
        router.push(localizedPath('/profil', language));
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('register.submitError'));
    } finally {
      setLoading(false);
    }
  };

  // Handler Step 4 (Vendeur Submit Bank Info + Complete Registration)
  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const uploadedDocuments = await uploadSelectedDocuments(true);

      await apiRequest('/auth/register-step2', {
        method: 'POST',
        body: JSON.stringify({
          address: { street, city, country, postalCode },
          kbisUrl: uploadedDocuments.kbisUrl,
          cinRectoUrl: uploadedDocuments.cinRectoUrl,
          cinVersoUrl: uploadedDocuments.cinVersoUrl,
          vhuNumber: vhuNumber || undefined,
          bankInfo: { bankName, accountHolder, iban, bic, ribUrl: uploadedDocuments.ribUrl },
        }),
      });

      setMessage(t('register.completeSeller'));
      await refreshProfile();
      setTimeout(() => {
        router.push(localizedPath('/vendeur/tableau-de-bord', language));
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('register.submitError'));
    } finally {
      setLoading(false);
    }
  };

  // Render Step wizard indicators
  const stepsList = role === 'acheteur'
    ? [t('register.stepInfo'), t('register.stepVerify'), t('register.stepDocuments')]
    : [t('register.stepInfo'), t('register.stepVerify'), t('register.stepDocuments'), t('register.stepBank')];

  const currentStepIndex = step - 1;
  const hasKbisDocument = Boolean(kbisFile || kbisUrl);
  const hasCinRectoDocument = Boolean(cinRectoFile || cinRectoUrl);
  const hasCinVersoDocument = Boolean(cinVersoFile || cinVersoUrl);
  const hasRibDocument = Boolean(ribFile || ribUrl);

  return (
    <div className="max-w-[1240px] w-full bg-white rounded-[10px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.14)] font-sans text-black flex flex-col">
      {/* Steps Wizard Progress Bar */}
      <div className="px-6 sm:px-12 pt-6 sm:pt-[36px] pb-6 border-b border-[#efece3]">

        <h2 className="text-[30px] font-bold font-heading uppercase text-[#13243c] mb-6">
          {step === 1 && t('register.professionalInfo')}
          {step === 2 && t('register.verifyAccount')}
          {step === 3 && t('register.documents')}
          {step === 4 && t('register.bankInfo')}
        </h2>

        {/* Wizard circles */}
        <div className="flex items-center gap-0 overflow-x-auto">
          {stepsList.map((label, i) => {
            const done = i < currentStepIndex;
            const active = i === currentStepIndex;
            const isLast = i === stepsList.length - 1;

            const circleBg = done ? '#2f6f4f' : active ? '#d9704f' : '#fff';
            const circleColor = (done || active) ? '#fff' : '#9a917d';
            const circleBorder = done ? '#2f6f4f' : active ? '#d9704f' : '#dcd7cb';
            const textColor = active ? '#13243c' : '#5a5e66';
            const connectorColor = done ? '#2f6f4f' : '#dcd7cb';

            return (
              <div key={i} className="flex items-center" style={{ flex: isLast ? 0 : 1 }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-[30px] h-[30px] shrink-0 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300"
                    style={{ background: circleBg, color: circleColor, border: `2px solid ${circleBorder}` }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="hidden sm:inline text-[13px] font-semibold whitespace-nowrap transition-colors duration-300" style={{ color: textColor }}>
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <div className="h-[2px] flex-1 mx-4 min-w-[30px] transition-colors duration-300" style={{ background: connectorColor }}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <Alert variant="error" className="mx-12 mt-4">{error}</Alert>}
      {message && <Alert variant="success" className="mx-12 mt-4">{message}</Alert>}

      {/* STEP 1: Basic Info Form */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="p-6 sm:p-9 lg:p-[36px_48px_40px] space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.managerLastName')}</label>
              <input
                required
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                placeholder={t('register.managerLastNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.managerFirstName')}</label>
              <input
                required
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                placeholder={t('register.managerFirstNamePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.companyName')}</label>
            <input
              required
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
              placeholder={t('register.companyNamePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="block text-[12px] font-semibold text-[#4c5058]">{t('register.activityType')}</label>

              </div>
              <select
                value={activityType}
                onChange={e => setActivityType(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none bg-white"
              >
                {role === 'acheteur' ? (
                  <>
                    <option value="Garagiste">{t('activity.garagiste')}</option>
                    <option value="Carrossier">{t('activity.carrossier')}</option>
                    <option value="Épaviste">{t('activity.epaviste')}</option>
                    <option value="Exportateur">{t('activity.exportateur')}</option>
                    <option value="Centre VHU">{t('activity.centreVhu')}</option>
                  </>
                ) : (
                  <>
                    <option value="Centre VHU">{t('activity.centreVhuCasse')}</option>
                    <option value="Concessionnaire">{t('activity.concessionnaire')}</option>
                    <option value="Assureur">{t('activity.assureur')}</option>
                    <option value="Gestionnaire de flotte">{t('activity.gestionnaireFlotte')}</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.phone')}</label>
              <PhoneInput
                international
                defaultCountry="FR"
                countryCallingCodeEditable={false}
                value={phone}
                onChange={value => setPhone(value || '')}
                className="phone-input w-full"
                placeholder={t('register.phonePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.professionalEmail')}</label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
              placeholder={t('register.professionalEmailPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.passwordLabel')}</label>
              <PasswordInput
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                placeholder="••••••••••••"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.confirmPassword')}</label>
              <PasswordInput
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#efece3] flex justify-between items-center">

            <div></div>
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-8 bg-[#13243c] hover:bg-slate-800 text-white font-bold rounded-[9px] uppercase tracking-[0.03em] transition disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? t('register.validating') : t('register.continue')}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: OTP Verification Form */}
      {step === 2 && (
        <div className="p-6 sm:p-9 lg:p-[36px_48px_40px] bg-white min-h-[460px]">
          <form onSubmit={handleVerifyOtpSubmit} className="w-full bg-white text-center">
            <div className="w-[64px] h-[64px] rounded-full bg-[#fdece4] flex items-center justify-center mx-auto mb-5 text-[26px] font-bold font-heading text-[#d9704f]">
              @
            </div>
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#a3987f] mb-[10px]">
              {t('register.accountVerification')}
            </div>
            <h2 className="text-[30px] font-bold font-heading uppercase text-[#13243c] mb-[10px]">
              {t('register.enterCodeTitle')}
            </h2>
            <p className="text-[14px] text-[#5a5e66] mb-[30px]">
              {t('register.codeSentTo')} <strong className="text-[#13243c]">{email}</strong>
            </p>

            <div className="max-w-[280px] mx-auto mb-7">
              <OtpCodeInput value={otpCode} onChange={setOtpCode} size="lg" />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full h-[52px] rounded-[9px] bg-[#d9704f] hover:bg-[#c26040] text-white text-[15px] font-bold uppercase tracking-[0.03em] mb-4 disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? t('register.verifying') : t('register.verify')}
            </button>

            <div className="text-[13px] text-[#8a8270]">
              {t('register.codeNotReceived')}{' '}
              {otpTimer > 0 ? (
                <span className="text-gray-400 font-semibold">{t('register.resendCodeTimer', { seconds: otpTimer })}</span>
              ) : (
                <button type="button" onClick={handleResendOtp} className="text-[#d9704f] font-bold hover:underline">
                  {t('register.resendCode')}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Documents and Address Upload */}
      {step === 3 && (
        <form onSubmit={handleStep3Submit} className="p-6 sm:p-9 lg:p-[36px_48px_40px] space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.headOfficeAddress')}</label>
              <input
                required
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                placeholder={t('register.headOfficeAddressPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.postalCode')}</label>
              <input
                required
                type="text"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                placeholder={t('register.postalCodePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.city')}</label>
              <input
                required
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                placeholder={t('register.cityPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.country')}</label>
              <select
                required
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none bg-white"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.fr}>
                    {c[language]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {role === 'vendeur' && (
            <div>
              <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.vhuNumber')}</label>
              <input
                type="text"
                value={vhuNumber}
                onChange={e => setVhuNumber(e.target.value)}
                className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                placeholder={t('register.vhuNumberPlaceholder')}
              />
            </div>
          )}

          {/* Document upload panels */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#13243c] uppercase tracking-wider mb-4 border-b pb-2">{t('register.professionalDocuments')}</h3>

            {/* KBIS */}
            <DocumentUploadRow
              label={t('register.kbisLabel')}
              accept=".pdf"
              file={kbisFile}
              existingUrl={kbisUrl}
              onChange={e => handleFileSelection(e, 'kbis')}
            />

            {/* CIN RECTO */}
            <DocumentUploadRow
              label={t('register.cinRectoLabel')}
              accept="image/*"
              file={cinRectoFile}
              existingUrl={cinRectoUrl}
              onChange={e => handleFileSelection(e, 'cinRecto')}
              selectedLabel={t('register.selected')}
            />

            {/* CIN VERSO */}
            <DocumentUploadRow
              label={t('register.cinVersoLabel')}
              accept="image/*"
              file={cinVersoFile}
              existingUrl={cinVersoUrl}
              onChange={e => handleFileSelection(e, 'cinVerso')}
              selectedLabel={t('register.selected')}
            />
          </div>

          <div className="pt-6 border-t border-[#efece3] flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 px-6 border border-[#dcd7cb] rounded-[9px] text-[#13243c] font-semibold hover:bg-gray-50 transition"
            >
              {t('register.back')}
            </button>

            <button
              type="submit"
              disabled={loading || uploading !== null || !hasKbisDocument || !hasCinRectoDocument || !hasCinVersoDocument || !street || !city || !postalCode}
              className="h-12 px-8 bg-[#13243c] hover:bg-slate-800 text-white font-bold rounded-[9px] uppercase tracking-[0.03em] transition disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2"
            >
              {(uploading || loading) && role !== 'vendeur' && <Spinner />}
              {role === 'vendeur' ? t('register.continue') : (uploading ? t('register.uploadingDocuments') : loading ? t('register.submitting2') : t('register.finishRegistration'))}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Bank Details Form (Vendeur Only) */}
      {step === 4 && role === 'vendeur' && (
        <form onSubmit={handleStep4Submit} className="p-6 sm:p-9 lg:p-[36px_48px_40px] space-y-8">
          <div className="flex flex-col lg:flex-row gap-7">
            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.bankName')}</label>
                <input
                  required
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                  placeholder={t('register.bankNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.accountHolder')}</label>
                <input
                  required
                  type="text"
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-[#1a2230] focus:outline-none"
                  placeholder={t('register.accountHolderPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.iban')}</label>
                  <input
                    required
                    type="text"
                    value={iban}
                    onChange={e => setIban(e.target.value)}
                    className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 font-mono text-sm text-[#1a2230] focus:outline-none"
                    placeholder="FR76..."
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#4c5058] mb-2">{t('register.bic')}</label>
                  <input
                    required
                    type="text"
                    value={bic}
                    onChange={e => setBic(e.target.value)}
                    className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 font-mono text-sm text-[#1a2230] focus:outline-none"
                    placeholder="BNPA..."
                  />
                </div>
              </div>

              {/* RIB document upload */}
              <div>
                <DocumentUploadRow
                  label={t('register.ribLabel')}
                  accept=".pdf"
                  file={ribFile}
                  existingUrl={ribUrl}
                  onChange={e => handleFileSelection(e, 'rib')}
                  maxWidthClass="max-w-[360px]"
                />
                <div className="text-[12px] text-[#9a917d] mt-2">
                  {t('register.ribNameNotice')}
                </div>
              </div>
            </div>

            {/* Right explanation panel */}
            <div className="w-full lg:w-[280px] bg-[#f1efe8] rounded-[12px] p-[22px] self-start select-none">
              <div className="font-bold text-[12px] text-[#8a8270] tracking-[0.08em] uppercase mb-3">
                {t('register.paymentTitle')}
              </div>
              <p className="text-[13px] leading-[1.6] text-[#5a5e66]">
                {t('register.paymentDescription')}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#efece3] flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="h-12 px-6 border border-[#dcd7cb] rounded-[9px] text-[#13243c] font-semibold hover:bg-gray-50 transition"
            >
              {t('register.back')}
            </button>

            <button
              type="submit"
              disabled={loading || uploading !== null || !hasRibDocument || !bankName || !accountHolder || !iban || !bic}
              className="h-12 px-8 bg-[#13243c] hover:bg-slate-800 text-white font-bold rounded-[9px] uppercase tracking-[0.03em] transition disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2"
            >
              {(uploading || loading) && <Spinner />}
              {uploading ? t('register.uploadingDocuments') : loading ? t('register.submitting2') : t('register.finishRegistration')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
