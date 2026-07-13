const CATEGORY_LABELS: Record<string, string> = {
  general: 'Question générale',
  inscription: 'Inscription',
  document: 'Justificatif / Document',
  paiement: 'Problème de paiement',
  technique: 'Problème technique / Bug',
  'enlèvement': "Problème d'enlèvement",
};

const CATEGORY_KEYS: Record<string, string> = {
  general: 'support.categoryGeneral',
  inscription: 'support.categoryInscription',
  document: 'support.categoryDocument',
  paiement: 'support.categoryPaiement',
  technique: 'support.categoryTechnique',
  'enlèvement': 'support.categoryEnlevement',
};

export const getCategoryLabel = (category: string, t?: (key: string) => string) => {
  if (t && CATEGORY_KEYS[category]) return t(CATEGORY_KEYS[category]);
  return CATEGORY_LABELS[category] || category;
};
