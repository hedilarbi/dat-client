// Droits d'accès d'un compte à son espace, selon son statut.

interface AccessUser {
  status: string;
  profileChangePending?: boolean;
}

/**
 * Compte validé dont le titulaire a modifié son profil : en « soumis » le temps que l'admin valide
 * ces modifications. Ce n'est pas une inscription (texte différent), et il garde la main sur ses
 * ventes en cours.
 */
export const isProfileReviewPending = (user: AccessUser | null | undefined) =>
  Boolean(user && user.status === 'soumis' && user.profileChangePending);

/**
 * Le compte peut ouvrir son espace et poursuivre ses ventes en cours : compte validé, suspendu, ou
 * en attente de validation de modifications de profil. Les nouvelles actions (offre, création ou
 * modification de véhicule…) restent réservées aux comptes validés ; le serveur les refuse aux autres.
 */
export const hasSpaceAccess = (user: AccessUser | null | undefined) =>
  Boolean(user && (user.status === 'valide' || user.status === 'suspendu' || isProfileReviewPending(user)));
