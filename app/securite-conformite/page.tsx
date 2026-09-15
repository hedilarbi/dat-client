import type { Metadata } from 'next';
import JsonLd from '../components/JsonLd';
import LocalizedLink from '../components/LocalizedLink';

export const metadata: Metadata = {
  title: 'Sécurité et conformité des transactions | DealAutoPro',
  description: 'Découvrez les contrôles, la traçabilité documentaire et les bonnes pratiques qui encadrent les transactions professionnelles sur DealAutoPro.',
};

const protections = [
  ['Professionnels vérifiés', 'L’accès aux fonctionnalités de vente et d’achat est soumis à la création d’un compte professionnel et à la validation des justificatifs demandés.'],
  ['Offres confidentielles', 'Les montants proposés ne sont pas affichés aux autres participants pendant la session de vente.'],
  ['Parcours tracé', 'Les changements d’étape, confirmations et documents restent rattachés au dossier de vente concerné.'],
  ['Documents centralisés', 'Certificat de cession, déclaration d’achat et bon d’enlèvement sont mis à disposition au moment prévu dans le parcours.'],
  ['Signature électronique', 'Les deux parties reçoivent leur parcours de signature. Les versions signées sont ensuite récupérées pour poursuivre les validations.'],
  ['Validation croisée', 'Le vendeur et l’acheteur interviennent successivement afin de vérifier les règlements, tampons et documents avant la clôture.'],
];

export default function SecuriteConformitePage() {
  return (
    <main className="bg-white text-black">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Sécurité et conformité des transactions DealAutoPro', description: 'Les mesures qui encadrent les comptes professionnels, les offres et les documents sur DealAutoPro.' }} />

      <section className="bg-[#13243c] px-4 py-16 text-white sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#eaa083]">Sécurité & conformité</p>
          <h1 className="mt-4 max-w-4xl font-heading text-4xl font-extrabold uppercase leading-tight sm:text-6xl">Un cadre de confiance pour chaque transaction</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/75">DealAutoPro combine contrôle des accès, confidentialité des offres, suivi des actions et validation documentaire pour rendre les échanges entre professionnels plus lisibles et plus sûrs.</p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">Nos dispositifs</p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c] sm:text-4xl">La sécurité à chaque niveau du parcours</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{protections.map(([title, description], index) => (
            <article key={title} className="rounded-2xl border border-[#e5e1d7] p-6"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8ebe6] font-mono text-xs font-bold text-[#d9704f]">{index + 1}</span><h3 className="mt-5 text-xl font-bold text-[#13243c]">{title}</h3><p className="mt-3 leading-relaxed text-[#5a5e66]">{description}</p></article>
          ))}</div>
        </div>
      </section>

      <section className="bg-[#f8f7f2] px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl bg-white p-7 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">Flux financiers</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">Qui paie quoi, et à qui ?</h2>
            <div className="mt-6 space-y-5 text-[#5a5e66]">
              <p className="leading-relaxed"><strong className="text-[#13243c]">La commission plateforme</strong> est réglée en ligne par l’acheteur lorsque son offre est retenue.</p>
              <p className="leading-relaxed"><strong className="text-[#13243c]">Le prix du véhicule</strong> est viré directement par l’acheteur sur le compte bancaire communiqué par le vendeur. DealAutoPro ne reçoit pas et ne conserve pas ce montant.</p>
              <p className="leading-relaxed"><strong className="text-[#13243c]">La réception du virement</strong> doit être vérifiée par le vendeur sur son propre compte avant toute confirmation dans la plateforme.</p>
            </div>
          </article>
          <article className="rounded-3xl bg-[#13243c] p-7 text-white sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#eaa083]">Votre vigilance compte</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase">Les bons réflexes</h2>
            <ul className="mt-6 space-y-4 text-white/75">{[
              'Ne communiquez jamais votre mot de passe ou un code de sécurité.',
              'Vérifiez toujours les coordonnées bancaires affichées dans votre espace.',
              'Ne confirmez un virement qu’après avoir constaté les fonds sur votre compte.',
              'Ouvrez et contrôlez chaque document avant de le valider.',
              'Utilisez la messagerie de support en cas de doute ou d’incohérence.',
            ].map((item) => <li key={item} className="flex gap-3"><span className="font-bold text-[#eaa083]">✓</span><span>{item}</span></li>)}</ul>
          </article>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9704f]">Données et accès</p><h2 className="mt-3 font-heading text-3xl font-extrabold uppercase text-[#13243c]">Un accès réservé à votre activité</h2></div>
          <div className="space-y-5 leading-relaxed text-[#5a5e66]">
            <p>Chaque utilisateur accède à un espace lié à son rôle. Les informations de vente sont présentées aux personnes concernées par le dossier et aux équipes habilitées à assurer son traitement.</p>
            <p>Il vous appartient de maintenir vos coordonnées à jour, de protéger vos identifiants et de signaler rapidement tout accès ou comportement inhabituel. Pour toute question concernant vos données ou les conditions applicables à votre utilisation de la plateforme, contactez notre équipe.</p>
            <LocalizedLink href="/contact" className="inline-flex pt-2 font-bold text-[#d9704f] hover:underline">Poser une question à notre équipe →</LocalizedLink>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl border border-[#e5e1d7] bg-[#f8f7f2] p-7 sm:p-10 lg:flex-row lg:items-center">
          <div><h2 className="font-heading text-3xl font-extrabold uppercase text-[#13243c]">Vous avez identifié un problème ?</h2><p className="mt-2 text-[#5a5e66]">Contactez notre équipe avant de poursuivre ou de valider l’étape concernée.</p></div>
          <LocalizedLink href="/contact" className="rounded-lg bg-[#d9704f] px-6 py-3 text-sm font-bold uppercase text-white">Contacter le support</LocalizedLink>
        </div>
      </section>
    </main>
  );
}
