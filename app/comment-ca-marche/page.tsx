import type { Metadata } from 'next';
import JsonLd from '../components/JsonLd';
import LocalizedLink from '../components/LocalizedLink';

export const metadata: Metadata = {
  title: 'Comment fonctionne la vente B2B par offres | DealAutoPro',
  description: 'Découvrez comment vendre ou acheter un véhicule accidenté entre professionnels : dossier, offres, paiement, documents et enlèvement.',
};

const sellerSteps = [
  ['1', 'Créez le dossier du véhicule', 'Renseignez les caractéristiques, l’état, les documents et les photos utiles. Notre équipe vérifie le dossier avant sa mise en vente.'],
  ['2', 'Suivez la session de vente', 'Votre véhicule est présenté aux acheteurs professionnels validés. Les offres restent confidentielles jusqu’à la clôture.'],
  ['3', 'Confirmez le règlement', 'Une fois l’acheteur confirmé, il effectue le virement du prix du véhicule directement sur votre compte. Vous confirmez sa réception depuis votre espace.'],
  ['4', 'Finalisez les documents', 'Complétez les informations de la carte grise : le certificat de cession et la déclaration d’achat sont générés avec les tampons des deux parties. Vous les vérifiez, puis vous les signez électroniquement.'],
  ['5', 'Remettez le véhicule', 'Dès que les deux parties ont signé, la vente est finalisée et le bon d’enlèvement est généré : le véhicule peut être remis.'],
];

const buyerSteps = [
  ['1', 'Accédez aux véhicules', 'Après validation de votre compte professionnel, consultez les dossiers, les photos, les informations techniques et les dates de clôture.'],
  ['2', 'Déposez votre meilleure offre', 'Votre proposition est enregistrée de manière confidentielle. À la clôture, les meilleurs offrants sont informés de la suite donnée à la vente.'],
  ['3', 'Confirmez votre achat', 'Si votre offre est retenue, réglez la commission dans le délai indiqué puis effectuez le virement du véhicule directement au vendeur.'],
  ['4', 'Vérifiez et signez le dossier', 'Les documents sont générés avec votre tampon et celui du vendeur. Vérifiez-les, validez-les ou signalez une erreur, puis signez-les électroniquement.'],
  ['5', 'Récupérez le véhicule', 'Dès que les deux parties ont signé, téléchargez le bon d’enlèvement et organisez la récupération avec le vendeur.'],
];

// Miroir de la procédure d'achat : la troisième étape regroupe les documents administratifs
const transactionSteps = [
  'Paiement de la commission par l’acheteur',
  'Virement du prix, confirmé par le vendeur',
  'Documents administratifs : préparation, validation et signature électronique, puis bon d’enlèvement',
];

function AudienceSteps({ steps }: { steps: string[][] }) {
  return <ol className="mt-8 space-y-5">{steps.map(([number, title, description]) => (
    <li key={number} className="flex gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9704f] font-bold text-white">{number}</span>
      <div><h3 className="text-lg font-bold text-[#13243c]">{title}</h3><p className="mt-1 leading-relaxed text-[#5a5e66]">{description}</p></div>
    </li>
  ))}</ol>;
}

export default function CommentCaMarchePage() {
  return (
    <main className="bg-white text-black">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'HowTo', name: 'Comment acheter ou vendre un véhicule accidenté avec DealAutoPro', description: 'Le parcours DealAutoPro, de la création du dossier au bon d’enlèvement.', step: transactionSteps.map((name, index) => ({ '@type': 'HowToStep', position: index + 1, name })) }} />

      <section className="bg-[#13243c] px-4 py-16 text-white sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[#eaa083]">Comment ça marche ?</p>
          <h1 className="max-w-4xl font-heading text-4xl font-extrabold uppercase leading-tight sm:text-6xl">Une transaction claire, du premier dossier à l’enlèvement</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/75 sm:text-xl">DealAutoPro met en relation des professionnels de l’automobile et accompagne chaque vente de véhicule accidenté avec un parcours documenté, des délais visibles et des actions clairement attribuées.</p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#e8e4da] bg-[#f8f7f2] p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">Vous êtes vendeur</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">Vendez avec un dossier structuré</h2>
            <p className="mt-4 leading-relaxed text-[#5a5e66]">Centralisez les informations du véhicule, recevez des offres professionnelles et suivez la finalisation de la vente depuis votre tableau de bord.</p>
            <AudienceSteps steps={sellerSteps} />
            <LocalizedLink href="/register/vendeur" className="mt-9 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#d9704f] px-6 text-sm font-bold uppercase text-white transition hover:bg-[#c45f40]">Créer un compte vendeur</LocalizedLink>
          </article>

          <article className="rounded-3xl border border-[#d8dee7] bg-white p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">Vous êtes acheteur</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">Achetez en connaissance du dossier</h2>
            <p className="mt-4 leading-relaxed text-[#5a5e66]">Consultez les véhicules proposés, déposez vos offres confidentielles et retrouvez toutes les étapes administratives au même endroit.</p>
            <AudienceSteps steps={buyerSteps} />
            <LocalizedLink href="/register/acheteur" className="mt-9 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#13243c] px-6 text-sm font-bold uppercase text-white transition hover:bg-[#1d3555]">Créer un compte acheteur</LocalizedLink>
          </article>
        </div>
      </section>

      <section className="bg-[#f8f7f2] px-4 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">Après l’attribution</p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c] sm:text-4xl">Les étapes de la transaction</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-[#5a5e66]">Chaque partie voit l’étape actuelle, l’action attendue et les documents disponibles depuis son espace.</p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">{transactionSteps.map((step, index) => (
            <li key={step} className="rounded-2xl border border-[#e8e4da] bg-white p-5"><span className="font-mono text-xs font-bold uppercase text-[#d9704f]">Étape {index + 1}/{transactionSteps.length}</span><p className="mt-3 font-bold leading-snug text-[#13243c]">{step}</p></li>
          ))}</ol>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-[#13243c] p-7 text-white sm:p-10 lg:flex-row lg:items-center">
          <div><h2 className="font-heading text-3xl font-extrabold uppercase">Prêt à commencer ?</h2><p className="mt-2 max-w-2xl text-white/70">Choisissez votre espace professionnel. Votre compte et vos justificatifs seront vérifiés avant l’accès complet à la plateforme.</p></div>
          <div className="flex flex-wrap gap-3"><LocalizedLink href="/vendre" className="rounded-lg bg-[#d9704f] px-5 py-3 text-sm font-bold uppercase text-white">Je veux vendre</LocalizedLink><LocalizedLink href="/acheter" className="rounded-lg border border-white/35 px-5 py-3 text-sm font-bold uppercase text-white">Je veux acheter</LocalizedLink></div>
        </div>
      </section>
    </main>
  );
}
