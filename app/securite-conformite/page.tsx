import type { Metadata } from 'next';
import JsonLd from '../components/JsonLd';
import LocalizedLink from '../components/LocalizedLink';
import { getServerLanguage } from '../lib/serverLanguage';

const CONTENT = {
  fr: {
    metaTitle: 'Sécurité et conformité des transactions | DealAutoPro',
    metaDescription: 'Découvrez les contrôles, la traçabilité documentaire et les bonnes pratiques qui encadrent les transactions professionnelles sur DealAutoPro.',
    jsonName: 'Sécurité et conformité des transactions DealAutoPro',
    jsonDescription: 'Les mesures qui encadrent les comptes professionnels, les offres et les documents sur DealAutoPro.',
    protections: [
      ['Professionnels vérifiés', 'L’accès aux fonctionnalités de vente et d’achat est soumis à la création d’un compte professionnel et à la validation des justificatifs demandés.'],
      ['Offres confidentielles', 'Les montants proposés ne sont pas affichés aux autres participants pendant la session de vente.'],
      ['Parcours tracé', 'Les changements d’étape, confirmations et documents restent rattachés au dossier de vente concerné.'],
      ['Documents centralisés', 'Certificat de cession, déclaration d’achat et bon d’enlèvement sont mis à disposition au moment prévu dans le parcours.'],
      ['Signature électronique', 'Les deux parties reçoivent leur parcours de signature. Les versions signées sont ensuite récupérées pour poursuivre les validations.'],
      ['Validation croisée', 'Le vendeur et l’acheteur interviennent successivement afin de vérifier les règlements, tampons et documents avant la clôture.'],
    ],
    habits: [
      'Ne communiquez jamais votre mot de passe ou un code de sécurité.',
      'Vérifiez toujours les coordonnées bancaires affichées dans votre espace.',
      'Ne confirmez un virement qu’après avoir constaté les fonds sur votre compte.',
      'Ouvrez et contrôlez chaque document avant de le valider.',
      'Utilisez la messagerie de support en cas de doute ou d’incohérence.',
    ],
    eyebrow: 'Sécurité & conformité',
    title: 'Un cadre de confiance pour chaque transaction',
    intro: 'DealAutoPro combine contrôle des accès, confidentialité des offres, suivi des actions et validation documentaire pour rendre les échanges entre professionnels plus lisibles et plus sûrs.',
    measuresEyebrow: 'Nos dispositifs',
    measuresTitle: 'La sécurité à chaque niveau du parcours',
    flowsEyebrow: 'Flux financiers',
    flowsTitle: 'Qui paie quoi, et à qui ?',
    flowCommissionBold: 'La commission plateforme',
    flowCommission: ' est réglée en ligne par l’acheteur lorsque son offre est retenue.',
    flowPriceBold: 'Le prix du véhicule',
    flowPrice: ' est viré directement par l’acheteur sur le compte bancaire communiqué par le vendeur. DealAutoPro ne reçoit pas et ne conserve pas ce montant.',
    flowReceiptBold: 'La réception du virement',
    flowReceipt: ' doit être vérifiée par le vendeur sur son propre compte avant toute confirmation dans la plateforme.',
    vigilanceEyebrow: 'Votre vigilance compte',
    vigilanceTitle: 'Les bons réflexes',
    dataEyebrow: 'Données et accès',
    dataTitle: 'Un accès réservé à votre activité',
    dataText1: 'Chaque utilisateur accède à un espace lié à son rôle. Les informations de vente sont présentées aux personnes concernées par le dossier et aux équipes habilitées à assurer son traitement.',
    dataText2: 'Il vous appartient de maintenir vos coordonnées à jour, de protéger vos identifiants et de signaler rapidement tout accès ou comportement inhabituel. Pour toute question concernant vos données ou les conditions applicables à votre utilisation de la plateforme, contactez notre équipe.',
    askTeam: 'Poser une question à notre équipe →',
    problemTitle: 'Vous avez identifié un problème ?',
    problemText: 'Contactez notre équipe avant de poursuivre ou de valider l’étape concernée.',
    contactSupport: 'Contacter le support',
  },
  en: {
    metaTitle: 'Transaction security and compliance | DealAutoPro',
    metaDescription: 'Discover the controls, document traceability and good practices that frame professional transactions on DealAutoPro.',
    jsonName: 'DealAutoPro transaction security and compliance',
    jsonDescription: 'The measures that frame professional accounts, offers and documents on DealAutoPro.',
    protections: [
      ['Verified professionals', 'Access to selling and buying features requires a professional account and the validation of the requested supporting documents.'],
      ['Confidential offers', 'The amounts offered are not shown to other participants during the sales session.'],
      ['Traced journey', 'Step changes, confirmations and documents remain attached to the relevant sales file.'],
      ['Centralized documents', 'The certificate of transfer, purchase declaration and pick-up order are made available at the planned point of the journey.'],
      ['Electronic signature', 'Both parties receive their signing journey. The signed versions are then retrieved to continue the validations.'],
      ['Cross-validation', 'The seller and the buyer act in turn to check payments, stamps and documents before closing.'],
    ],
    habits: [
      'Never share your password or a security code.',
      'Always check the bank details displayed in your space.',
      'Only confirm a transfer after seeing the funds on your account.',
      'Open and check every document before validating it.',
      'Use the support messaging in case of doubt or inconsistency.',
    ],
    eyebrow: 'Security & compliance',
    title: 'A framework of trust for every transaction',
    intro: 'DealAutoPro combines access control, offer confidentiality, action tracking and document validation to make exchanges between professionals clearer and safer.',
    measuresEyebrow: 'Our safeguards',
    measuresTitle: 'Security at every level of the journey',
    flowsEyebrow: 'Financial flows',
    flowsTitle: 'Who pays what, and to whom?',
    flowCommissionBold: 'The platform commission',
    flowCommission: ' is paid online by the buyer when their offer is selected.',
    flowPriceBold: 'The vehicle price',
    flowPrice: ' is transferred directly by the buyer to the bank account provided by the seller. DealAutoPro does not receive or hold this amount.',
    flowReceiptBold: 'The receipt of the transfer',
    flowReceipt: ' must be checked by the seller on their own account before any confirmation in the platform.',
    vigilanceEyebrow: 'Your vigilance matters',
    vigilanceTitle: 'Good habits',
    dataEyebrow: 'Data and access',
    dataTitle: 'Access restricted to your activity',
    dataText1: 'Each user accesses a space tied to their role. Sale information is shown to the people concerned by the file and to the teams authorized to process it.',
    dataText2: 'It is your responsibility to keep your contact details up to date, protect your credentials and promptly report any unusual access or behavior. For any question about your data or the conditions applicable to your use of the platform, contact our team.',
    askTeam: 'Ask our team a question →',
    problemTitle: 'Spotted a problem?',
    problemText: 'Contact our team before continuing or validating the step concerned.',
    contactSupport: 'Contact support',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const c = CONTENT[await getServerLanguage()];
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function SecuriteConformitePage() {
  const c = CONTENT[await getServerLanguage()];
  return (
    <main className="bg-white text-black">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: c.jsonName, description: c.jsonDescription }} />

      <section className="bg-[#13243c] px-4 py-16 text-white sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#eaa083]">{c.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-heading text-4xl font-extrabold uppercase leading-tight sm:text-6xl">{c.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/75">{c.intro}</p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">{c.measuresEyebrow}</p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c] sm:text-4xl">{c.measuresTitle}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{c.protections.map(([title, description], index) => (
            <article key={title} className="rounded-2xl border border-[#e5e1d7] p-6"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8ebe6] font-mono text-xs font-bold text-[#d9704f]">{index + 1}</span><h3 className="mt-5 text-xl font-bold text-[#13243c]">{title}</h3><p className="mt-3 leading-relaxed text-[#5a5e66]">{description}</p></article>
          ))}</div>
        </div>
      </section>

      <section className="bg-[#f8f7f2] px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl bg-white p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">{c.flowsEyebrow}</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">{c.flowsTitle}</h2>
            <div className="mt-6 space-y-5 text-[#5a5e66]">
              <p className="leading-relaxed"><strong className="text-[#13243c]">{c.flowCommissionBold}</strong>{c.flowCommission}</p>
              <p className="leading-relaxed"><strong className="text-[#13243c]">{c.flowPriceBold}</strong>{c.flowPrice}</p>
              <p className="leading-relaxed"><strong className="text-[#13243c]">{c.flowReceiptBold}</strong>{c.flowReceipt}</p>
            </div>
          </article>
          <article className="rounded-3xl bg-[#13243c] p-7 text-white sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#eaa083]">{c.vigilanceEyebrow}</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase">{c.vigilanceTitle}</h2>
            <ul className="mt-6 space-y-4 text-white/75">{c.habits.map((item) => <li key={item} className="flex gap-3"><span className="font-bold text-[#eaa083]">✓</span><span>{item}</span></li>)}</ul>
          </article>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">{c.dataEyebrow}</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">{c.dataTitle}</h2></div>
          <div className="space-y-5 leading-relaxed text-[#5a5e66]">
            <p>{c.dataText1}</p>
            <p>{c.dataText2}</p>
            <LocalizedLink href="/contact" className="inline-flex pt-2 font-bold text-[#d9704f] hover:underline">{c.askTeam}</LocalizedLink>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl border border-[#e5e1d7] bg-[#f8f7f2] p-7 sm:p-10 lg:flex-row lg:items-center">
          <div><h2 className="font-heading text-3xl font-extrabold uppercase text-[#13243c]">{c.problemTitle}</h2><p className="mt-2 text-[#5a5e66]">{c.problemText}</p></div>
          <LocalizedLink href="/contact" className="rounded-lg bg-[#d9704f] px-6 py-3 text-sm font-bold uppercase text-white">{c.contactSupport}</LocalizedLink>
        </div>
      </section>
    </main>
  );
}
