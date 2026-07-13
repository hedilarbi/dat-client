'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest } from '../api';
import Link from 'next/link';
import { Language, LanguageSelector, getRoleHomePath, getLocaleFromPath, localizedPath, canonicalPathFromPathname, useLanguage } from '../i18n';
import DropdownMenu from './DropdownMenu';

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  activityType: string;
  phone: string;
  role: 'acheteur' | 'vendeur';
  status: string;
  emailVerified?: boolean;
  address?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  kbisUrl?: string;
  cinRectoUrl?: string;
  cinVersoUrl?: string;
  vhuNumber?: string;
  rejections?: Array<{
    date: string;
    motifs: string[];
    comment: string;
  }>;
  bankInfo?: {
    bankName: string;
    accountHolder: string;
    iban: string;
    bic: string;
    ribUrl?: string;
  };
  language?: Language;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async () => {
    try {
      const res = await apiRequest('/auth/me');
      // Le client n'accepte que les comptes acheteur/vendeur : une session admin
      // (ex. cookie partagé avec le panneau admin en local) ne doit pas être traitée
      // comme un utilisateur connecté ici.
      if (res.user.role !== 'acheteur' && res.user.role !== 'vendeur') {
        setUser(null);
        localStorage.removeItem('userRole');
        return;
      }
      setUser(res.user);
      localStorage.setItem('userRole', res.user.role);
    } catch (err) {
      setUser(null);
      localStorage.removeItem('userRole');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      localStorage.removeItem('userRole');
      router.push(localizedPath('/login', getLocaleFromPath(pathname) || 'fr'));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, logout, refreshProfile: fetchProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

function NotificationBell() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setNotifications([
      { id: '1', title: t('notifications.newOfferTitle'), message: t('notifications.newOfferMessage'), createdAt: t('notifications.time5min'), read: false },
      { id: '2', title: t('notifications.fileValidatedTitle'), message: t('notifications.fileValidatedMessage'), createdAt: t('notifications.timeYesterday'), read: false },
      { id: '3', title: t('notifications.sessionEndingTitle'), message: t('notifications.sessionEndingMessage'), createdAt: t('notifications.time2days'), read: true },
    ]);
  }, [t]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <DropdownMenu
      panelClassName="w-[320px] max-w-[calc(100vw-2rem)] bg-white rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.18)] border border-[#efece3] overflow-hidden text-left"
      trigger={({ onClick }) => (
        <button
          onClick={onClick}
          className="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#1c3050] border border-[#2c4266] hover:bg-slate-800 transition"
          aria-label="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-[3px] rounded-full bg-[#d9704f] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#13243c]">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#efece3]">
        <span className="text-[13px] font-bold text-[#13243c] uppercase tracking-wide">{t('notifications.title')}</span>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-[11px] font-semibold text-[#d9704f] hover:underline">
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-[#9a917d]">{t('notifications.empty')}</div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`px-4 py-3 border-b border-[#f3f1ea] last:border-b-0 ${n.read ? 'bg-white' : 'bg-[#fbfaf7]'}`}>
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-[6px] w-[6px] h-[6px] rounded-full bg-[#d9704f] shrink-0" />}
                <div className={n.read ? 'ml-[14px]' : ''}>
                  <div className="text-[13px] font-semibold text-[#13243c]">{n.title}</div>
                  <div className="text-[12px] text-[#5a5e66] leading-[1.4] mt-[2px]">{n.message}</div>
                  <div className="text-[11px] text-[#9a917d] mt-[4px]">{n.createdAt}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DropdownMenu>
  );
}

function UserMenu({ displayName, initials, triggerClassName = 'hidden sm:flex' }: { displayName: string; initials: string; triggerClassName?: string }) {
  const { logout } = useUser();
  const { language, t } = useLanguage();

  return (
    <DropdownMenu
      panelClassName="w-[200px] bg-white rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.18)] border border-[#efece3] overflow-hidden text-left"
      trigger={({ onClick }) => (
        <button
          onClick={onClick}
          className={`${triggerClassName} items-center gap-2 bg-[#1c3050] border border-[#2c4266] rounded-full p-[6px_16px_6px_6px] cursor-pointer hover:bg-slate-800 transition`}
        >
          <div className="w-[30px] h-[30px] rounded-full bg-[#b3893f] flex items-center justify-center text-[12px] font-bold text-white shrink-0">
            {initials}
          </div>
          <span className="text-[13px] font-semibold text-white truncate max-w-[160px]">{displayName}</span>
          <span className="text-[#8ea0bd] text-[11px]">▾</span>
        </button>
      )}
    >
      {({ close }) => (
        <>
          <Link
            href={localizedPath('/profil', language)}
            onClick={close}
            className="block px-4 py-3 text-[13px] font-semibold text-[#13243c] hover:bg-[#efece3] transition"
          >
            {t('nav.profile')}
          </Link>
          <Link
            href={localizedPath('/support', language)}
            onClick={close}
            className="block px-4 py-3 text-[13px] font-semibold text-[#13243c] hover:bg-[#efece3] transition border-t border-[#f3f1ea]"
          >
            {t('nav.support')}
          </Link>
          <button
            onClick={() => { close(); logout(); }}
            className="w-full text-left px-4 py-3 text-[13px] font-semibold text-[#d9704f] hover:bg-[#efece3] transition border-t border-[#f3f1ea]"
          >
            {t('nav.logout')}
          </button>
        </>
      )}
    </DropdownMenu>
  );
}

interface MobileNavLink {
  href?: string;
  label: string;
  active?: boolean;
}

function MobileMenu({
  navLinks,
  onLanguageChange,
  breakpointClass = 'md:hidden',
}: {
  navLinks: MobileNavLink[];
  onLanguageChange: (language: Language) => Promise<void> | void;
  breakpointClass?: string;
}) {
  const { user, logout } = useUser();
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  // The drawer stays mounted (even closed) so its slide-out transition can play, but it must
  // never render during SSR/hydration — only after mount, so the server and the client's first
  // render match (a `typeof document` check would differ between server and client and break
  // hydration; `open` alone doesn't, since it starts false identically on both).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('nav.menu')}
        className={`${breakpointClass} w-9 h-9 flex items-center justify-center rounded-[7px] border border-[#2c4266] bg-[#1c3050] text-white shrink-0`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {mounted && createPortal(
        <div className={`fixed inset-0 z-200 ${breakpointClass} ${open ? '' : 'pointer-events-none'}`}>
          <div
            onClick={close}
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          />
          <div
            className={`absolute right-0 top-0 h-full w-[82%] max-w-[320px] bg-[#13243c] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-center justify-between px-5 h-[64px] border-b border-[#2c4266] shrink-0">
              <span className="text-[9px] font-semibold tracking-widest uppercase text-[#8ea0bd]">{t('login.logo')}</span>
              <button onClick={close} aria-label={t('nav.close')} className="w-8 h-8 flex items-center justify-center text-white text-2xl leading-none">
                ×
              </button>
            </div>

            <nav className="flex flex-col p-4 gap-1 border-b border-[#2c4266] overflow-y-auto">
              {navLinks.map(link => (
                link.href ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={close}
                    className={`px-4 py-3 rounded-[9px] text-[14px] font-semibold transition ${link.active ? 'bg-[#1c3050] text-white' : 'text-[#9fb0c9] hover:bg-[#1a2b44]'}`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <span key={link.label} className="px-4 py-3 text-[14px] font-semibold text-[#9fb0c9]">
                    {link.label}
                  </span>
                )
              ))}
            </nav>

            <div className="p-4 border-b border-[#2c4266]">
              <LanguageSelector onLanguageChange={onLanguageChange} className="text-white" />
            </div>

            <div className="p-4 flex flex-col gap-2 mt-auto shrink-0">
              {user ? (
                <>
                  <Link
                    href={localizedPath('/profil', language)}
                    onClick={close}
                    className="h-12 flex items-center justify-center rounded-[9px] text-[13px] font-bold uppercase tracking-[0.03em] text-white bg-[#1c3050] border border-[#2c4266] hover:bg-slate-800 transition"
                  >
                    {t('nav.profile')}
                  </Link>
                  <button
                    onClick={() => { close(); logout(); }}
                    className="h-12 rounded-[9px] text-[13px] font-bold uppercase tracking-[0.03em] text-white bg-red-800 hover:bg-red-700 transition"
                  >
                    {t('nav.logout')}
                  </button>
                  <Link
                    href={localizedPath('/support', language)}
                    onClick={close}
                    className="h-12 flex items-center justify-center rounded-[9px] text-[13px] font-bold uppercase tracking-[0.03em] text-white bg-[#1c3050] border border-[#2c4266] hover:bg-slate-800 transition"
                  >
                    {t('nav.support')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={localizedPath('/login', language)}
                    onClick={close}
                    className="h-12 flex items-center justify-center rounded-[8px] bg-[#d9704f] hover:bg-[#c26040] text-white text-[13px] font-bold uppercase tracking-[0.03em] transition"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href={localizedPath('/register', language)}
                    onClick={close}
                    className="h-12 flex items-center justify-center rounded-[8px] border border-[#2c4266] text-white text-[13px] font-semibold uppercase tracking-[0.03em] hover:bg-slate-800 transition"
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshProfile } = useUser();
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const currentPath = canonicalPathFromPathname(pathname);

  const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password' || currentPath === '/';

  useEffect(() => {
    if (user?.language) {
      setLanguage(user.language);
    }
  }, [setLanguage, user?.language]);

  const persistLanguage = async (nextLanguage: Language) => {
    if (!user) return;
    await apiRequest('/auth/me/language', {
      method: 'PUT',
      body: JSON.stringify({ language: nextLanguage }),
    });
    await refreshProfile();
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!user) return '??';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || user.email.substring(0, 2).toUpperCase();
  };

  // Get the user's display name for the header menu
  const getDisplayName = () => {
    if (!user) return '';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.companyName || user.email;
  };

  if (loading && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaf7] font-sans">
        <div className="w-12 h-12 border-4 border-[#d9704f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // SELLER LAYOUT (Top Blue Bar + Left Sidebar Layout) — the only space with a distinct header.
  // Excluded on /register: a vendeur resuming an unfinished registration (e.g. brouillon status,
  // reached via ?step=documents) is still onboarding, not yet "in" the seller space.
  if (user && user.role === 'vendeur' && currentPath !== '/register') {
    return (
      <div className="h-screen bg-white flex flex-col font-sans overflow-hidden">
        {/* Top Blue Bar */}
        <header className="h-[64px] bg-[#13243c] flex items-center px-4 sm:px-8 gap-4 shrink-0 select-none overflow-x-auto">
          <Link href={localizedPath('/vendeur/tableau-de-bord', language)} className="lg:hidden w-[104px] h-[30px] shrink-0 border border-dashed border-[#47597a] rounded-[6px] flex items-center justify-center text-[9px] font-semibold tracking-widest uppercase text-[#8ea0bd]">
            {t('login.logo')}
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden lg:flex">
              <LanguageSelector compact onLanguageChange={persistLanguage} />
            </div>
            <NotificationBell />
            <UserMenu displayName={getDisplayName()} initials={getInitials()} triggerClassName="hidden lg:flex" />
            <MobileMenu
              breakpointClass="lg:hidden"
              onLanguageChange={persistLanguage}
              navLinks={[
                { href: localizedPath('/vendeur/tableau-de-bord', language), label: t('nav.dashboard'), active: currentPath === '/vendeur/tableau-de-bord' },
                { href: localizedPath('/sessions', language), label: t('nav.sessions'), active: currentPath === '/sessions' },
                { href: localizedPath('/vendeur/dossiers', language), label: t('nav.files'), active: currentPath === '/vendeur/dossiers' },
                { href: localizedPath('/support', language), label: t('nav.support'), active: currentPath === '/support' },
              ]}
            />
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar */}
          <aside className="hidden lg:flex w-[220px] shrink-0 bg-[#13243c] p-[28px_18px] flex-col select-none overflow-y-auto">
            <div className="w-[110px] h-[32px] shrink-0 border border-dashed border-[#47597a] rounded-[6px] flex items-center justify-center text-[9px] font-semibold tracking-widest uppercase text-[#8ea0bd] mb-[36px]">
              {t('login.logo')}
            </div>
            <nav className="flex flex-col gap-1">
              <Link href={localizedPath('/vendeur/tableau-de-bord', language)} className={`flex items-center px-[14px] py-[12px] rounded-[9px] font-[500] text-[14px] transition ${currentPath === '/vendeur/tableau-de-bord' ? 'bg-[#1c3050] text-white font-semibold' : 'text-[#9fb0c9] hover:bg-[#1a2b44]'}`}>
                {t('nav.dashboard')}
              </Link>
              <Link href={localizedPath('/sessions', language)} className={`flex items-center px-[14px] py-[12px] rounded-[9px] font-[500] text-[14px] transition ${currentPath === '/sessions' ? 'bg-[#1c3050] text-white font-semibold' : 'text-[#9fb0c9] hover:bg-[#1a2b44]'}`}>
                {t('nav.sessions')}
              </Link>
              <Link href={localizedPath('/vendeur/dossiers', language)} className={`flex items-center px-[14px] py-[12px] rounded-[9px] font-[500] text-[14px] transition ${currentPath === '/vendeur/dossiers' ? 'bg-[#1c3050] text-white font-semibold' : 'text-[#9fb0c9] hover:bg-[#1a2b44]'}`}>
                {t('nav.files')}
              </Link>
              <Link href={localizedPath('/support', language)} className={`flex items-center px-[14px] py-[12px] rounded-[9px] font-[500] text-[14px] transition ${currentPath === '/support' ? 'bg-[#1c3050] text-white font-semibold' : 'text-[#9fb0c9] hover:bg-[#1a2b44]'}`}>
                {t('nav.support')}
              </Link>
            </nav>
          </aside>

          {/* Right Main Content */}
          <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // ACHETEUR / GUEST LAYOUT (Top Header Layout) — shared by every page outside the vendeur space,
  // logged in or not: home, login, register, forgot-password, profil, sessions, offres, support.
  return (
    <div className="min-h-screen bg-white flex font-sans">
      <div className="flex-1 min-h-screen bg-white overflow-hidden flex flex-col">
        {/* Top Navbar */}
        <header className="h-[70px] bg-[#13243c] flex items-center gap-4 sm:gap-[34px] px-4 sm:px-[34px] py-4 select-none overflow-x-auto">
          <Link href={user ? localizedPath('/profil', language) : localizedPath('/', language)} className="w-[118px] h-[34px] shrink-0 border border-dashed border-[#47597a] rounded-[6px] flex items-center justify-center text-[9px] font-semibold tracking-widest uppercase text-[#8ea0bd]">
            {t('login.logo')}
          </Link>

          <div className="hidden md:flex items-center gap-[22px] text-[13px] font-bold text-white shrink-0">
            <span className="cursor-pointer hover:text-[#d9704f] transition">{t('nav.auctionCalendar')}</span>
            <Link href={localizedPath('/register?role=vendeur', language)} className="cursor-pointer hover:text-[#d9704f] transition">
              {t('nav.sellWithUs')}
            </Link>
            <span className="cursor-pointer hover:text-[#d9704f] transition">{t('nav.help')}</span>
            <span className="cursor-pointer hover:text-[#d9704f] transition">{t('nav.findUs')}</span>
            <span className="cursor-pointer hover:text-[#d9704f] transition">{t('nav.contactUs')}</span>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex">
              <LanguageSelector compact onLanguageChange={persistLanguage} />
            </div>
            {user ? (
              <UserMenu displayName={getDisplayName()} initials={getInitials()} triggerClassName="hidden md:flex" />
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href={localizedPath('/login', language)} className="px-3 sm:px-[18px] py-2 sm:py-[10px] rounded-[8px] bg-[#d9704f] hover:bg-[#c26040] text-white text-[12px] font-bold uppercase tracking-[0.03em] transition whitespace-nowrap">
                  {t('nav.login')}
                </Link>
                <Link href={localizedPath('/register', language)} className="px-3 sm:px-[18px] py-2 sm:py-[10px] rounded-[8px] border border-[#2c4266] text-white text-[12px] font-semibold uppercase tracking-[0.03em] hover:bg-slate-800 transition whitespace-nowrap">
                  {t('nav.register')}
                </Link>
              </div>
            )}
            <MobileMenu
              onLanguageChange={persistLanguage}
              navLinks={[
                { label: t('nav.auctionCalendar') },
                { href: localizedPath('/register?role=vendeur', language), label: t('nav.sellWithUs') },
                { label: t('nav.help') },
                { label: t('nav.findUs') },
                { label: t('nav.contactUs') },
              ]}
            />
          </div>
        </header>

        {/* Main Content */}
        <main className={isAuthPage ? (currentPath === '/login' ? "flex-1 flex bg-white" : "flex-1 flex items-center justify-center p-6 sm:p-14 bg-white") : "flex-1 min-w-0 bg-white"}>
          {children}
        </main>
      </div>
    </div>
  );
}
