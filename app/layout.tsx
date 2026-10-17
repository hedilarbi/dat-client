import type { Metadata } from "next";
import { Barlow, Saira_Condensed, IBM_Plex_Mono } from "next/font/google";
import "react-phone-number-input/style.css";
import "./globals.css";
import { LanguageProvider } from "./i18n";
import { getServerLanguage } from "./lib/serverLanguage";
import { UserProvider } from "./components/LayoutWrapper";
import LayoutWrapper from "./components/LayoutWrapper";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

const sairaCondensed = Saira_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-saira-condensed",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

const DESCRIPTIONS = {
  fr: "Plateforme B2B dédiée aux professionnels de l'automobile",
  en: 'B2B platform dedicated to automotive professionals',
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getServerLanguage();
  const description = DESCRIPTIONS[language];
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://dat-client.vercel.app'),
    title: "DealAutoPro",
    description,
    alternates: {
      canonical: '/',
      languages: {
        'fr-FR': '/fr',
        'en': '/en',
        'x-default': '/fr',
      },
    },
    openGraph: {
      title: "DealAutoPro",
      description,
      url: '/',
      siteName: "DealAutoPro",
      locale: language === 'en' ? 'en_GB' : 'fr_FR',
      type: 'website',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getServerLanguage();
  return (
    <html
      lang={language}
      className={`${barlow.variable} ${sairaCondensed.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white">
        <LanguageProvider>
          <UserProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </UserProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
