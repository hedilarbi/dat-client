/**
 * Lit la date de première immatriculation renvoyée par l'API de recherche. Selon les réponses,
 * elle arrive en jour-mois-année (13-03-2019) ou en année-mois-jour (2019-03-13) : prendre
 * toujours le 3e morceau comme année donnait 13 au lieu de 2019 pour le second format.
 * Retourne l'année sur 4 chiffres et la date au format jour-mois-année, ou null si illisible.
 */
export function parseRegistrationDate(raw: string | null | undefined): { year: number; date: string } | null {
  const value = String(raw || '').trim();
  const pad = (part: string) => part.padStart(2, '0');
  let day: string;
  let month: string;
  let year: string;

  let match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    [, year, month, day] = match;
  } else if ((match = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) {
    [, day, month, year] = match;
  } else if ((match = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/))) {
    // Année sur 2 chiffres : au-delà de l'année courante, c'est le siècle précédent
    const twoDigits = Number(match[3]);
    [, day, month] = match;
    year = String((twoDigits > new Date().getFullYear() % 100 ? 1900 : 2000) + twoDigits);
  } else {
    return null;
  }

  return { year: Number(year), date: `${pad(day)}-${pad(month)}-${year}` };
}
