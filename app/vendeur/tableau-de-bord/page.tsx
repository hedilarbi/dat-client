'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { apiRequest } from '../../api';
import { useUser } from '../../components/LayoutWrapper';
import { getRoleHomePath, getRoleRegisterPath, localizedPath, useLanguage } from '../../i18n';
import Alert from '../../components/Alert';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import { Badge, getVehicleDossierStatusBadge } from '../../components/StatusBadge';
import IdentityFieldsSection from '../../components/IdentityFieldsSection';
import DocumentUploadRow from '../../components/DocumentUploadRow';
import StampReminderBanner from '../../components/StampReminderBanner';
import { DraftPendingNotice, UnderReviewNotice, RejectionReasonsBox, SuspendedNotice, type Rejection } from '../../components/RegistrationStatusNotices';
import { formatEuros } from '../../lib/format';
import type { DossierPhoto } from '../../lib/vehicleDossier';

type SellerSaleStatus = 'en_session' | 'en_cours' | 'cloturee' | 'sans_gagnant';

interface DashboardSale {
  id: string;
  status: SellerSaleStatus;
  amount: number | null;
  offerCount: number;
  /** Renseignés par le serveur pour les ventes en cours uniquement (cf. listSellerSales). */
  currentStep?: number | null;
  stepCount?: number | null;
  stepKey?: string | null;
  /** Vrai quand la vente attend une action du vendeur (cf. SELLER_ACTION_STEPS côté serveur). */
  awaitingSeller?: boolean;
  vehicle: { id: string; brand: string; model: string; photoUrl?: string | null } | null;
  session: { name: string } | null;
}

const EMPTY_SALES: Record<'inSession' | 'ongoing' | 'closed' | 'unsold', DashboardSale[]> = {
  inSession: [], ongoing: [], closed: [], unsold: [],
};

// SIRET : 14 chiffres (SIREN sur 9 + NIC sur 5)
const SIRET_REGEX = /^\d{14}$/;

