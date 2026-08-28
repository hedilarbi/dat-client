'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isValidPhoneNumber } from 'react-phone-number-input';
import Link from 'next/link';
import { apiRequest } from '../api';
import { useUser } from './LayoutWrapper';
import { getRoleHomePath, getRoleProfilePath, getRoleRegisterPath, getRoleStampPath, localizedPath, useLanguage } from '../i18n';
import Alert from './Alert';
import Spinner from './Spinner';
import StatCard from './StatCard';
import IdentityFieldsSection from './IdentityFieldsSection';
import DocumentUploadRow from './DocumentUploadRow';
import StampReminderBanner from './StampReminderBanner';
import { compressImageIfNeeded, MAX_UPLOAD_BYTES } from '../lib/imageCompression';
import { formatEuros } from '../lib/format';
import { DraftPendingNotice, UnderReviewNotice, RejectionReasonsBox, type Rejection } from './RegistrationStatusNotices';
import PendingCommissionCheckout from './PendingCommissionCheckout';

// SIRET : 14 chiffres (SIREN sur 9 + NIC sur 5)
const SIRET_REGEX = /^\d{14}$/;

interface BuyerOfferPreview {
  id: string;
  amount: number;
  fees: { total: number };
  vehicle: { id: string; brand: string; model: string } | null;
  session: { name: string } | null;
}

