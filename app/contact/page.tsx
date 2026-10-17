import { Metadata } from 'next';
import JsonLd from '../components/JsonLd';
import { getServerLanguage } from '../lib/serverLanguage';

const CONTENT = {
  fr: {
    title: 'Contacter l’équipe DealAutoPro | Support professionnel',
    description: 'Une question sur une vente en cours ou sur votre inscription ? Contactez notre équipe support dédiée aux professionnels de l’automobile.',
    jsonDescription: 'Contactez notre équipe support dédiée aux professionnels de l’automobile.',
    heading: 'Contactez notre support',
    text: "Nous sommes à votre disposition pour vous accompagner dans vos démarches d'inscription, de vente ou d'achat.",
  },
  en: {
    title: 'Contact the DealAutoPro team | Professional support',
    description: 'A question about an ongoing sale or your registration? Contact our support team dedicated to automotive professionals.',
    jsonDescription: 'Contact our support team dedicated to automotive professionals.',
    heading: 'Contact our support',
    text: 'We are at your disposal to assist you with your registration, selling or buying procedures.',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const c = CONTENT[await getServerLanguage()];
  return { title: c.title, description: c.description };
}

export default async function ContactPage() {
  const c = CONTENT[await getServerLanguage()];
  return (
    <div className="bg-white text-black font-sans min-h-[70vh] py-16 px-4 sm:px-[40px] flex flex-col items-center">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": c.title,
        "description": c.jsonDescription
      }} />
      <div className="max-w-[800px] w-full">
        <h1 className="font-extrabold text-[36px] sm:text-[46px] uppercase text-[#13243c] font-heading mb-6">
          {c.heading}
        </h1>
        <p className="text-lg text-[#5a5e66] mb-8 leading-relaxed">
          {c.text}
        </p>
      </div>
    </div>
  );
}
