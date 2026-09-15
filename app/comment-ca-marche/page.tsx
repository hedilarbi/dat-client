import { Metadata } from 'next';
import JsonLd from '../components/JsonLd';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Comment fonctionne la vente aux enchères B2B | DealAutoPro',
  description: 'Découvrez le fonctionnement de notre plateforme d’enchères : dépôt de véhicules, offres à pli fermé, paiement sécurisé et enlèvement organisé.',
};

export default function CommentCaMarchePage() {
  return (
    <div className="bg-white text-black font-sans min-h-[70vh] py-16 px-4 sm:px-[40px] flex flex-col items-center">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Comment fonctionne la vente aux enchères B2B | DealAutoPro",
        "description": "Découvrez le fonctionnement de notre plateforme d’enchères."
      }} />
      <div className="max-w-[800px] w-full">
        <h1 className="font-extrabold text-[36px] sm:text-[46px] uppercase text-[#13243c] font-heading mb-6">
          Un processus d’achat et de vente sécurisé
        </h1>
        <p className="text-lg text-[#5a5e66] mb-8 leading-relaxed">
          DealAutoPro encadre chaque étape de la transaction pour garantir la transparence et la sécurité aux acheteurs comme aux vendeurs professionnels.
        </p>
      </div>
    </div>
  );
}
