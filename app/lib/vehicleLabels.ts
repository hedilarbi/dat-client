import type { Language } from '../routing';

export const PROCEDURE_OPTIONS = ['VEI', 'VE', 'TNR', 'RIV / VE', 'RIV'];

export const GEARBOX_OPTIONS = [
  { value: 'M', fr: 'Manuelle', en: 'Manual' },
  { value: 'A', fr: 'Automatique', en: 'Automatic' },
];

export const ENERGY_OPTIONS = [
  { value: 'essence', fr: 'Essence', en: 'Petrol' },
  { value: 'diesel', fr: 'Diesel', en: 'Diesel' },
  { value: 'hybride', fr: 'Hybride', en: 'Hybrid' },
  { value: 'electrique', fr: 'Électrique', en: 'Electric' },
  { value: 'gpl', fr: 'GPL', en: 'LPG' },
  { value: 'autre', fr: 'Autre', en: 'Other' },
];

const resolve = (
  options: Array<{ value: string; fr: string; en: string }>,
  value: string | null | undefined,
  language: Language,
) => {
  if (!value) return '';
  const option = options.find((item) => item.value === value);
  return option ? option[language] : value;
};

export const energyLabel = (value: string | null | undefined, language: Language) =>
  resolve(ENERGY_OPTIONS, value, language);

export const gearboxLabel = (value: string | null | undefined, language: Language) =>
  resolve(GEARBOX_OPTIONS, value, language);
