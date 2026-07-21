import React from 'react';

export interface BadgeStyle {
  label: string;
  color: string;
  bg: string;
}

/** Statut d'un ticket de support (vu par le client, côté acheteur/vendeur). */
export function getTicketStatusBadge(status: string, t?: (key: string) => string): BadgeStyle {
  const tr = t || ((key: string) => key);
  switch (status) {
    case 'en_attente_admin':
      return { label: tr('ticketStatus.enAttenteAdmin'), color: '#b3893f', bg: '#faf1e4' };
    case 'en_attente_utilisateur':
      return { label: tr('ticketStatus.enAttenteUtilisateur'), color: '#d9704f', bg: '#fdece4' };
    case 'en_cours':
      return { label: tr('ticketStatus.enCours'), color: '#13243c', bg: '#eef1f5' };
    case 'cloturee':
      return { label: tr('ticketStatus.cloturee'), color: '#5a5e66', bg: '#f1efe8' };
    default:
      return { label: tr('ticketStatus.ouverte'), color: '#13243c', bg: '#eef1f5' };
  }
}

/** Statut d'un dossier véhicule (vu par le vendeur). */
export function getVehicleDossierStatusBadge(status: string, t?: (key: string) => string): BadgeStyle {
  const tr = t || ((key: string) => key);
  switch (status) {
    case 'brouillon':
      return { label: tr('vehicleDossier.status.brouillon'), color: '#8a8270', bg: '#f1efe8' };
    case 'soumis':
    case 'en_attente_validation':
      return { label: tr('vehicleDossier.status.enAttenteValidation'), color: '#b3893f', bg: '#faf1e4' };
    case 'correction_demandee':
      return { label: tr('vehicleDossier.status.correctionDemandee'), color: '#d9704f', bg: '#fdece4' };
    case 'refuse':
      return { label: tr('vehicleDossier.status.refuse'), color: '#b3261e', bg: '#fbeaea' };
    case 'valide':
      return { label: tr('vehicleDossier.status.valide'), color: '#2f6f4f', bg: '#e9f4ee' };
    case 'annule_vendeur':
      return { label: tr('vehicleDossier.status.annule'), color: '#5a5e66', bg: '#f1efe8' };
    default:
      return { label: status, color: '#13243c', bg: '#eef1f5' };
  }
}

interface BadgeProps {
  style: BadgeStyle;
  className?: string;
}

export function Badge({ style, className = '' }: BadgeProps) {
  return (
    <span
      className={`font-semibold text-[11px] px-3 py-1 rounded-full inline-block ${className}`}
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}
