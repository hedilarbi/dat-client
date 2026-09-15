import { Metadata } from 'next';
import JsonLd from '../components/JsonLd';

export const metadata: Metadata = {
  title: 'À propos de DealAutoPro | Plateforme B2B Automobile',
  description: 'Découvrez notre mission : simplifier et sécuriser la revente de véhicules entre professionnels de l’automobile grâce à un outil numérique performant.',
};

export default function AProposPage() {
  return (
    <div className="bg-white text-black font-sans min-h-[70vh] py-16 px-4 sm:px-[40px] flex flex-col items-center">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "À propos de DealAutoPro | Plateforme B2B Automobile",
        "description": "Découvrez notre mission : simplifier et sécuriser la revente de véhicules entre professionnels."
      }} />
      <div className="max-w-[800px] w-full">
        <h1 className="font-extrabold text-[36px] sm:text-[46px] uppercase text-[#13243c] font-heading mb-6">
          À propos de DealAutoPro
        </h1>
        <p className="text-lg text-[#5a5e66] mb-8 leading-relaxed">
          Notre mission est de fluidifier le marché des véhicules accidentés en connectant les vendeurs professionnels aux réparateurs et centres agréés.
        </p>
      </div>
    </div>
  );
}
