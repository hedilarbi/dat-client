import type { Metadata } from 'next';
import JsonLd from '../components/JsonLd';
import LocalizedLink from '../components/LocalizedLink';
import { getServerLanguage } from '../lib/serverLanguage';

const CONTENT = {
  fr: {
    metaTitle: 'Comment fonctionne la vente B2B par offres | DealAutoPro',
    metaDescription: 'Découvrez comment vendre ou acheter un véhicule accidenté entre professionnels : dossier, offres, paiement, documents et enlèvement.',
    jsonName: 'Comment acheter ou vendre un véhicule accidenté avec DealAutoPro',
    jsonDescription: 'Le parcours DealAutoPro, de la création du dossier au bon d’enlèvement.',
    sellerSteps: [
      ['1', 'Créez le dossier du véhicule', 'Renseignez les caractéristiques, l’état, les documents et les photos utiles. Notre équipe vérifie le dossier avant sa mise en vente.'],
      ['2', 'Suivez la session de vente', 'Votre véhicule est présenté aux acheteurs professionnels validés. Les offres restent confidentielles jusqu’à la clôture.'],
      ['3', 'Confirmez le règlement', 'Une fois l’acheteur confirmé, il effectue le virement du prix du véhicule directement sur votre compte. Vous confirmez sa réception depuis votre espace.'],
      ['4', 'Finalisez les documents', 'Complétez les informations de la carte grise : le certificat de cession et la déclaration d’achat sont générés avec les tampons des deux parties. Vous les vérifiez, puis vous les signez électroniquement.'],
      ['5', 'Remettez le véhicule', 'Dès que les deux parties ont signé, la vente est finalisée et le bon d’enlèvement est généré : le véhicule peut être remis.'],
    ],
    buyerSteps: [
      ['1', 'Accédez aux véhicules', 'Après validation de votre compte professionnel, consultez les dossiers, les photos, les informations techniques et les dates de clôture.'],
      ['2', 'Déposez votre meilleure offre', 'Votre proposition est enregistrée de manière confidentielle. À la clôture, les meilleurs offrants sont informés de la suite donnée à la vente.'],
      ['3', 'Confirmez votre achat', 'Si votre offre est retenue, réglez la commission dans le délai indiqué puis effectuez le virement du véhicule directement au vendeur.'],
      ['4', 'Vérifiez et signez le dossier', 'Les documents sont générés avec votre tampon et celui du vendeur. Vérifiez-les, validez-les ou signalez une erreur, puis signez-les électroniquement.'],
      ['5', 'Récupérez le véhicule', 'Dès que les deux parties ont signé, téléchargez le bon d’enlèvement et organisez la récupération avec le vendeur.'],
    ],
    transactionSteps: [
      'Paiement de la commission par l’acheteur',
      'Virement du prix, confirmé par le vendeur',
      'Documents administratifs : préparation, validation et signature électronique, puis bon d’enlèvement',
    ],
    eyebrow: 'Comment ça marche ?',
    title: 'Une transaction claire, du premier dossier à l’enlèvement',
    intro: 'DealAutoPro met en relation des professionnels de l’automobile et accompagne chaque vente de véhicule accidenté avec un parcours documenté, des délais visibles et des actions clairement attribuées.',
    sellerEyebrow: 'Vous êtes vendeur',
    sellerTitle: 'Vendez avec un dossier structuré',
    sellerText: 'Centralisez les informations du véhicule, recevez des offres professionnelles et suivez la finalisation de la vente depuis votre tableau de bord.',
    sellerCta: 'Créer un compte vendeur',
    buyerEyebrow: 'Vous êtes acheteur',
    buyerTitle: 'Achetez en connaissance du dossier',
    buyerText: 'Consultez les véhicules proposés, déposez vos offres confidentielles et retrouvez toutes les étapes administratives au même endroit.',
    buyerCta: 'Créer un compte acheteur',
    afterEyebrow: 'Après l’attribution',
    afterTitle: 'Les étapes de la transaction',
    afterText: 'Chaque partie voit l’étape actuelle, l’action attendue et les documents disponibles depuis son espace.',
    stepOf: 'Étape',
    readyTitle: 'Prêt à commencer ?',
    readyText: 'Choisissez votre espace professionnel. Votre compte et vos justificatifs seront vérifiés avant l’accès complet à la plateforme.',
    wantSell: 'Je veux vendre',
    wantBuy: 'Je veux acheter',
  },
  en: {
    metaTitle: 'How B2B sales by offers work | DealAutoPro',
    metaDescription: 'Find out how to sell or buy a damaged vehicle between professionals: file, offers, payment, documents and pick-up.',
    jsonName: 'How to buy or sell a damaged vehicle with DealAutoPro',
    jsonDescription: 'The DealAutoPro journey, from creating the file to the pick-up order.',
    sellerSteps: [
      ['1', 'Create the vehicle file', 'Fill in the characteristics, condition, documents and useful photos. Our team reviews the file before it is put up for sale.'],
      ['2', 'Follow the sales session', 'Your vehicle is presented to approved professional buyers. Offers remain confidential until the session closes.'],
      ['3', 'Confirm the payment', 'Once the buyer is confirmed, they transfer the vehicle price directly to your account. You confirm its receipt from your space.'],
      ['4', 'Finalize the documents', 'Complete the registration certificate information: the certificate of transfer and the purchase declaration are generated with both parties’ stamps. You review them, then sign them electronically.'],
      ['5', 'Hand over the vehicle', 'As soon as both parties have signed, the sale is finalized and the pick-up order is generated: the vehicle can be handed over.'],
    ],
    buyerSteps: [
      ['1', 'Access the vehicles', 'Once your professional account is approved, browse the files, photos, technical information and closing dates.'],
      ['2', 'Place your best offer', 'Your proposal is recorded confidentially. When the session closes, the best bidders are informed of the outcome of the sale.'],
      ['3', 'Confirm your purchase', 'If your offer is selected, pay the commission within the stated deadline, then transfer the vehicle price directly to the seller.'],
      ['4', 'Review and sign the file', 'The documents are generated with your stamp and the seller’s. Review them, approve them or report an error, then sign them electronically.'],
      ['5', 'Collect the vehicle', 'As soon as both parties have signed, download the pick-up order and arrange the collection with the seller.'],
    ],
    transactionSteps: [
      'Commission payment by the buyer',
      'Price transfer, confirmed by the seller',
      'Administrative documents: preparation, validation and electronic signature, then pick-up order',
    ],
    eyebrow: 'How does it work?',
    title: 'A clear transaction, from the first file to pick-up',
    intro: 'DealAutoPro connects automotive professionals and supports every damaged-vehicle sale with a documented journey, visible deadlines and clearly assigned actions.',
    sellerEyebrow: 'You are a seller',
    sellerTitle: 'Sell with a structured file',
    sellerText: 'Centralize the vehicle information, receive professional offers and follow the finalization of the sale from your dashboard.',
    sellerCta: 'Create a seller account',
    buyerEyebrow: 'You are a buyer',
    buyerTitle: 'Buy with full knowledge of the file',
    buyerText: 'Browse the vehicles on offer, place your confidential offers and find all the administrative steps in one place.',
    buyerCta: 'Create a buyer account',
    afterEyebrow: 'After the award',
    afterTitle: 'The steps of the transaction',
    afterText: 'Each party sees the current step, the expected action and the available documents from their space.',
    stepOf: 'Step',
    readyTitle: 'Ready to get started?',
    readyText: 'Choose your professional space. Your account and supporting documents will be verified before full access to the platform.',
    wantSell: 'I want to sell',
    wantBuy: 'I want to buy',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const c = CONTENT[await getServerLanguage()];
  return { title: c.metaTitle, description: c.metaDescription };
}

function AudienceSteps({ steps }: { steps: readonly (readonly string[])[] }) {
  return <ol className="mt-8 space-y-5">{steps.map(([number, title, description]) => (
    <li key={number} className="flex gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9704f] font-bold text-white">{number}</span>
      <div><h3 className="text-lg font-bold text-[#13243c]">{title}</h3><p className="mt-1 leading-relaxed text-[#5a5e66]">{description}</p></div>
    </li>
  ))}</ol>;
}

export default async function CommentCaMarchePage() {
  const c = CONTENT[await getServerLanguage()];
  return (
    <main className="bg-white text-black">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'HowTo', name: c.jsonName, description: c.jsonDescription, step: c.transactionSteps.map((name, index) => ({ '@type': 'HowToStep', position: index + 1, name })) }} />

      <section className="bg-[#13243c] px-4 py-16 text-white sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[#eaa083]">{c.eyebrow}</p>
          <h1 className="max-w-4xl font-heading text-4xl font-extrabold uppercase leading-tight sm:text-6xl">{c.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/75 sm:text-xl">{c.intro}</p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#e8e4da] bg-[#f8f7f2] p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">{c.sellerEyebrow}</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">{c.sellerTitle}</h2>
            <p className="mt-4 leading-relaxed text-[#5a5e66]">{c.sellerText}</p>
            <AudienceSteps steps={c.sellerSteps} />
            <LocalizedLink href="/register/vendeur" className="mt-9 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#d9704f] px-6 text-sm font-bold uppercase text-white transition hover:bg-[#c45f40]">{c.sellerCta}</LocalizedLink>
          </article>

          <article className="rounded-3xl border border-[#d8dee7] bg-white p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">{c.buyerEyebrow}</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">{c.buyerTitle}</h2>
            <p className="mt-4 leading-relaxed text-[#5a5e66]">{c.buyerText}</p>
            <AudienceSteps steps={c.buyerSteps} />
            <LocalizedLink href="/register/acheteur" className="mt-9 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#13243c] px-6 text-sm font-bold uppercase text-white transition hover:bg-[#1d3555]">{c.buyerCta}</LocalizedLink>
          </article>
        </div>
      </section>

      <section className="bg-[#f8f7f2] px-4 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">{c.afterEyebrow}</p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c] sm:text-4xl">{c.afterTitle}</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-[#5a5e66]">{c.afterText}</p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">{c.transactionSteps.map((step, index) => (
            <li key={step} className="rounded-2xl border border-[#e8e4da] bg-white p-5"><span className="font-mono text-xs font-bold uppercase text-[#d9704f]">{c.stepOf} {index + 1}/{c.transactionSteps.length}</span><p className="mt-3 font-bold leading-snug text-[#13243c]">{step}</p></li>
          ))}</ol>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-[#13243c] p-7 text-white sm:p-10 lg:flex-row lg:items-center">
          <div><h2 className="font-heading text-3xl font-extrabold uppercase">{c.readyTitle}</h2><p className="mt-2 max-w-2xl text-white/70">{c.readyText}</p></div>
          <div className="flex flex-wrap gap-3"><LocalizedLink href="/vendre" className="rounded-lg bg-[#d9704f] px-5 py-3 text-sm font-bold uppercase text-white">{c.wantSell}</LocalizedLink><LocalizedLink href="/register/acheteur" className="rounded-lg border border-white/35 px-5 py-3 text-sm font-bold uppercase text-white">{c.wantBuy}</LocalizedLink></div>
        </div>
      </section>
    </main>
  );
}
