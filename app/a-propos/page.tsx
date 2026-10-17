import type { Metadata } from 'next';
import JsonLd from '../components/JsonLd';
import LocalizedLink from '../components/LocalizedLink';
import { getServerLanguage } from '../lib/serverLanguage';

const CONTENT = {
  fr: {
    metaTitle: 'À propos de DealAutoPro | Plateforme B2B Automobile',
    metaDescription: 'Découvrez la mission et les engagements de DealAutoPro, plateforme dédiée aux transactions de véhicules accidentés entre professionnels.',
    jsonName: 'À propos de DealAutoPro',
    jsonDescription: 'La mission et les engagements de DealAutoPro pour les professionnels de l’automobile.',
    commitments: [
      ['Clarté', 'Des informations structurées, des statuts compréhensibles et une action identifiée à chaque étape.'],
      ['Traçabilité', 'Les offres, validations et documents de la transaction sont regroupés dans les espaces professionnels.'],
      ['Efficacité', 'Un parcours numérique conçu pour réduire les échanges dispersés et accélérer le traitement des dossiers.'],
      ['Équité', 'Des offres confidentielles pendant la session et des règles de sélection identiques pour les participants.'],
    ],
    eyebrow: 'À propos',
    title: 'Donner un cadre simple aux transactions automobiles B2B',
    intro: 'DealAutoPro est une plateforme conçue pour faciliter la revente de véhicules accidentés entre professionnels. Elle relie les vendeurs disposant de véhicules à céder aux acheteurs capables de les valoriser, de les réparer ou de les traiter dans le cadre de leur activité.',
    missionLabel: 'Notre mission',
    mission: 'Rendre chaque dossier plus lisible, chaque offre plus simple et chaque transaction plus facile à suivre.',
    whyEyebrow: 'Pourquoi DealAutoPro ?',
    whyTitle: 'Un outil pensé pour les réalités du terrain',
    whyText: 'Une vente professionnelle ne se limite pas à une offre. Elle implique un véhicule correctement présenté, des interlocuteurs identifiés, des documents à signer, des validations successives et une remise organisée. DealAutoPro rassemble ce parcours dans une seule interface.',
    sellersEyebrow: 'Pour les vendeurs',
    sellersTitle: 'Mieux présenter et mieux suivre',
    sellersText: 'Créez un dossier complet, publiez le véhicule dans une session, suivez les offres puis pilotez les étapes documentaires et la remise depuis votre espace.',
    sellersCta: 'Découvrir l’espace vendeur →',
    buyersEyebrow: 'Pour les acheteurs',
    buyersTitle: 'Décider avec les bonnes informations',
    buyersText: 'Consultez les dossiers disponibles, transmettez une offre confidentielle et suivez votre achat jusqu’à la mise à disposition du bon d’enlèvement.',
    buyersCta: 'Voir comment ça marche →',
    questionTitle: 'Une question sur DealAutoPro ?',
    questionText: 'Notre équipe vous accompagne dans la prise en main de la plateforme.',
    contact: 'Nous contacter',
  },
  en: {
    metaTitle: 'About DealAutoPro | B2B Automotive Platform',
    metaDescription: 'Discover the mission and commitments of DealAutoPro, a platform dedicated to damaged-vehicle transactions between professionals.',
    jsonName: 'About DealAutoPro',
    jsonDescription: 'The mission and commitments of DealAutoPro for automotive professionals.',
    commitments: [
      ['Clarity', 'Structured information, understandable statuses and a clearly identified action at every step.'],
      ['Traceability', 'Offers, validations and documents of the transaction are gathered in the professional spaces.'],
      ['Efficiency', 'A digital journey designed to reduce scattered exchanges and speed up the processing of files.'],
      ['Fairness', 'Confidential offers during the session and identical selection rules for all participants.'],
    ],
    eyebrow: 'About',
    title: 'Giving B2B automotive transactions a simple framework',
    intro: 'DealAutoPro is a platform designed to make the resale of damaged vehicles between professionals easier. It connects sellers with vehicles to dispose of to buyers able to refurbish, repair or process them as part of their business.',
    missionLabel: 'Our mission',
    mission: 'Make every file more readable, every offer simpler and every transaction easier to follow.',
    whyEyebrow: 'Why DealAutoPro?',
    whyTitle: 'A tool built for real-world needs',
    whyText: 'A professional sale is more than an offer. It involves a properly presented vehicle, identified counterparts, documents to sign, successive validations and an organized handover. DealAutoPro brings this whole journey together in a single interface.',
    sellersEyebrow: 'For sellers',
    sellersTitle: 'Present better and follow better',
    sellersText: 'Create a complete file, publish the vehicle in a session, follow the offers, then manage the document steps and the handover from your space.',
    sellersCta: 'Discover the seller space →',
    buyersEyebrow: 'For buyers',
    buyersTitle: 'Decide with the right information',
    buyersText: 'Browse the available files, submit a confidential offer and follow your purchase until the pick-up order is made available.',
    buyersCta: 'See how it works →',
    questionTitle: 'A question about DealAutoPro?',
    questionText: 'Our team supports you in getting started with the platform.',
    contact: 'Contact us',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const c = CONTENT[await getServerLanguage()];
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function AProposPage() {
  const c = CONTENT[await getServerLanguage()];
  return (
    <main className="bg-white text-black">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'AboutPage', name: c.jsonName, description: c.jsonDescription, mainEntity: { '@type': 'Organization', name: 'DealAutoPro' } }} />

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#d9704f]">{c.eyebrow}</p>
            <h1 className="mt-4 font-heading text-4xl font-extrabold uppercase leading-tight text-[#13243c] sm:text-6xl">{c.title}</h1>
            <p className="mt-6 text-lg leading-relaxed text-[#5a5e66]">{c.intro}</p>
          </div>
          <div className="rounded-3xl bg-[#13243c] p-7 text-white sm:p-10">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#eaa083]">{c.missionLabel}</p>
            <p className="mt-5 font-heading text-3xl font-bold uppercase leading-tight">{c.mission}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f7f2] px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">{c.whyEyebrow}</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c] sm:text-4xl">{c.whyTitle}</h2>
            <p className="mt-5 leading-relaxed text-[#5a5e66]">{c.whyText}</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{c.commitments.map(([title, description], index) => (
            <article key={title} className="rounded-2xl border border-[#e5e1d7] bg-white p-6"><span className="font-mono text-xs font-bold text-[#d9704f]">0{index + 1}</span><h3 className="mt-4 text-xl font-bold text-[#13243c]">{title}</h3><p className="mt-3 leading-relaxed text-[#5a5e66]">{description}</p></article>
          ))}</div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#e5e1d7] p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">{c.sellersEyebrow}</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">{c.sellersTitle}</h2>
            <p className="mt-4 leading-relaxed text-[#5a5e66]">{c.sellersText}</p>
            <LocalizedLink href="/vendre" className="mt-7 inline-flex font-bold text-[#d9704f] hover:underline">{c.sellersCta}</LocalizedLink>
          </article>
          <article className="rounded-3xl border border-[#e5e1d7] p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">{c.buyersEyebrow}</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">{c.buyersTitle}</h2>
            <p className="mt-4 leading-relaxed text-[#5a5e66]">{c.buyersText}</p>
            <LocalizedLink href="/comment-ca-marche" className="mt-7 inline-flex font-bold text-[#d9704f] hover:underline">{c.buyersCta}</LocalizedLink>
          </article>
        </div>
      </section>

      <section className="bg-[#13243c] px-4 py-16 text-white sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
          <div><h2 className="font-heading text-3xl font-extrabold uppercase">{c.questionTitle}</h2><p className="mt-2 text-white/70">{c.questionText}</p></div>
          <LocalizedLink href="/contact" className="rounded-lg bg-[#d9704f] px-6 py-3 text-sm font-bold uppercase text-white">{c.contact}</LocalizedLink>
        </div>
      </section>
    </main>
  );
}
