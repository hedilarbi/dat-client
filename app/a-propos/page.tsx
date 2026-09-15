import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '../components/JsonLd';

export const metadata: Metadata = {
  title: 'À propos de DealAutoPro | Plateforme B2B Automobile',
  description: 'Découvrez la mission et les engagements de DealAutoPro, plateforme dédiée aux transactions de véhicules accidentés entre professionnels.',
};

const commitments = [
  ['Clarté', 'Des informations structurées, des statuts compréhensibles et une action identifiée à chaque étape.'],
  ['Traçabilité', 'Les offres, validations et documents de la transaction sont regroupés dans les espaces professionnels.'],
  ['Efficacité', 'Un parcours numérique conçu pour réduire les échanges dispersés et accélérer le traitement des dossiers.'],
  ['Équité', 'Des offres confidentielles pendant la session et des règles de sélection identiques pour les participants.'],
];

export default function AProposPage() {
  return (
    <main className="bg-white text-black">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'À propos de DealAutoPro', description: 'La mission et les engagements de DealAutoPro pour les professionnels de l’automobile.', mainEntity: { '@type': 'Organization', name: 'DealAutoPro' } }} />

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#d9704f]">À propos</p>
            <h1 className="mt-4 font-heading text-4xl font-extrabold uppercase leading-tight text-[#13243c] sm:text-6xl">Donner un cadre simple aux transactions automobiles B2B</h1>
            <p className="mt-6 text-lg leading-relaxed text-[#5a5e66]">DealAutoPro est une plateforme conçue pour faciliter la revente de véhicules accidentés entre professionnels. Elle relie les vendeurs disposant de véhicules à céder aux acheteurs capables de les valoriser, de les réparer ou de les traiter dans le cadre de leur activité.</p>
          </div>
          <div className="rounded-3xl bg-[#13243c] p-7 text-white sm:p-10">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#eaa083]">Notre mission</p>
            <p className="mt-5 font-heading text-3xl font-bold uppercase leading-tight">Rendre chaque dossier plus lisible, chaque offre plus simple et chaque transaction plus facile à suivre.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f7f2] px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">Pourquoi DealAutoPro ?</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c] sm:text-4xl">Un outil pensé pour les réalités du terrain</h2>
            <p className="mt-5 leading-relaxed text-[#5a5e66]">Une vente professionnelle ne se limite pas à une offre. Elle implique un véhicule correctement présenté, des interlocuteurs identifiés, des documents à signer, des validations successives et une remise organisée. DealAutoPro rassemble ce parcours dans une seule interface.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{commitments.map(([title, description], index) => (
            <article key={title} className="rounded-2xl border border-[#e5e1d7] bg-white p-6"><span className="font-mono text-xs font-bold text-[#d9704f]">0{index + 1}</span><h3 className="mt-4 text-xl font-bold text-[#13243c]">{title}</h3><p className="mt-3 leading-relaxed text-[#5a5e66]">{description}</p></article>
          ))}</div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#e5e1d7] p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">Pour les vendeurs</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">Mieux présenter et mieux suivre</h2>
            <p className="mt-4 leading-relaxed text-[#5a5e66]">Créez un dossier complet, publiez le véhicule dans une session, suivez les offres puis pilotez les étapes documentaires et la remise depuis votre espace.</p>
            <Link href="/vendre" className="mt-7 inline-flex font-bold text-[#d9704f] hover:underline">Découvrir l’espace vendeur →</Link>
          </article>
          <article className="rounded-3xl border border-[#e5e1d7] p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">Pour les acheteurs</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">Décider avec les bonnes informations</h2>
            <p className="mt-4 leading-relaxed text-[#5a5e66]">Consultez les dossiers disponibles, transmettez une offre confidentielle et suivez votre achat jusqu’à la mise à disposition du bon d’enlèvement.</p>
            <Link href="/acheter" className="mt-7 inline-flex font-bold text-[#d9704f] hover:underline">Découvrir l’espace acheteur →</Link>
          </article>
        </div>
      </section>

      <section className="bg-[#13243c] px-4 py-16 text-white sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
          <div><h2 className="font-heading text-3xl font-extrabold uppercase">Une question sur DealAutoPro ?</h2><p className="mt-2 text-white/70">Notre équipe vous accompagne dans la prise en main de la plateforme.</p></div>
          <Link href="/contact" className="rounded-lg bg-[#d9704f] px-6 py-3 text-sm font-bold uppercase text-white">Nous contacter</Link>
        </div>
      </section>
    </main>
  );
}
