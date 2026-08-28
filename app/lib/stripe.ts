import { loadStripe, type Stripe } from '@stripe/stripe-js';

// La clé publiable est déclarée avec un « b » minuscule dans .env : les deux graphies sont
// acceptées pour qu'une correction de la variable ne casse pas le paiement.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUbLIC_KEY
  || process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
  || '';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Instance Stripe partagée, chargée une seule fois par onglet.
 * Retourne null si aucune clé publiable n'est configurée, pour que l'appelant
 * affiche un message clair plutôt que de planter.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!publishableKey) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

export const isStripeConfigured = () => Boolean(publishableKey);
