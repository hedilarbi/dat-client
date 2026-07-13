import type { Metadata } from "next";
import { Barlow, Saira_Condensed } from "next/font/google";
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

export const metadata: Metadata = {
  title: "DealsAutoPro",
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
      className={`${barlow.variable} ${sairaCondensed.variable} h-full antialiased`}
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