export default function VendeurTableauDeBordPage() {
  const router = useRouter();
  const { user, loading: userLoading, refreshProfile } = useUser();
  const { language, t } = useLanguage();

  // Suivi commercial : aperçu sur le tableau de bord, détail complet sur /vendeur/ventes
  const [sales, setSales] = useState(EMPTY_SALES);
  const [salesLoaded, setSalesLoaded] = useState(false);

  const [dossiers, setDossiers] = useState<any[]>([]);
  const [dossiersLoaded, setDossiersLoaded] = useState(false);

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
  const [siret, setSiret] = useState('');
  const [kbisUrl, setKbisUrl] = useState('');
  const [cinRectoUrl, setCinRectoUrl] = useState('');
  const [cinVersoUrl, setCinVersoUrl] = useState('');
  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [cinRectoFile, setCinRectoFile] = useState<File | null>(null);
  const [cinVersoFile, setCinVersoFile] = useState<File | null>(null);
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
  const alertRef = useRef<HTMLDivElement>(null);

  // Photo de l'état initial du dossier, pour bloquer la resoumission tant qu'aucun
  // champ n'a réellement été modifié par rapport à ce qui a été refusé/à corriger.
  const initialValuesRef = useRef<Record<string, string>>({});

  // Le formulaire de correction est long : sans ce scroll, une erreur affichée en haut
  // du formulaire passe inaperçue si l'utilisateur est descendu vers les champs du bas.
  useEffect(() => {
    if (error || message) {
      alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [error, message]);

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
      setSiret(user.siret || '');
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

      initialValuesRef.current = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyName: user.companyName || '',
        activityType: user.activityType || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        country: user.address?.country || 'France',
        postalCode: user.address?.postalCode || '',
        vhuNumber: user.vhuNumber || '',
        siret: user.siret || '',
        kbisUrl: user.kbisUrl || '',
        cinRectoUrl: user.cinRectoUrl || '',
        cinVersoUrl: user.cinVersoUrl || '',
        bankName: user.bankInfo?.bankName || '',
        accountHolder: user.bankInfo?.accountHolder || '',
        iban: user.bankInfo?.iban || '',
        bic: user.bankInfo?.bic || '',
        ribUrl: user.bankInfo?.ribUrl || '',
      };
    }
  }, [user]);

  // Non connecté : renvoi vers la page de connexion
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(localizedPath('/vendeur/tableau-de-bord', language))}`, language));
    }
  }, [userLoading, user, router, language]);

  useEffect(() => {
    if (user?.role !== 'vendeur' || (user.status !== 'valide' && user.status !== 'suspendu')) return;
    
    Promise.all([
      apiRequest('/sales/seller'),
      // Limite haute explicite : l'endpoint pagine désormais à 20, or ce tableau de bord
      // compte les dossiers par statut — une page tronquée fausserait ses compteurs.
      apiRequest('/vehicle-dossiers?limit=100')
    ])
      .then(([salesRes, dossiersRes]) => {
        setSales({
          inSession: salesRes.inSession || [],
          ongoing: salesRes.ongoing || [],
          closed: salesRes.closed || [],
          unsold: salesRes.unsold || [],
        });
        setDossiers(dossiersRes.dossiers || []);
      })
      .catch((requestError) => console.error(requestError))
      .finally(() => {
        setSalesLoaded(true);
        setDossiersLoaded(true);
      });
  }, [user?._id, user?.role, user?.status]);

  // Un acheteur n'a pas accès à l'espace vendeur : renvoi vers sa propre page d'accueil
  useEffect(() => {
    if (user && user.role !== 'vendeur') {
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
    const file = e.target.files?.[0];
    if (!file) return;

    if (docType === 'kbis') setKbisFile(file);
    if (docType === 'cinRecto') setCinRectoFile(file);
    if (docType === 'cinVerso') setCinVersoFile(file);

    setUploading(docType);
    setError('');
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

  const handleRibSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRibFile(file);
    setRibUrl('');
  };

  const hasChanges = (() => {
    const initial = initialValuesRef.current;
    return (
      firstName !== initial.firstName ||
      lastName !== initial.lastName ||
      companyName !== initial.companyName ||
      activityType !== initial.activityType ||
      phone !== initial.phone ||
      street !== initial.street ||
      city !== initial.city ||
      country !== initial.country ||
      postalCode !== initial.postalCode ||
      vhuNumber !== initial.vhuNumber ||
      siret !== initial.siret ||
      kbisUrl !== initial.kbisUrl ||
      cinRectoUrl !== initial.cinRectoUrl ||
      cinVersoUrl !== initial.cinVersoUrl ||
      bankName !== initial.bankName ||
      accountHolder !== initial.accountHolder ||
      iban !== initial.iban ||
      bic !== initial.bic ||
      ribUrl !== initial.ribUrl ||
      Boolean(ribFile)
    );
  })();

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!hasChanges) {
      setError(t('profil.noChanges'));
      return;
    }

    if (!isValidPhoneNumber(phone || '')) {
      setError(t('register.phoneInvalid'));
      return;
    }

    if (!SIRET_REGEX.test((siret || '').replace(/\s/g, ''))) {
      setError(t('register.siretInvalid'));
      return;
    }

    setLoading(true);

    try {
      let finalRibUrl = ribUrl;
      if (ribFile) {
        setUploading('rib');
        finalRibUrl = await uploadFile(ribFile);
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
        siret,
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

        <form id="correction-form" onSubmit={handleResubmitSubmit} className="border-t border-[#eceadf] p-6 space-y-6 scroll-mt-6">
          <h4 className="font-bold text-lg text-[#13243c] uppercase font-heading">{t('profil.correctionSpace')}</h4>

          <div ref={alertRef}>
            {error && <Alert variant="error">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}
          </div>

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

          <div className="space-y-4 border-t border-[#efece3] pt-4">
            <h5 className="font-bold text-xs text-gray-400 uppercase tracking-wider">{t('register.siret')}</h5>
            <input required type="text" placeholder={t('register.siretPlaceholder')} value={siret} onChange={e => setSiret(e.target.value)} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" />
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

          <div className="space-y-4">

            <DocumentUploadRow label={t('profil.kbisPdf')} accept=".pdf" file={kbisFile} existingUrl={kbisUrl} onChange={e => handleFileUpload(e, 'kbis')} />
            <DocumentUploadRow label={t('profil.cinRecto')} accept="image/*,.pdf,application/pdf" file={cinRectoFile} existingUrl={cinRectoUrl} onChange={e => handleFileUpload(e, 'cinRecto')} selectedLabel={t('register.selected')} />
            <DocumentUploadRow label={t('profil.cinVerso')} accept="image/*,.pdf,application/pdf" file={cinVersoFile} existingUrl={cinVersoUrl} onChange={e => handleFileUpload(e, 'cinVerso')} selectedLabel={t('register.selected')} />
          </div>

          <button
            type="submit"
            disabled={loading || uploading !== null || !siret || !kbisUrl || !cinRectoUrl || !cinVersoUrl || !bankName || !accountHolder || !iban || !bic || !(ribUrl || ribFile) || !hasChanges}
            className="w-full h-12 bg-[#d9704f] hover:bg-[#c26040] text-white font-bold rounded-[9px] uppercase text-xs disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            {loading ? t('profil.resubmitting') : t('profil.resubmit')}
          </button>
          {!hasChanges && <p className="text-xs text-gray-400 text-center -mt-2">{t('profil.noChanges')}</p>}
        </form>
      </div>
    );
  }

  if (user.status !== 'valide' && user.status !== 'suspendu') {
    return <UnderReviewNotice />;
  }

  // VALIDATED STATE
  // Les ventes bloquées côté vendeur passent devant : ce sont les seules sur lesquelles
  // il peut agir tout de suite. À égalité, la plus avancée d'abord.
  const ongoingSorted = [...sales.ongoing].sort((a, b) => {
    if (Boolean(b.awaitingSeller) !== Boolean(a.awaitingSeller)) return Number(b.awaitingSeller) - Number(a.awaitingSeller);
    return (b.currentStep || 0) - (a.currentStep || 0);
  });
  const awaitingCount = sales.ongoing.filter((sale) => sale.awaitingSeller).length;

  // Dossiers renvoyés par l'administration pour correction. Les dossiers refusés en sont
  // exclus : le vendeur n'a plus d'action à y mener, les lister ici serait du bruit.
  const needsAttentionDossiers = dossiers.filter(
    (d) => d.status === 'correction_demandee' || d.status === 'a_corriger',
  );

  // Véhicules ayant échoué 3 fois ou plus lors des sessions
  const failedDossiers = dossiers.filter(
    (d) => (d.listingCount || 0) >= 3
  );

  const pendingDossiers = dossiers.filter((d) => d.status === 'en_attente_validation');

  /** Ce que le vendeur doit faire, selon l'étape où la vente est bloquée. */
  const sellerActionLabel = (stepKey?: string | null) => ({
    virement: t('vendeurDashboard.actionConfirmTransfer'),
    certificat_vendeur: t('vendeurDashboard.actionUploadCertificate'),
    validation_vendeur: t('vendeurDashboard.actionValidateCertificate'),
    enlevement: t('vendeurDashboard.actionEnterCode'),
  }[stepKey || ''] || null);


  return (
    <div className="flex-1 w-full p-6 sm:p-[32px_40px_44px] text-black font-sans bg-white select-none">
      {user.status === 'suspendu' && (
        <div className="mb-6 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8">
          <SuspendedNotice />
        </div>
      )}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-[28px] sm:text-[36px] font-bold font-heading uppercase text-[#13243c]">
          {t('vendeurDashboard.title')}
        </h1>
        {user.status !== 'suspendu' && (
          <Link
            href={localizedPath('/vendeur/dossiers/nouveau', language)}
            className="h-11 flex items-center justify-center rounded-[9px] bg-[#d9704f] px-6 text-[13px] font-bold uppercase tracking-[0.03em] text-white transition hover:bg-[#c26040]"
          >
            {t('vehicleDossier.createButton')}
          </Link>
        )}
      </div>

      {!user.stampUrl && <StampReminderBanner />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('vendeurDashboard.publishedInSession')} value={sales.inSession.length} bg="#2563eb" labelColor="#bfdbfe" valueColor="#ffffff" />
        <StatCard label={t('dashboard.ongoingSales')} value={sales.ongoing.length} bg="#16a34a" labelColor="#bbf7d0" valueColor="#ffffff" />
        <StatCard label={t('vendeurDashboard.pendingValidation')} value={pendingDossiers.length} bg="#ea580c" labelColor="#fed7aa" valueColor="#ffffff" />
        <StatCard label={t('profil.salesFinalized')} value={sales.closed.length} bg="#9333ea" labelColor="#e9d5ff" valueColor="#ffffff" />
      </div>

      {/* 1. Ventes en cours — d'abord celles bloquées côté vendeur : ce sont les seules
             sur lesquelles il peut agir immédiatement. */}
      {sales.ongoing.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold text-[#d9704f] uppercase tracking-[0.06em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d9704f] animate-pulse"></span>
              {t('dashboard.ongoingSales')}
              {awaitingCount > 0 && (
                <span className="ml-2 rounded-full bg-[#d9704f] px-2.5 py-0.5 text-[11px] font-bold text-white normal-case tracking-normal">
                  {t('vendeurDashboard.actionRequiredCount', { count: String(awaitingCount) })}
                </span>
              )}
            </h2>
            <Link href={localizedPath('/vendeur/ventes', language)} className="text-[12px] font-bold text-[#d9704f] hover:underline">
              {t('sellerSales.link')}
            </Link>
          </div>

          <div className="grid gap-4">
            {ongoingSorted.map((sale) => {
              const action = sellerActionLabel(sale.stepKey);
              return (
                <div key={sale.id} className={`flex flex-col sm:flex-row items-center gap-4 bg-white border-2 ${sale.awaitingSeller ? 'border-[#d9704f] shadow-[0_4px_12px_rgba(217,112,79,0.15)]' : 'border-[#eceadf] shadow-sm'} rounded-[12px] p-4 transition-transform hover:-translate-y-1`}>
                  {sale.vehicle?.photoUrl && (
                    <div className="h-[56px] w-[72px] shrink-0 overflow-hidden rounded-[7px] bg-[#13243c] hidden sm:block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sale.vehicle.photoUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
                    <div className="font-bold text-[16px] text-[#13243c]">
                      {[sale.vehicle?.brand, sale.vehicle?.model].filter(Boolean).join(' ') || t('profil.vehicle')}
                    </div>
                    <div className="text-[13px] text-[#5a5e66] mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span>{sale.session?.name || '—'}</span>
                      {sale.currentStep != null && sale.stepCount != null && (
                        <span className="hidden sm:inline">•</span>
                      )}
                      {sale.currentStep != null && sale.stepCount != null && (
                        <span>{t('dashboard.step', { current: String(sale.currentStep), total: String(sale.stepCount) })}</span>
                      )}
                    </div>
                    <div className="mt-2">
                      {action ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#13243c] px-2.5 py-1 text-[11px] font-bold text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          {action}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#8a8270]">{t('vendeurDashboard.awaitingBuyer')}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-[11px] text-[#7a756a] font-bold uppercase">{t('dashboard.amountSold')}</div>
                    <div className="font-mono text-[20px] font-bold text-[#13243c]">
                      {sale.amount != null ? formatEuros(sale.amount, language) : '—'}
                    </div>
                  </div>
                  <Link 
                    href={localizedPath(`/vendeur/ventes/${sale.id}`, language)} 
                    className="btn bg-[#13243c] text-white hover:bg-[#1c3050] w-full sm:w-auto justify-center"
                  >
                    {t('dashboard.trackSale')}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Dossiers renvoyés par l'administration : action attendue du vendeur également. */}
      {needsAttentionDossiers.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div className="text-[12px] font-bold text-[#4c5058] uppercase tracking-[0.06em]">
              {t('vendeurDashboard.dossiersToFix')}
            </div>
            <Link href={localizedPath('/vendeur/dossiers', language)} className="text-[12px] font-bold text-[#d9704f] hover:underline">
              {t('profil.viewAll')}
            </Link>
          </div>

          <div className="border border-[#eceadf] rounded-[12px] overflow-hidden bg-white overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[84px_2fr_1.2fr_1.4fr_120px] p-[14px_20px] bg-[#f8f7f2] text-[11px] font-bold uppercase tracking-[0.05em] text-[#4c5058]">
                <div>{t('vehicleDossier.colPhoto')}</div>
                <div>{t('profil.vehicle')}</div>
                <div>{t('vehicleDossier.colReservePrice')}</div>
                <div>{t('profil.status')}</div>
                <div />
              </div>

              <div className="divide-y divide-[#efece3]">
                {needsAttentionDossiers.slice(0, 5).map((dossier) => (
                  <div key={dossier._id} className="grid grid-cols-[84px_2fr_1.2fr_1.4fr_120px] p-[16px_20px] items-center text-[13px]">
                    <div className="h-[48px] w-[64px] shrink-0 overflow-hidden rounded-[7px] bg-[#13243c]">
                      {(() => {
                        const cover = dossier.photos?.find((photo: DossierPhoto) => photo.isCover) || dossier.photos?.[0];
                        return cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover.processedUrl || cover.originalUrl} alt="" className="h-full w-full object-cover" />
                        ) : null;
                      })()}
                    </div>
                    <div className="font-semibold text-[14px] text-[#13243c] pr-3 truncate">
                      {[dossier.brand, dossier.model].filter(Boolean).join(' ') || t('vehicleDossier.untitled')}
                    </div>
                    <div className="text-[#5a5e66] font-semibold pr-3">
                      {dossier.reservePrice != null ? formatEuros(dossier.reservePrice, language) : '—'}
                    </div>
                    <div className="pr-3">
                      <Badge style={getVehicleDossierStatusBadge(dossier.status, t)} className="px-[10px] py-[5px]" />
                    </div>
                    <Link
                      href={localizedPath(`/vendeur/dossiers/${dossier._id}`, language)}
                      className="text-right text-[12px] font-bold text-[#d9704f] hover:underline"
                    >
                      {t('profil.view')}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Véhicules avec 3 tentatives ou plus. */}
      {failedDossiers.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div className="text-[12px] font-bold text-red-600 uppercase tracking-[0.06em]">
              Véhicules invendus (3 tentatives ou +)
            </div>
            <Link href={localizedPath('/vendeur/dossiers', language)} className="text-[12px] font-bold text-[#d9704f] hover:underline">
              {t('profil.viewAll')}
            </Link>
          </div>

          <div className="border border-red-200 rounded-[12px] overflow-hidden bg-white overflow-x-auto shadow-sm">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[84px_2fr_1.2fr_1.4fr_120px] p-[14px_20px] bg-red-50 text-[11px] font-bold uppercase tracking-[0.05em] text-red-800">
                <div>{t('vehicleDossier.colPhoto')}</div>
                <div>{t('profil.vehicle')}</div>
                <div>Tentatives</div>
                <div>{t('profil.status')}</div>
                <div />
              </div>

              <div className="divide-y divide-red-100">
                {failedDossiers.slice(0, 5).map((dossier) => (
                  <div key={dossier._id} className="grid grid-cols-[84px_2fr_1.2fr_1.4fr_120px] p-[16px_20px] items-center text-[13px]">
                    <div className="h-[48px] w-[64px] shrink-0 overflow-hidden rounded-[7px] bg-[#13243c]">
                      {(() => {
                        const cover = dossier.photos?.find((photo: DossierPhoto) => photo.isCover) || dossier.photos?.[0];
                        return cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover.processedUrl || cover.originalUrl} alt="" className="h-full w-full object-cover" />
                        ) : null;
                      })()}
                    </div>
                    <div className="font-semibold text-[14px] text-[#13243c] pr-3 truncate">
                      {[dossier.brand, dossier.model].filter(Boolean).join(' ') || t('vehicleDossier.untitled')}
                    </div>
                    <div className="text-red-600 font-bold pr-3">
                      {dossier.listingCount} fois
                    </div>
                    <div className="pr-3">
                      <Badge style={getVehicleDossierStatusBadge(dossier.status, t)} className="px-[10px] py-[5px]" />
                    </div>
                    <Link
                      href={localizedPath(`/vendeur/dossiers/${dossier._id}`, language)}
                      className="text-right text-[12px] font-bold text-[#d9704f] hover:underline"
                    >
                      {t('profil.view')}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
