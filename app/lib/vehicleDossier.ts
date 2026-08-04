export type FuelType = 'essence' | 'diesel' | 'hybride' | 'electrique' | 'gpl' | 'autre';

export type DossierStatus =
  | 'brouillon'
  | 'soumis'
  | 'en_attente_validation'
  | 'correction_demandee'
  | 'refuse'
  | 'valide'
  | 'annule_vendeur';

export interface BlurZone {
  /** Index de page (0-based) pour un document PDF multi-page ; absent/0 pour une photo ou un document image. */
  page?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  _id?: string;
}

export interface PdfPage {
  index: number;
  width: number;
  height: number;
  dataUrl: string;
}

export interface DossierPhoto {
  _id?: string;
  originalUrl: string;
  processedUrl?: string;
  blurZones: BlurZone[];
  isCover: boolean;
  order: number;
  width?: number;
  height?: number;
}

export type DocumentType = 'rapport_expert' | 'complementaire';

export interface DossierDocument {
  _id?: string;
  type: DocumentType;
  originalUrl: string;
  processedUrl?: string;
  mimeType?: string;
  blurZones: BlurZone[];
  label?: string;
  width?: number;
  height?: number;
}

export interface DossierRefusal {
  date: string;
  motifs: string[];
  motifsLabels: string[];
  comment?: string;
  resubmittedAt?: string;
}

export interface VehicleAddressDetails {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface VehicleDossier {
  _id: string;
  seller: string;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  engine?: string;
  fuelType?: FuelType;
  vin?: string;
  registrationNumber?: string;
  registrationCountry?: string;
  firstRegistrationDate?: string;
  co2?: string;
  energyLabel?: string;
  vehicleGenre?: string;
  fiscalPower?: string;
  bodyType?: string;
  gearbox?: string;
  passengerCount?: string;
  doorCount?: string;
  color?: string;
  vrade?: string;
  procedure?: 'VEI' | 'VE' | 'TNR' | 'RIV / VE' | 'RIV';
  vehicleAddress?: string;
  vehicleAddressDetails?: VehicleAddressDetails;
  registrationCardAvailable?: boolean;
  registrationCardMissingReasons?: Array<'declaration_perte' | 'declaration_vol' | 'autre'>;
  identificationSheetAvailable?: boolean;
  policeBookNumber?: string;
  description?: string;
  photos: DossierPhoto[];
  expertReport?: DossierDocument;
  additionalDocuments: DossierDocument[];
  reservePrice?: number;
  conditionDetails?: string;
  session?: string;
  listingCount: number;
  status: DossierStatus;
  submittedAt?: string;
  refusals: DossierRefusal[];
  createdAt: string;
  updatedAt: string;
}

/** Payload envoyé au POST/PUT — mêmes champs que VehicleDossier moins les champs gérés serveur. */
export interface VehicleDossierPayload {
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  engine?: string;
  fuelType?: FuelType;
  vin?: string;
  registrationNumber?: string;
  registrationCountry?: string;
  firstRegistrationDate?: string;
  co2?: string;
  energyLabel?: string;
  vehicleGenre?: string;
  fiscalPower?: string;
  bodyType?: string;
  gearbox?: string;
  passengerCount?: string;
  doorCount?: string;
  color?: string;
  vrade?: string;
  procedure?: 'VEI' | 'VE' | 'TNR' | 'RIV / VE' | 'RIV';
  vehicleAddress?: string;
  vehicleAddressDetails?: VehicleAddressDetails;
  registrationCardAvailable?: boolean;
  registrationCardMissingReasons?: Array<'declaration_perte' | 'declaration_vol' | 'autre'>;
  identificationSheetAvailable?: boolean;
  policeBookNumber?: string;
  description?: string;
  photos?: DossierPhoto[];
  expertReport?: DossierDocument;
  additionalDocuments?: DossierDocument[];
  reservePrice?: number;
  conditionDetails?: string;
  session?: string;
  submit?: boolean;
}

export const emptyDossierPayload = (): VehicleDossierPayload => ({
  brand: '',
  model: '',
  year: undefined,
  mileage: undefined,
  engine: '',
  fuelType: undefined,
  vin: '',
  registrationNumber: '',
  registrationCountry: 'FR',
  registrationCardAvailable: true,
  registrationCardMissingReasons: [],
  identificationSheetAvailable: false,
  description: '',
  photos: [],
  expertReport: undefined,
  additionalDocuments: [],
  reservePrice: undefined,
  conditionDetails: '',
  session: undefined,
});
