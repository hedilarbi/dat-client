// Procédure d'achat (PURCHASE_STEPS côté serveur). Les étapes 3 à 5 forment l'étape
// « Documents administratifs », présentée aux utilisateurs en 3.1, 3.2 et 3.3.
export const STEP = { COMMISSION: 1, VIREMENT: 2, PREPARATION: 3, VERIFICATION: 4, SIGNATURE: 5 } as const;

const DISPLAYED_NUMBERS = ['1', '2', '3.1', '3.2', '3.3'];

/** Numéro affiché d'une étape (1, 2, 3.1, 3.2, 3.3). */
export const stepDisplayNumber = (step: number) => DISPLAYED_NUMBERS[step - 1] ?? String(step);

/** Nombre d'étapes annoncé aux utilisateurs (« Étape 3.2 sur 3 »). */
export const DISPLAYED_STEP_COUNT = 3;

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
