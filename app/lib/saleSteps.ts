// Procédure d'achat (PURCHASE_STEPS côté serveur). Les étapes 3 à 5 sont, pour les utilisateurs,
// une seule étape « Documents administratifs » dont les sous-étapes sont nommées, sans numéro.
export const STEP = { COMMISSION: 1, VIREMENT: 2, PREPARATION: 3, VERIFICATION: 4, SIGNATURE: 5 } as const;

/** Sous-étapes de l'étape « Documents administratifs », avec leur clé de libellé. */
export const DOCUMENTS_SUBSTEPS: { step: number; key: string }[] = [
  { step: STEP.PREPARATION, key: 'preparation_documents' },
  { step: STEP.VERIFICATION, key: 'verification_documents' },
  { step: STEP.SIGNATURE, key: 'signature_electronique' },
];

/** Étapes présentées aux utilisateurs, et les étapes internes qu'elles regroupent. */
export const DISPLAY_STEPS: { key: string; steps: number[] }[] = [
  { key: 'commission', steps: [STEP.COMMISSION] },
  { key: 'virement_carte_grise', steps: [STEP.VIREMENT] },
  { key: 'documents_administratifs', steps: DOCUMENTS_SUBSTEPS.map((substep) => substep.step) },
];

/** Rang (à partir de 0) de l'étape affichée qui contient une étape interne. */
export const displayStepIndex = (step: number) => Math.max(0, DISPLAY_STEPS.findIndex((group) => group.steps.includes(step)));

/** Numéro affiché d'une étape interne (1, 2 ou 3). */
export const stepDisplayNumber = (step: number) => String(displayStepIndex(step) + 1);

/** Nombre d'étapes annoncé aux utilisateurs (« Étape 3 sur 3 »). */
export const DISPLAYED_STEP_COUNT = DISPLAY_STEPS.length;

// Miroir de DOCUMENT_REPORT_REASONS (server/models/sale.model.js)
export const DOCUMENT_REPORT_REASONS = [
  'tampon_manquant',
  'mauvais_tampon',
  'informations_erronees',
  'document_illisible',
  'document_incomplet',
  'autre',
] as const;

export type SaleSide = 'seller' | 'buyer';
export type ReviewDocument = 'certificate' | 'purchaseDeclaration';

export interface SaleDocumentFile {
  url: string;
  source: 'generated' | SaleSide;
  updatedAt: string | null;
}

export interface ReviewDecision {
  decision: 'valide' | 'erreur';
  reason: string | null;
  comment: string | null;
  decidedAt: string | null;
}

/** Étape 3 telle que la voient les deux parties (identique des deux côtés). */
export interface SaleDocumentsState {
  registrationCardSubmittedAt: string | null;
  stamps: { seller: boolean; buyer: boolean };
  certificate: SaleDocumentFile | null;
  purchaseDeclaration: SaleDocumentFile | null;
  review: {
    version: number;
    correctionOpen: boolean;
    seller: ReviewDecision | null;
    buyer: ReviewDecision | null;
  };
}

/** Signature électronique : chaque partie ne reçoit que son propre lien. */
export interface SaleEsignatureState {
  status: string | null;
  sellerUrl?: string | null;
  buyerUrl?: string | null;
  initiatedAt: string | null;
  sellerSignedAt: string | null;
  buyerSignedAt: string | null;
  signedDocumentUrl: string | null;
  signedCertificateUrl: string | null;
  signedPurchaseDeclarationUrl: string | null;
  auditUrl: string | null;
  completedAt: string | null;
}
