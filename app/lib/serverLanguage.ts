import { cookies, headers } from 'next/headers';

export type ServerLanguage = 'fr' | 'en';

/**
 * Langue de la requête pour les composants serveur : celle de l'URL (transmise par le proxy dans
 * l'en-tête x-language), sinon le dernier choix de l'utilisateur (cookie), sinon le français.
 */
export async function getServerLanguage(): Promise<ServerLanguage> {
  const fromHeader = (await headers()).get('x-language');
  if (fromHeader === 'en' || fromHeader === 'fr') return fromHeader;
  const fromCookie = (await cookies()).get('language')?.value;
  return fromCookie === 'en' ? 'en' : 'fr';
}
