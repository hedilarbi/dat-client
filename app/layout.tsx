import type { Metadata } from "next";
import { Barlow, Saira_Condensed, IBM_Plex_Mono } from "next/font/google";
import "react-phone-number-input/style.css";
import "./globals.css";
import { LanguageProvider } from "./i18n";
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

export const metadata: Metadata = {
  title: "DealAutoPro",
  description: "Plateforme B2B dédiée aux professionnels de l'automobile",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
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
