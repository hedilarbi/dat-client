import { Metadata } from 'next';
import JsonLd from '../components/JsonLd';
import LocalizedLink from '../components/LocalizedLink';
import { getServerLanguage } from '../lib/serverLanguage';

const CONTENT = {
  fr: {
    title: 'Acheter des véhicules accidentés entre pros | DealAutoPro',
    description: 'Accédez à des véhicules accidentés, sinistrés ou en panne. Analysez les dossiers, déposez une offre confidentielle et suivez chaque étape en ligne.',
    jsonDescription: 'Accédez à des véhicules accidentés, sinistrés ou en panne.',
    heading: 'Achetez des véhicules accidentés par appel d’offres',
    text: 'DealAutoPro permet aux professionnels autorisés de consulter des véhicules à réparer, à démonter, à exporter ou à remettre en circulation selon leur statut et la réglementation applicable. Chaque offre est déposée à pli fermé : vous ne voyez pas le montant proposé par les autres acheteurs.',
    catalog: 'Voir le catalogue',
    register: 'Créer un compte acheteur',
  },
  en: {
    title: 'Buy damaged vehicles between professionals | DealAutoPro',
    description: 'Access damaged, written-off or broken-down vehicles. Review the files, submit a confidential offer and follow every step online.',
    jsonDescription: 'Access damaged, written-off or broken-down vehicles.',
    heading: 'Buy damaged vehicles through sealed-bid auctions',
    text: 'DealAutoPro allows authorized professionals to browse vehicles to repair, dismantle, export or put back on the road, depending on their status and the applicable regulations. Every offer is submitted under seal: you cannot see the amount proposed by other buyers.',
    catalog: 'View the catalog',
    register: 'Create a buyer account',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const c = CONTENT[await getServerLanguage()];
  return { title: c.title, description: c.description };
}

export default async function AcheterPage() {
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
        <div className="flex gap-4">
          <LocalizedLink href="/vehicules" className="px-6 py-3 bg-[#13243c] text-white font-bold rounded-lg uppercase tracking-wide hover:bg-slate-800 transition">
            {c.catalog}
          </LocalizedLink>
          <LocalizedLink href="/register/acheteur" className="px-6 py-3 bg-gray-200 text-[#13243c] font-bold rounded-lg uppercase tracking-wide hover:bg-gray-300 transition">
            {c.register}
          </LocalizedLink>
        </div>
      </div>
    </div>
  );
}
