import { Metadata } from 'next';
import JsonLd from '../components/JsonLd';

export const metadata: Metadata = {
  title: 'Contacter l’équipe DealAutoPro | Support professionnel',
  description: 'Une question sur une enchère en cours ou sur votre inscription ? Contactez notre équipe support dédiée aux professionnels de l’automobile.',
};

export default function ContactPage() {
  return (
    <div className="bg-white text-black font-sans min-h-[70vh] py-16 px-4 sm:px-[40px] flex flex-col items-center">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Contacter l’équipe DealAutoPro | Support professionnel",
        "description": "Contactez notre équipe support dédiée aux professionnels de l’automobile."
      }} />
      <div className="max-w-[800px] w-full">
        <h1 className="font-extrabold text-[36px] sm:text-[46px] uppercase text-[#13243c] font-heading mb-6">
          Contactez notre support
        </h1>
        <p className="text-lg text-[#5a5e66] mb-8 leading-relaxed">
          Nous sommes à votre disposition pour vous accompagner dans vos démarches d'inscription, de vente ou d'achat.
        </p>
      </div>
    </div>
  );
}
