import { Metadata } from 'next';
import JsonLd from '../components/JsonLd';

export const metadata: Metadata = {
  title: 'Conformité légale et sécurité des transactions | DealAutoPro',
  description: 'Notre plateforme contrôle l’identité de chaque professionnel et sécurise vos transactions via des procédures conformes à la réglementation.',
};

export default function SecuriteConformitePage() {
  return (
    <div className="bg-white text-black font-sans min-h-[70vh] py-16 px-4 sm:px-[40px] flex flex-col items-center">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Conformité légale et sécurité des transactions | DealAutoPro",
        "description": "Notre plateforme contrôle l’identité de chaque professionnel et sécurise vos transactions via des procédures conformes à la réglementation."
      }} />
      <div className="max-w-[800px] w-full">
        <h1 className="font-extrabold text-[36px] sm:text-[46px] uppercase text-[#13243c] font-heading mb-6">
          Une plateforme conforme et sécurisée
        </h1>
        <p className="text-lg text-[#5a5e66] mb-8 leading-relaxed">
          DealAutoPro s’assure que seuls les professionnels autorisés participent aux enchères, garantissant ainsi un environnement de confiance.
        </p>
      </div>
    </div>
  );
}
