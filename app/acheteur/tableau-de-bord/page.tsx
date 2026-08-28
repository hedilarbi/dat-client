'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../api';
import { useUser } from '../../components/LayoutWrapper';
import { localizedPath, useLanguage } from '../../i18n';
import StampReminderBanner from '../../components/StampReminderBanner';
import StatCard from '../../components/StatCard';
import { formatEuros } from '../../lib/format';
import { UnderReviewNotice, SuspendedNotice } from '../../components/RegistrationStatusNotices';

interface BuyerOfferPreview {
  id: string;
  amount: number;
  fees: { total: number };
  vehicle: { id: string; brand: string; model: string } | null;
  session: { name: string } | null;
}

export default function BuyerDashboardPage() {
  const { user } = useUser();
  const { language, t } = useLanguage();
  
  const [ongoingOffers, setOngoingOffers] = useState<BuyerOfferPreview[]>([]);
  const [ongoingSales, setOngoingSales] = useState<any[]>([]);
  const [closedSalesCount, setClosedSalesCount] = useState(0);
  const [pastOffersCount, setPastOffersCount] = useState(0);
  const [offersLoaded, setOffersLoaded] = useState(false);

  useEffect(() => {
    if (user?.role !== 'acheteur' || user.status !== 'valide') return;
    
    Promise.all([
      apiRequest('/offers/mine'),
      apiRequest('/sales/mine')
    ])
      .then(([offersRes, salesRes]) => {
        setOngoingOffers(offersRes.ongoing || []);
        setPastOffersCount((offersRes.past || []).length);
        setOngoingSales(salesRes.ongoing || []);
        setClosedSalesCount((salesRes.closed || []).length);
      })
      .catch((requestError) => console.error(requestError))
      .finally(() => setOffersLoaded(true));
  }, [user?._id, user?.role, user?.status]);

  if (!user || user.role !== 'acheteur') return null;
  if (user.status !== 'valide' && user.status !== 'suspendu') return <UnderReviewNotice />;
  if (!offersLoaded) return <div className="flex-1 w-full bg-white p-8 text-sm font-medium text-[#5a5e66] text-center animate-pulse">{t('common.loading') || 'Chargement...'}</div>;

  return (
    <div className="p-6 sm:p-8 w-full font-sans bg-white min-h-full">
      {user.status === 'suspendu' && (
        <div className="mb-6 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8">
          <SuspendedNotice />
        </div>
      )}
      <div className="mb-6">
        <div>
          <div className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#111827] mb-2">
            {user.companyName}
          </div>
          <h1 className="text-[28px] sm:text-[36px] font-bold font-heading uppercase text-[#13243c]">
            Tableau de bord
          </h1>
        </div>
      </div>

      {!user.stampUrl && <StampReminderBanner />}

      {/* Vibrant KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('profil.offersInProgress')} value={ongoingOffers.length} bg="#2563eb" labelColor="#bfdbfe" valueColor="#ffffff" />
        <StatCard label={t('profil.offersWon')} value={ongoingSales.length} bg="#16a34a" labelColor="#bbf7d0" valueColor="#ffffff" />
        <StatCard label={t('profil.commissionDue')} value={ongoingSales.filter(s => s.currentStep === 1).length} bg="#ea580c" labelColor="#fed7aa" valueColor="#ffffff" />
        <StatCard label={t('profil.salesFinalized')} value={closedSalesCount} bg="#9333ea" labelColor="#e9d5ff" valueColor="#ffffff" />
      </div>

      {ongoingSales.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[16px] font-bold text-[#d9704f] uppercase tracking-[0.06em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d9704f] animate-pulse"></span>
            {t('dashboard.ongoingSales')}
          </h2>
          <div className="grid gap-4">
            {ongoingSales.map(sale => {
              const isBuyerTurn = sale.currentStep === 1 || sale.currentStep === 4 || sale.currentStep === 5;
              return (
                <div key={sale.id} className={`flex flex-col sm:flex-row items-center gap-4 bg-white border-2 ${isBuyerTurn ? 'border-[#d9704f] shadow-[0_4px_12px_rgba(217,112,79,0.15)]' : 'border-[#eceadf] shadow-sm'} rounded-[12px] p-4 transition-transform hover:-translate-y-1`}>
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
                      {isBuyerTurn && sale.stepKey ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#13243c] px-2.5 py-1 text-[11px] font-bold text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          {t(`sales.step.${sale.stepKey}`)}
                        </span>
                      ) : sale.currentStep === 7 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a] px-2.5 py-1 text-[11px] font-bold text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          {t('dashboard.handoverPapersReady')}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#8a8270]">{t('dashboard.awaitingSeller')}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-[11px] text-[#7a756a] font-bold uppercase">{t('dashboard.amountWon')}</div>
                    <div className="font-mono text-[20px] font-bold text-[#13243c]">
                      {sale.amount != null ? formatEuros(sale.amount, language) : '—'}
                    </div>
                  </div>
                  <Link 
                    href={localizedPath(`/acheteur/tableau-de-bord/mes-vehicules/${sale.id}`, language)} 
                    className="btn bg-[#13243c] text-white hover:bg-[#1c3050] w-full sm:w-auto justify-center"
                  >
                    {t('dashboard.continuePurchase')}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-[14px] font-bold text-[#111827] uppercase tracking-[0.06em]">
          Dernières offres
        </h2>
        {offersLoaded && (
          <div className="mt-1 text-[13px] text-[#5a5e66]">
            {t('profil.myOffersSummary', { ongoing: String(ongoingOffers.length), past: String(pastOffersCount) })}
          </div>
        )}
      </div>

      <div className="border border-[#eceadf] rounded-[12px] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr_110px] p-[16px_20px] bg-[#f8f9fa] border-b border-[#eceadf] text-[12px] font-bold uppercase tracking-[0.05em] text-[#111827]">
              <div>{t('profil.vehicle')}</div>
              <div>{t('profil.session')}</div>
              <div>{t('profil.amountOffered')}</div>
              <div>{t('offers.totalIfWon')}</div>
              <div></div>
            </div>

            <div className="divide-y divide-[#eceadf]">
              {!offersLoaded && (
                <div className="p-[20px] text-[13px] text-[#5a5e66]">{t('offers.loading')}</div>
              )}
              {offersLoaded && ongoingOffers.length === 0 && (
                <div className="p-[20px] text-[13px] text-[#5a5e66]">{t('offers.emptyOngoing')}</div>
              )}
              {ongoingOffers.slice(0, 3).map((row) => (
                <div key={row.id} className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr_110px] p-[16px_20px] items-center text-[13px] text-[#111827] hover:bg-[#f8f9fa] transition-colors">
                  <div className="font-bold text-[14px] text-[#13243c]">
                    {[row.vehicle?.brand, row.vehicle?.model].filter(Boolean).join(' ') || '—'}
                  </div>
                  <div className="text-[#4c5058]">{row.session?.name || '—'}</div>
                  <div className="text-[#4c5058] font-semibold">{formatEuros(row.amount, language)}</div>
                  <div className="text-[#4c5058] font-semibold">{formatEuros(row.fees.total, language)}</div>
                  <div className="text-right">
                    <Link 
                      href={localizedPath('/acheteur/tableau-de-bord/mes-offres', language)} 
                      className="btn btn-primary"
                    >
                      {t('profil.view')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
