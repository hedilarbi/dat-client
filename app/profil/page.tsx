'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../api';
import { useUser } from '../components/LayoutWrapper';
import { getRoleHomePath, getRoleRegisterPath, localizedPath, useLanguage } from '../i18n';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import StatCard from '../components/StatCard';
import { Badge } from '../components/StatusBadge';
import IdentityFieldsSection from '../components/IdentityFieldsSection';
import DocumentUploadRow from '../components/DocumentUploadRow';
import { compressImageIfNeeded, MAX_UPLOAD_BYTES } from '../lib/imageCompression';
import { DraftPendingNotice, UnderReviewNotice, RejectionReasonsBox, type Rejection } from '../components/RegistrationStatusNotices';

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading: userLoading, refreshProfile } = useUser();
  const { language, t } = useLanguage();

  const ACTIVITY_OPTIONS = [
    { value: 'Garagiste', label: t('activity.garagiste') },
    { value: 'Carrossier', label: t('activity.carrossier') },
    { value: 'Épaviste', label: t('activity.epaviste') },
    { value: 'Exportateur', label: t('activity.exportateur') },
    { value: 'Centre VHU', label: t('activity.centreVhu') },
  ];

  // Correction Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [activityType, setActivityType] = useState('');
  const [phone, setPhone] = useState('');
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
  const [uploading, setUploading] = useState<string | null>(null);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setCompanyName(user.companyName || '');
      setActivityType(user.activityType || '');
      setPhone(user.phone || '');
      if (user.address) {
        setStreet(user.address.street || '');
        setCity(user.address.city || '');
        setCountry(user.address.country || 'France');
        setPostalCode(user.address.postalCode || '');
      }
      setKbisUrl(user.kbisUrl || '');
      setCinRectoUrl(user.cinRectoUrl || '');
      setCinVersoUrl(user.cinVersoUrl || '');
    }
  }, [user]);

  // Non connecté : renvoi vers la page de connexion
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath('/login', language));
    }
  }, [userLoading, user, router, language]);

  // Un vendeur n'a pas accès à /profil : renvoi vers son espace dédié
  useEffect(() => {
    if (user && user.role !== 'acheteur') {
      router.replace(localizedPath(getRoleHomePath(user.role), language));
    }
  }, [user, router, language]);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      throw new Error(data.message || t('profil.resubmitError'));
    }
    return data.url as string;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'kbis' | 'cinRecto' | 'cinVerso') => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setError('');

    const file = await compressImageIfNeeded(rawFile);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(t('shared.fileTooLarge', {
        size: (file.size / (1024 * 1024)).toFixed(1),
        maxSize: String(MAX_UPLOAD_BYTES / (1024 * 1024)),
      }));
      e.target.value = '';
      return;
    }

    if (docType === 'kbis') setKbisFile(file);
    if (docType === 'cinRecto') setCinRectoFile(file);
    if (docType === 'cinVerso') setCinVersoFile(file);

    setUploading(docType);
    try {
      const url = await uploadFile(file);
      if (docType === 'kbis') setKbisUrl(url);
      if (docType === 'cinRecto') setCinRectoUrl(url);
      if (docType === 'cinVerso') setCinVersoUrl(url);
    } catch (err: any) {
      setError(err.message || t('profil.resubmitError'));
    } finally {
      setUploading(null);
    }
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await apiRequest('/auth/register-step2', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          companyName,
          activityType,
          phone,
          address: { street, city, country, postalCode },
          kbisUrl,
          cinRectoUrl,
          cinVersoUrl
        })
      });

      setMessage(t('profil.resubmitSuccess'));
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || t('profil.resubmitError'));
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'acheteur') return null;

  const isRefused = user.status === 'refuse';
  const isCorrectionDemandee = user.status === 'correction_demandee';
  const latestRejection = user.rejections && user.rejections.length > 0
    ? user.rejections[user.rejections.length - 1] as Rejection
    : null;

  if (user.status === 'brouillon' && user.emailVerified) {
    return (
      <DraftPendingNotice
        onResume={() => router.push(localizedPath(`${getRoleRegisterPath(user.role)}?step=documents`, language))}
      />
    );
  }

  if (isRefused) {
    return (
      <div className="flex-1 w-full p-6 sm:p-8 text-black font-sans bg-white">
        <RejectionReasonsBox
          title={t('profil.refusedTitle')}
          intro={t('profil.refusedIntro')}
          rejection={latestRejection}
          footer={t('profil.refusedFooter')}
        />
      </div>
    );
  }

  if (isCorrectionDemandee) {
    return (
      <div className="flex-1 w-full p-6 sm:p-8 space-y-6 text-black font-sans bg-white">
        <RejectionReasonsBox title={t('profil.correctionTitle')} rejection={latestRejection} />

        <form onSubmit={handleResubmitSubmit} className="border-t border-[#eceadf] p-6 space-y-6">
          <h4 className="font-bold text-lg text-[#13243c] uppercase font-heading">{t('profil.correctionSpace')}</h4>

          {error && <Alert variant="error">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <IdentityFieldsSection
            firstName={firstName} onFirstNameChange={setFirstName}
            lastName={lastName} onLastNameChange={setLastName}
            companyName={companyName} onCompanyNameChange={setCompanyName}
            activityType={activityType} onActivityTypeChange={setActivityType}
            activityOptions={ACTIVITY_OPTIONS}
            phone={phone} onPhoneChange={setPhone}
          />

          <div className="space-y-4 border-t border-[#efece3] pt-4">
            <h5 className="font-bold text-xs text-gray-400 uppercase tracking-wider">{t('profil.addressToCorrect')}</h5>
            <input required type="text" placeholder={t('profil.address')} value={street} onChange={e => setStreet(e.target.value)} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input required type="text" placeholder={t('profil.city')} className="sm:col-span-2 h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={city} onChange={e => setCity(e.target.value)} />
              <input required type="text" placeholder={t('profil.postalCode')} className="h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">

            <DocumentUploadRow label={t('profil.kbisPdf')} accept=".pdf" file={kbisFile} existingUrl={kbisUrl} onChange={e => handleFileUpload(e, 'kbis')} />
            <DocumentUploadRow label={t('profil.cinRecto')} accept="image/*" file={cinRectoFile} existingUrl={cinRectoUrl} onChange={e => handleFileUpload(e, 'cinRecto')} selectedLabel={t('register.selected')} />
            <DocumentUploadRow label={t('profil.cinVerso')} accept="image/*" file={cinVersoFile} existingUrl={cinVersoUrl} onChange={e => handleFileUpload(e, 'cinVerso')} selectedLabel={t('register.selected')} />
          </div>

          <button
            type="submit"
            disabled={loading || uploading !== null || !kbisUrl || !cinRectoUrl || !cinVersoUrl}
            className="w-full h-12 bg-[#d9704f] hover:bg-[#c26040] text-white font-bold rounded-[9px] uppercase text-xs disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            {loading ? t('profil.resubmitting') : t('profil.resubmit')}
          </button>
        </form>
      </div>
    );
  }

  if (user.status !== 'valide') {
    return <UnderReviewNotice />;
  }

  // VALIDATED STATE
  const buyerOffers = [
    { vehicle: 'Renault Trafic III · Sinistré', session: 'Session #128', amount: '7 400 €', meta: { label: t('profil.statusOfferInProgress'), color: '#13243c', bg: '#eef1f5' } },
    { vehicle: 'Peugeot Boxer · Flotte', session: 'Session #126', amount: '11 200 €', meta: { label: t('profil.commissionDue'), color: '#d9704f', bg: '#fdece4' } },
    { vehicle: 'Citroën Jumpy · Sinistré', session: 'Session #124', amount: '5 250 €', meta: { label: t('profil.statusWon'), color: '#2f6f4f', bg: '#e9f4ee' } },
    { vehicle: 'Iveco Daily · Flotte', session: 'Session #121', amount: '6 800 €', meta: { label: t('profil.statusNotRetained'), color: '#5a5e66', bg: '#f1efe8' } },
  ];

  return (
    <div className="flex-1 w-full p-6 sm:p-[32px_40px_44px] text-black font-sans bg-white select-none">
      <div className="mb-6">
        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#a3987f] mb-2">
          {user.companyName}
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-bold font-heading uppercase text-[#13243c]">
          {t('profil.title')}
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7 text-black">
        <StatCard label={t('profil.offersInProgress')} value={4} bg="#faf1e4" labelColor="#b3893f" />
        <StatCard label={t('profil.offersWon')} value={2} bg="#e9f4ee" labelColor="#2f6f4f" />
        <StatCard label={t('profil.commissionDue')} value={1} bg="#fdece4" labelColor="#d9704f" />
        <StatCard label={t('profil.salesFinalized')} value={9} bg="#13243c" labelColor="#b8946a" valueColor="#fff" />
      </div>

      <div className="text-[12px] font-bold text-[#8a8270] uppercase tracking-[0.06em] mb-3">
        {t('profil.myOffers')}
      </div>

      <div className="border border-[#eceadf] rounded-[12px] overflow-hidden bg-white overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[2fr_1.2fr_1fr_1.4fr_100px] p-[14px_20px] bg-[#f8f7f2] text-[11px] font-bold uppercase tracking-[0.05em] text-[#8a8270]">
            <div>{t('profil.vehicle')}</div>
            <div>{t('profil.session')}</div>
            <div>{t('profil.amountOffered')}</div>
            <div>{t('profil.status')}</div>
            <div></div>
          </div>

          <div className="divide-y divide-[#efece3]">
            {buyerOffers.map((row, idx) => (
              <div key={idx} className="grid grid-cols-[2fr_1.2fr_1fr_1.4fr_100px] p-[16px_20px] items-center text-[13px] text-[#1a2230]">
                <div className="font-semibold text-[14px] text-[#13243c]">{row.vehicle}</div>
                <div className="text-[#5a5e66]">{row.session}</div>
                <div className="text-[#5a5e66] font-semibold">{row.amount}</div>
                <div><Badge style={row.meta} className="px-3 py-1.5" /></div>
                <div className="font-bold text-[12px] text-[#d9704f] cursor-pointer hover:underline text-right">{t('profil.view')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
