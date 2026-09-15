import { Metadata } from 'next';
import JsonLd from '../components/JsonLd';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acheter des véhicules accidentés entre pros | DealAutoPro',
  description: 'Accédez à des véhicules accidentés, sinistrés ou en panne. Analysez les dossiers, déposez une offre confidentielle et suivez chaque étape en ligne.',
};

export default function AcheterPage() {
  return (
    <div className="bg-white text-black font-sans min-h-[70vh] py-16 px-4 sm:px-[40px] flex flex-col items-center">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Acheter des véhicules accidentés entre pros | DealAutoPro",
        "description": "Accédez à des véhicules accidentés, sinistrés ou en panne."
      }} />
      <div className="max-w-[800px] w-full">
        <h1 className="font-extrabold text-[36px] sm:text-[46px] uppercase text-[#13243c] font-heading mb-6">
          Achetez des véhicules accidentés par appel d’offres
        </h1>
        <p className="text-lg text-[#5a5e66] mb-8 leading-relaxed">
          DealAutoPro permet aux professionnels autorisés de consulter des véhicules à réparer, à démonter, à exporter ou à remettre en circulation selon leur statut et la réglementation applicable. Chaque offre est déposée à pli fermé : vous ne voyez pas le montant proposé par les autres acheteurs.
        </p>
        <div className="flex gap-4">
          <Link href="/vehicules" className="px-6 py-3 bg-[#13243c] text-white font-bold rounded-lg uppercase tracking-wide hover:bg-slate-800 transition">
            Voir le catalogue
          </Link>
          <Link href="/register/acheteur" className="px-6 py-3 bg-gray-200 text-[#13243c] font-bold rounded-lg uppercase tracking-wide hover:bg-gray-300 transition">
            Créer un compte acheteur
          </Link>
        </div>
      </div>
    </div>
  );
}