export default function ProfilPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const [siret, setSiret] = useState('');
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
  const alertRef = useRef<HTMLDivElement>(null);

  // Photo de l'état initial du dossier, pour bloquer la resoumission tant qu'aucun
  // champ n'a réellement été modifié par rapport à ce qui a été refusé/à corriger.
  const initialValuesRef = useRef<Record<string, string>>({});

  // Aperçu des offres de l'acheteur : les trois plus récentes en cours, le détail
  // complet vivant sur /profil/mes-offres.
  const [ongoingOffers, setOngoingOffers] = useState<BuyerOfferPreview[]>([]);
  const [pastOffersCount, setPastOffersCount] = useState(0);
  const [offersLoaded, setOffersLoaded] = useState(false);

  // CommissionCheckout state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmSettled, setConfirmSettled] = useState(false);
  const confirmStartedRef = useRef(false);

  const checkoutSessionId = searchParams.get('session_id');
  const actionParam = searchParams.get('action');
  const confirming = Boolean(checkoutSessionId) && actionParam === 'pending_commission' && !confirmSettled;

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
      setSiret(user.siret || '');
      setKbisUrl(user.kbisUrl || '');
      setCinRectoUrl(user.cinRectoUrl || '');
      setCinVersoUrl(user.cinVersoUrl || '');

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
        siret: user.siret || '',
        kbisUrl: user.kbisUrl || '',
        cinRectoUrl: user.cinRectoUrl || '',
        cinVersoUrl: user.cinVersoUrl || '',
      };
    }
  }, [user]);

  // Non connecté : renvoi vers la page de connexion
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(localizedPath(`/login?next=${encodeURIComponent(pathname || getRoleProfilePath('acheteur'))}`, language));
    }
  }, [userLoading, user, router, language]);

  // Le composant est désormais accessible aux deux rôles (acheteur et vendeur)

  useEffect(() => {
    if (user?.role !== 'acheteur' || user.status !== 'valide') return;
    apiRequest('/offers/mine')
      .then((res) => {
        setOngoingOffers(res.ongoing || []);
        setPastOffersCount((res.past || []).length);
      })
      .catch((requestError) => console.error(requestError))
      .finally(() => setOffersLoaded(true));
  }, [user]);

  // Handle Stripe commission checkout return
  useEffect(() => {
    if (!checkoutSessionId || actionParam !== 'pending_commission' || !user || user.status !== 'suspendu') return;
    if (confirmStartedRef.current) return;
    confirmStartedRef.current = true;

    apiRequest('/auth/me/pending-commission/confirm', {
      method: 'POST',
      body: JSON.stringify({ checkoutSessionId }),
    })
      .then(async () => {
        setMessage('Commission réglée. Votre compte est réactivé.');
        setError('');
        setCheckoutOpen(false);
        await refreshProfile();
        router.replace(localizedPath(`/acheteur/tableau-de-bord/profil`, language));
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Erreur lors de la validation du paiement.');
      })
      .finally(() => setConfirmSettled(true));
  }, [checkoutSessionId, actionParam, user, router, language, refreshProfile]);

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
      siret !== initial.siret ||
      kbisUrl !== initial.kbisUrl ||
      cinRectoUrl !== initial.cinRectoUrl ||
      cinVersoUrl !== initial.cinVersoUrl
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
      await apiRequest('/auth/register-step2', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          companyName,
          activityType,
          phone,
          address: { street, city, country, postalCode },
          siret,
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

  if (!user) return null;

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
            <h5 className="font-bold text-xs text-[#111827] uppercase tracking-wider">{t('profil.addressToCorrect')}</h5>
            <input required type="text" placeholder={t('profil.address')} value={street} onChange={e => setStreet(e.target.value)} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input required type="text" placeholder={t('profil.city')} className="sm:col-span-2 h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={city} onChange={e => setCity(e.target.value)} />
              <input required type="text" placeholder={t('profil.postalCode')} className="h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4 border-t border-[#efece3] pt-4">
            <h5 className="font-bold text-xs text-[#111827] uppercase tracking-wider">{t('register.siret')}</h5>
            <input required type="text" placeholder={t('register.siretPlaceholder')} value={siret} onChange={e => setSiret(e.target.value)} className="w-full h-12 border border-[#dcd7cb] rounded-[9px] px-4 text-sm text-black" />
          </div>

          <div className="space-y-4">

            <DocumentUploadRow label={t('profil.kbisPdf')} accept=".pdf" file={kbisFile} existingUrl={kbisUrl} onChange={e => handleFileUpload(e, 'kbis')} />
            <DocumentUploadRow label={t('profil.cinRecto')} accept="image/*,.pdf,application/pdf" file={cinRectoFile} existingUrl={cinRectoUrl} onChange={e => handleFileUpload(e, 'cinRecto')} selectedLabel={t('register.selected')} />
            <DocumentUploadRow label={t('profil.cinVerso')} accept="image/*,.pdf,application/pdf" file={cinVersoFile} existingUrl={cinVersoUrl} onChange={e => handleFileUpload(e, 'cinVerso')} selectedLabel={t('register.selected')} />
          </div>

          <button
            type="submit"
            disabled={loading || uploading !== null || !siret || !kbisUrl || !cinRectoUrl || !cinVersoUrl || !hasChanges}
            className="w-full h-12 bg-[#d9704f] hover:bg-[#c26040] text-white font-bold rounded-[9px] border-2 border-transparent hover:border-[#9c462b] uppercase text-xs disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            {loading && <Spinner />}
            {loading ? t('profil.resubmitting') : t('profil.resubmit')}
          </button>
          {!hasChanges && <p className="text-xs text-gray-400 text-center -mt-2">{t('profil.noChanges')}</p>}
        </form>
      </div>
    );
  }

  if (user.status === 'suspendu' && user.pendingCommission) {
    return (
      <div className="flex-1 w-full p-6 sm:p-8 text-black font-sans bg-white">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8 shadow-sm max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-red-800 mb-4 uppercase tracking-wider font-heading">
            Compte suspendu
          </h2>
          <p className="text-red-700 mb-6 leading-relaxed">
            Votre compte a été suspendu suite au dépassement du délai de procédure. La vente du véhicule vous a été définitivement retirée et attribuée à l'offre suivante.
            Pour débloquer et réactiver votre compte, vous devez régler les frais de dossier (<strong>{formatEuros(user.pendingCommission.amount, language)}</strong>).
          </p>

          <div ref={alertRef}>
            {error && <Alert variant="error">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}
          </div>

          {confirming ? (
            <p className="font-semibold text-red-800 animate-pulse">Vérification de votre paiement en cours...</p>
          ) : checkoutOpen ? (
            <div className="mt-6">
              <PendingCommissionCheckout onCancel={() => setCheckoutOpen(false)} />
            </div>
          ) : (
            <button
              onClick={() => setCheckoutOpen(true)}
              className="btn bg-red-600 text-white hover:bg-red-700 border-red-600 w-full sm:w-auto"
            >
              Régler ma dette et réactiver
            </button>
          )}
        </div>
      </div>
    );
  }

  if (user.status !== 'valide') {
    return <UnderReviewNotice />;
  }

  // VALIDATED STATE
  return (
    <div className="flex-1 w-full p-6 sm:p-[32px_40px_44px] text-black font-sans bg-white min-h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#111827] mb-2">
            {user.companyName}
          </div>
          <h1 className="text-[28px] sm:text-[36px] font-bold font-heading uppercase text-[#13243c]">
            {t('nav.profile')}
          </h1>
        </div>
        <Link 
          href={localizedPath(getRoleHomePath(user.role), language)}
          className="btn btn-primary"
        >
          Retour au tableau de bord
        </Link>
      </div>

      {!user.stampUrl && <StampReminderBanner />}

      <div className="bg-[#f8f9fa] border border-[#eceadf] rounded-[12px] p-6 sm:p-8">
        <h2 className="text-[14px] font-bold text-[#111827] uppercase tracking-[0.06em] mb-6 border-b border-[#eceadf] pb-2">
          Informations du compte
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#111827] uppercase tracking-wider mb-1">Société</div>
              <div className="text-[14px] font-semibold text-[#13243c]">{user.companyName}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#111827] uppercase tracking-wider mb-1">Activité</div>
              <div className="text-[14px] text-[#4c5058]">{user.activityType}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#111827] uppercase tracking-wider mb-1">SIRET</div>
              <div className="text-[14px] font-mono text-[#4c5058]">{user.siret}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#111827] uppercase tracking-wider mb-1">Représentant</div>
              <div className="text-[14px] text-[#4c5058]">{user.firstName} {user.lastName}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#111827] uppercase tracking-wider mb-1">Contact</div>
              <div className="text-[14px] text-[#4c5058]">{user.email} <br />{user.phone}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#111827] uppercase tracking-wider mb-1">Adresse</div>
              <div className="text-[14px] text-[#4c5058]">
                {user.address?.street}<br/>
                {user.address?.postalCode} {user.address?.city}, {user.address?.country}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-[14px] font-bold text-[#111827] uppercase tracking-[0.06em] mb-6 mt-10 border-b border-[#eceadf] pb-2">
          Documents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.kbisUrl && (
            <a href={user.kbisUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-[8px] border border-[#eceadf] bg-white hover:border-[#13243c] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d9704f" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <span className="text-[13px] font-semibold text-[#13243c]">Extrait Kbis</span>
            </a>
          )}
          {user.cinRectoUrl && (
            <a href={user.cinRectoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-[8px] border border-[#eceadf] bg-white hover:border-[#13243c] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d9704f" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <span className="text-[13px] font-semibold text-[#13243c]">Pièce d&apos;identité (Recto)</span>
            </a>
          )}
          {user.cinVersoUrl && (
            <a href={user.cinVersoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-[8px] border border-[#eceadf] bg-white hover:border-[#13243c] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d9704f" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <span className="text-[13px] font-semibold text-[#13243c]">Pièce d&apos;identité (Verso)</span>
            </a>
          )}
        </div>

        <h2 className="text-[14px] font-bold text-[#111827] uppercase tracking-[0.06em] mb-6 mt-10 border-b border-[#eceadf] pb-2 flex items-center justify-between">
          <span>Tampon de l'entreprise</span>
          <Link
            href={localizedPath(getRoleStampPath(user.role), language)}
            className="text-[12px] font-bold text-[#d9704f] hover:underline normal-case tracking-normal"
          >
            {user.stampUrl ? "Modifier le tampon" : "Ajouter un tampon"}
          </Link>
        </h2>
        
        {user.stampUrl ? (
          <div
            className="rounded-[10px] border border-[#dcd7cb] p-6 flex items-center justify-center bg-white w-full max-w-[400px]"
            style={{
              backgroundImage:
                'linear-gradient(45deg,#eceadf 25%,transparent 25%),linear-gradient(-45deg,#eceadf 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eceadf 75%),linear-gradient(-45deg,transparent 75%,#eceadf 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user.stampUrl} alt="Tampon" className="max-h-[160px] object-contain" />
          </div>
        ) : (
          <div className="text-[13px] text-[#5a5e66]">
            Vous n'avez pas encore déposé de tampon d'entreprise. <Link href={localizedPath(getRoleStampPath(user.role), language)} className="text-[#d9704f] hover:underline font-semibold">Le déposer maintenant</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
