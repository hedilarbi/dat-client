import type { BlurZone, DocumentType } from '../../lib/vehicleDossier';

/** État local d'une photo dans le wizard, avant/pendant/après upload. */
export interface WizardPhoto {
  localId: string;
  originalUrl: string;
  processedUrl?: string;
  blurZones: BlurZone[];
  isCover: boolean;
  uploading: boolean;
}

/** État local d'un document (rapport expert ou complémentaire) dans le wizard. */
export interface WizardDocument {
  localId: string;
  type: DocumentType;
  originalUrl: string;
  processedUrl?: string;
  mimeType: string;
  blurZones: BlurZone[];
  label: string;
  uploading: boolean;
}
