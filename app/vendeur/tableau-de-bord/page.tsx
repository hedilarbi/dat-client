'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../api';
import { useUser } from '../../components/LayoutWrapper';
import { getRoleHomePath, localizedPath, useLanguage } from '../../i18n';
import Alert from '../../components/Alert';
import StatCard from '../../components/StatCard';
import { Badge } from '../../components/StatusBadge';
import IdentityFieldsSection from '../../components/IdentityFieldsSection';
import SimpleFileField from '../../components/SimpleFileField';
import DocumentUploadRow from '../../components/DocumentUploadRow';
import { DraftPendingNotice, UnderReviewNotice, RejectionReasonsBox, type Rejection } from '../../components/RegistrationStatusNotices';

export default function VendeurTableauDeBordPage() {
  const router = useRouter();
  const { user, loading: userLoading, refreshProfile } = useUser();
  const { language, t } = useLanguage();

  const ACTIVITY_OPTIONS = [
    { value: 'Centre VHU', label: t('activity.centreVhuCasse') },
    { value: 'Concessionnaire', label: t('activity.concessionnaire') },
    { value: 'Assureur', label: t('activity.assureur') },
    { value: 'Gestionnaire de flotte', label: t('activity.gestionnaireFlotte') },
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
  const [vhuNumber, setVhuNumber] = useState('');
  const [kbisUrl, setKbisUrl] = useState('');
  const [cinRectoUrl, setCinRectoUrl] = useState('');
  const [cinVersoUrl, setCinVersoUrl] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [ribUrl, setRibUrl] = useState('');
  const [ribFile, setRibFile] = useState<File | null>(null);
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
      setVhuNumber(user.vhuNumber || '');
      setKbisUrl(user.kbisUrl || '');
      setCinRectoUrl(user.cinRectoUrl || '');
      setCinVersoUrl(user.cinVersoUrl || '');
      if (user.bankInfo) {
        setBankName(user.bankInfo.bankName || '');
        setAccountHolder(user.bankInfo.accountHolder || '');
        setIban(user.bankInfo.iban || '');
        setBic(user.bankInfo.bic || '');
        setRibUrl(user.bankInfo.ribUrl || '');
      }
    }
  }, [user]);

  // Non connecté : renvoi vers la page de connexion
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath('/login', language));
    }
  }, [userLoading, user, router, language]);

  // Un acheteur n'a pas accès à l'espace vendeur : renvoi vers sa propre page d'accueil
  useEffect(() => {
    if (user && user.role !== 'vendeur') {
      router.replace(localizedPath(getRoleHomePath(user.role), language));
    }
  }, [user, router, language]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docType: 'kbis' | 'cinRecto' | 'cinVerso') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(docType);
    setTimeout(() => {
      const fakeUrl = `https://firebasestorage.googleapis.com/v0/b/dealsautopro.firebasestorage.app/o/${encodeURIComponent('corrected_' + docType + '_' + file.name)}?alt=media`;
      if (docType === 'kbis') setKbisUrl(fakeUrl);
      if (docType === 'cinRecto') setCinRectoUrl(fakeUrl);
      if (docType === 'cinVerso') setCinVersoUrl(fakeUrl);
      setUploading(null);
    }, 1000);
  };

  const handleRibSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRibFile(file);
    setRibUrl('');
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      let finalRibUrl = ribUrl;
      if (ribFile) {
        setUploading('rib');
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalRibUrl = `https://firebasestorage.googleapis.com/v0/b/dealsautopro.firebasestorage.app/o/${encodeURIComponent('corrected_rib_' + ribFile.name)}?alt=media`;
        setRibUrl(finalRibUrl);
        setUploading(null);
      }

      const body: any = {
        firstName,
        lastName,
        companyName,
        activityType,
        phone,
        address: { street, city, country, postalCode },
        kbisUrl,
        cinRectoUrl,
        cinVersoUrl,
        vhuNumber,
        bankInfo: { bankName, accountHolder, iban, bic, ribUrl: finalRibUrl }
      };

      await apiRequest('/auth/register-step2', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setMessage(t('profil.resubmitSuccess'));
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || t('profil.resubmitError'));
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'vendeur') return null;

  const isRefused = user.status === 'refuse';
  const isCorrectionDemandee = user.status === 'correction_demandee';
  const latestRejection = user.rejections && user.rejections.length > 0
    ? user.rejections[user.rejections.length - 1] as Rejection
    : null;

  if (user.status === 'brouillon' && user.emailVerified) {
    return (
      <DraftPendingNotice
        onResume={() => router.push(localizedPath(`/register?step=documents&role=${user.role}`, language))}
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

          <div>
            <h5 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">{t('vendeurDashboard.vhuAgreement')}</h5>
            <input type="text" placeholder={t('vendeurDashboard.vhuNumberPlaceholder')} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={vhuNumber} onChange={e => setVhuNumber(e.target.value)} />
          </div>

          <div className="space-y-4 border-t border-[#efece3] pt-4">
            <h5 className="font-bold text-xs text-gray-400 uppercase tracking-wider">{t('vendeurDashboard.bankInfo')}</h5>

            <input required type="text" placeholder={t('register.bankName')} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={bankName} onChange={e => setBankName(e.target.value)} />
            <input required type="text" placeholder={t('register.accountHolder')} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input required type="text" placeholder={t('register.iban')} className="sm:col-span-2 h-12 border border-[#dcd7cb] rounded-[9px] px-4 font-mono text-sm text-black" value={iban} onChange={e => setIban(e.target.value)} />
              <input required type="text" placeholder={t('vendeurDashboard.bic')} className="h-12 border border-[#dcd7cb] rounded-[9px] px-4 font-mono text-sm text-black" value={bic} onChange={e => setBic(e.target.value)} />
            </div>

            <DocumentUploadRow
              label={t('vendeurDashboard.ribLabel')}
              accept=".pdf"
              file={ribFile}
              existingUrl={ribUrl}
              onChange={handleRibSelection}
              maxWidthClass="max-w-[360px]"
            />
          </div>

          <div className="space-y-4 border-t border-[#efece3] pt-4">
            <h5 className="font-bold text-xs text-gray-400 uppercase tracking-wider">{t('profil.replaceDocuments')}</h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SimpleFileField label={t('profil.kbisPdf')} accept=".pdf" uploading={uploading === 'kbis'} hasValue={Boolean(kbisUrl)} onChange={e => handleFileUpload(e, 'kbis')} />
              <SimpleFileField label={t('profil.cinRecto')} accept="image/*" uploading={uploading === 'cinRecto'} hasValue={Boolean(cinRectoUrl)} onChange={e => handleFileUpload(e, 'cinRecto')} />
              <SimpleFileField label={t('profil.cinVerso')} accept="image/*" uploading={uploading === 'cinVerso'} hasValue={Boolean(cinVersoUrl)} onChange={e => handleFileUpload(e, 'cinVerso')} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploading !== null || !kbisUrl || !cinRectoUrl || !cinVersoUrl || !bankName || !accountHolder || !iban || !bic || !(ribUrl || ribFile)}
            className="w-full h-12 bg-[#d9704f] hover:bg-[#c26040] text-white font-bold rounded-[9px] uppercase text-xs disabled:opacity-50 select-none cursor-pointer"
          >
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
  const sellerDossiers = [
    { vehicle: 'Renault Trafic III · Sinistré', session: 'Session #128', maxOffer: '7 400 €', action: t('profil.view'), meta: { label: t('vendeurDashboard.statusPublished'), color: '#13243c', bg: '#eef1f5' } },
    { vehicle: 'Peugeot Boxer · Flotte', session: 'Session #126', maxOffer: '11 900 €', action: t('vendeurDashboard.actionDocuments'), meta: { label: t('vendeurDashboard.statusAwarded'), color: '#2f6f4f', bg: '#e9f4ee' } },
    { vehicle: 'Citroën Jumpy · Sinistré', session: 'Session #124', maxOffer: '4 800 €', action: t('vendeurDashboard.actionDecide'), meta: { label: t('vendeurDashboard.statusReserveNotMet'), color: '#d9704f', bg: '#fdece4' } },
    { vehicle: 'Fiat Ducato · VHU', session: 'Session #120', maxOffer: '—', action: t('vendeurDashboard.actionReschedule'), meta: { label: t('vendeurDashboard.statusUnsold'), color: '#5a5e66', bg: '#f1efe8' } },
  ];

  return (
    <div className="flex-1 w-full p-6 sm:p-[32px_40px_44px] text-black font-sans bg-white select-none">
      <div className="mb-6">
        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#a3987f] mb-2">
          {user.companyName}
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-bold font-heading uppercase text-[#13243c]">
          {t('vendeurDashboard.title')}
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7 text-black">
        <StatCard label={t('vendeurDashboard.draftsLabel')} value={2} bg="#f1efe8" labelColor="#8a8270" />
        <StatCard label={t('vendeurDashboard.pendingValidation')} value={3} bg="#faf1e4" labelColor="#b3893f" />
        <StatCard label={t('vendeurDashboard.publishedInSession')} value={5} bg="#eef1f5" labelColor="#13243c" />
        <StatCard label={t('profil.salesFinalized')} value={14} bg="#2f6f4f" labelColor="#c9e8d6" valueColor="#fff" />
      </div>

      <div className="text-[12px] font-bold text-[#8a8270] uppercase tracking-[0.06em] mb-3">
        {t('vendeurDashboard.myVehicleFiles')}
      </div>

      <div className="border border-[#eceadf] rounded-[12px] overflow-hidden bg-white overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr_120px] p-[14px_20px] bg-[#f8f7f2] text-[11px] font-bold uppercase tracking-[0.05em] text-[#8a8270]">
            <div>{t('profil.vehicle')}</div>
            <div>{t('profil.status')}</div>
            <div>{t('profil.session')}</div>
            <div>{t('vendeurDashboard.maxOffer')}</div>
            <div></div>
          </div>

          <div className="divide-y divide-[#efece3]">
            {sellerDossiers.map((row, idx) => (
              <div key={idx} className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr_120px] p-[16px_20px] items-center text-[13px] text-[#1a2230]">
                <div className="font-semibold text-[14px] text-[#13243c]">{row.vehicle}</div>
                <div><Badge style={row.meta} className="px-3 py-1.5" /></div>
                <div className="text-[#5a5e66]">{row.session}</div>
                <div className="text-[#5a5e66] font-semibold">{row.maxOffer}</div>
                <div className="font-bold text-[12px] text-[#d9704f] cursor-pointer hover:underline text-right">{row.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
