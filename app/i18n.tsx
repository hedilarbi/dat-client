'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DropdownMenu from './components/DropdownMenu';
import {
  type Language,
  supportedLanguages,
  getLocaleFromPath,
  stripLocaleFromPath,
  localizedPath,
  canonicalPathFromPathname,
  getRoleHomePath,
  getRoleLoginPath,
  getRoleRegisterPath,
} from './routing';

export type { Language };
export {
  supportedLanguages,
  getLocaleFromPath,
  stripLocaleFromPath,
  localizedPath,
  canonicalPathFromPathname,
  getRoleHomePath,
  getRoleLoginPath,
  getRoleRegisterPath,
};

const labels: Record<Language, string> = {
  fr: 'Français',
  en: 'English'
};

const flags: Record<Language, string> = {
  fr: '🇫🇷',
  en: '🇬🇧'
};

const translations: Record<Language, Record<string, string>> = {
  fr: {
    'nav.vehicles': 'Véhicules en vente',
    'nav.deposit': 'Déposer un dossier',
    'nav.how': 'Comment ça marche',
    'nav.help': 'Aide',
    'nav.auctionCalendar': 'Calendrier des ventes',
    'nav.sellWithUs': 'Vendre avec nous',
    'nav.findUs': 'Nous trouver',
    'nav.contactUs': 'Nous contacter',
    'nav.login': 'Connexion',
    'nav.register': 'Inscription',
    'nav.dashboard': 'Mon espace',
    'nav.profile': 'Mon profil',
    'nav.sessions': 'Sessions',
    'nav.offers': 'Mes offres',
    'nav.files': 'Mes dossiers',
    'nav.support': 'Support',
    'nav.logout': 'Déconnexion',
    'nav.language': 'Langue',
    'nav.menu': 'Menu',
    'nav.close': 'Fermer',
    'register.createAccount': 'Créer un compte',
    'register.createAccountWithRole': 'Créer un compte {role}',
    'register.professionalInfo': 'Informations professionnelles',
    'register.verifyAccount': 'Vérification de compte',
    'register.documents': 'Documents justificatifs',
    'register.bankInfo': 'Informations bancaires',
    'register.phone': 'Numéro de téléphone',
    'register.phonePlaceholder': 'Sélectionnez un pays puis saisissez le numéro',
    'register.step1Success': 'Étape 1 validée ! Code OTP envoyé par e-mail.',
    'register.otpSuccess': 'Code OTP validé ! Connexion établie.',
    'register.completeBuyer': 'Inscription terminée ! Votre dossier est en cours de validation.',
    'register.completeSeller': 'Inscription terminée ! Votre dossier vendeur a été soumis.',
    'register.resendOtp': 'Nouveau code OTP envoyé.',
    'register.genericError': 'Une erreur est survenue.',
    'register.otpError': 'Code OTP incorrect ou expiré.',
    'register.submitError': 'Erreur lors de la soumission.',
    'register.phoneRequired': 'Veuillez renseigner un numéro de téléphone valide.',
    'register.passwordMismatch': 'Les mots de passe ne correspondent pas.',
    'home.title': 'DealsAutoPro',
    'home.description': "Plateforme numérique B2B dédiée aux professionnels de l'automobile pour la vente et l'achat de véhicules aux enchères.",
    'home.buyerSpace': 'Espace Acheteur',
    'home.sellerSpace': 'Espace Vendeur',
    'home.login': 'Se connecter',
    'home.register': 'Créer un compte professionnel',
    'home.proOnly': "Réservé uniquement aux professionnels de l'automobile.",
    'login.logo': 'Logo',
    'login.buyerSpace': 'Espace acheteur',
    'login.sellerSpace': 'Espace vendeur',
    'login.buyerHeadline': "Accédez aux appels d'offres véhicules",
    'login.sellerHeadline': 'Déposez vos dossiers véhicules en quelques minutes',
    'login.buyerDescription': "Garagistes, carrossiers, épavistes, exportateurs et centres VHU : consultez les dossiers publiés et déposez vos offres à pli fermé.",
    'login.sellerDescription': "Centres VHU, concessionnaires, assureurs et gestionnaires de flotte : publiez vos véhicules en session d'appel d'offres.",
    'login.reservedNotice': 'Espace réservé aux professionnels validés',
    'login.title': 'Connexion',
    'login.emailLabel': 'Adresse email',
    'login.passwordLabel': 'Mot de passe',
    'login.forgotPassword': 'Mot de passe oublié ?',
    'login.submitting': 'Connexion en cours...',
    'login.submit': 'Se connecter',
    'login.successMessage': 'Connexion réussie ! Redirection...',
    'login.emailNotVerified': "Votre e-mail n'est pas vérifié. Vous allez être redirigé vers la validation.",
    'login.invalidCredentials': 'Identifiants incorrects.',
    'login.roleMismatch': "Ce compte n'existe pas dans cet espace de connexion.",
    'login.noAccount': 'Pas encore de compte ?',
    'login.createAccountWithRole': 'Créer un compte {role}',
    'login.switchSpace': "Basculer vers l'espace {role}",
    'role.acheteur': 'acheteur',
    'role.vendeur': 'vendeur',
    'register.managerLastName': 'Nom du responsable',
    'register.managerLastNamePlaceholder': 'Ex: Meunier',
    'register.managerFirstName': 'Prénom du responsable',
    'register.managerFirstNamePlaceholder': 'Ex: Guy',
    'register.companyName': 'Raison sociale (Nom de la société)',
    'register.companyNamePlaceholder': 'Ex: Garage Meunier SARL',
    'register.activityType': "Type d'activité professionnelle",
    'register.professionalEmail': 'Adresse e-mail professionnelle',
    'register.professionalEmailPlaceholder': 'Ex: contact@garage-meunier.fr',
    'register.passwordLabel': 'Mot de passe',
    'register.confirmPassword': 'Confirmer le mot de passe',
    'register.switchTo': "Basculer vers l'inscription",
    'register.switchSpace': "S'inscrire comme {role}",
    'register.validating': 'Validation...',
    'register.continue': 'Continuer',
    'register.stepInfo': 'Informations',
    'register.stepVerify': 'Vérification',
    'register.stepDocuments': 'Documents',
    'register.stepBank': 'Infos bancaires',
    'register.accountVerification': 'Vérification du compte',
    'register.enterCodeTitle': 'Saisissez le code reçu',
    'register.codeSentTo': 'Un code à 6 chiffres a été envoyé à',
    'register.verifying': 'Vérification...',
    'register.verify': 'Vérifier',
    'register.codeNotReceived': 'Code non reçu ?',
    'register.resendCodeTimer': 'Renvoyer le code ({seconds}s)',
    'register.resendCode': 'Renvoyer le code',
    'register.headOfficeAddress': 'Adresse du siège social',
    'register.headOfficeAddressPlaceholder': 'Ex: 14 Rue de la République',
    'register.postalCode': 'Code Postal',
    'register.postalCodePlaceholder': 'Ex: 69002',
    'register.city': 'Ville',
    'register.cityPlaceholder': 'Ex: Lyon',
    'register.country': 'Pays',
    'register.vhuNumber': "Numéro d'agrément VHU (Optionnel)",
    'register.vhuNumberPlaceholder': 'Ex: PR7500001D',
    'register.professionalDocuments': 'Documents justificatifs professionnels',
    'register.kbisLabel': 'Extrait Kbis (PDF de moins de 3 mois)',
    'register.cinRectoLabel': "Carte d'identité (Recto)",
    'register.cinVersoLabel': "Carte d'identité (Verso)",
    'register.selected': 'Sélectionnée',
    'register.back': 'Retour',
    'register.uploadingDocuments': 'Envoi des documents...',
    'register.submitting2': 'Soumission...',
    'register.finishRegistration': "Terminer l'inscription",
    'register.bankName': 'Nom de la banque',
    'register.bankNamePlaceholder': 'Ex: BNP Paribas',
    'register.accountHolder': 'Titulaire du compte',
    'register.accountHolderPlaceholder': 'Ex: Casse Auto du Sud SAS',
    'register.iban': 'IBAN',
    'register.bic': 'BIC / SWIFT',
    'register.ribLabel': 'RIB / attestation bancaire',
    'register.ribNameNotice': 'Le nom du titulaire doit correspondre à la raison sociale.',
    'register.paymentTitle': 'Paiement des ventes',
    'register.paymentDescription': "Les montants des véhicules adjugés seront virés sur ce compte après confirmation de l'enlèvement. Ces informations restent confidentielles.",
    'register.documentsRequired': 'Veuillez sélectionner tous les documents justificatifs.',
    'register.ribRequired': "Veuillez sélectionner le RIB ou l'attestation bancaire.",
    'register.invalidUploadResponse': 'Réponse upload invalide ({status}) pour {docType}.',
    'register.uploadError': 'Erreur lors du transfert du fichier {docType}.',
    'activity.garagiste': 'Garagiste',
    'activity.carrossier': 'Carrossier',
    'activity.epaviste': 'Épaviste',
    'activity.exportateur': 'Exportateur',
    'activity.centreVhu': 'Centre VHU',
    'activity.centreVhuCasse': 'Centre VHU / Casse',
    'activity.concessionnaire': 'Concessionnaire',
    'activity.assureur': 'Assureur',
    'activity.gestionnaireFlotte': 'Gestionnaire de flotte',
    'forgotPassword.title': 'Mot de passe oublié',
    'forgotPassword.heading': 'Réinitialiser mon mot de passe',
    'forgotPassword.description': 'Saisissez votre adresse e-mail, nous vous enverrons un code de vérification.',
    'forgotPassword.sending': 'Envoi...',
    'forgotPassword.sendCode': 'Envoyer le code',
    'forgotPassword.backToLogin': '← Retour à la connexion',
    'forgotPassword.verification': 'Vérification',
    'forgotPassword.newPasswordTitle': 'Nouveau mot de passe',
    'forgotPassword.codeSentPrefix': 'Un code à 6 chiffres a été envoyé à',
    'forgotPassword.codeSentSuffix': '. Saisissez-le avec votre nouveau mot de passe.',
    'forgotPassword.verificationCodeLabel': 'Code de vérification',
    'forgotPassword.resetButton': 'Réinitialiser le mot de passe',
    'forgotPassword.resendCode': '← Renvoyer un code',
    'forgotPassword.changeEmail': "Modifier l'adresse e-mail",
    'forgotPassword.missingEmail': "Adresse e-mail manquante. Demandez un nouveau code de réinitialisation.",
    'forgotPassword.genericError': 'Une erreur est survenue.',
    'forgotPassword.codeSentSuccess': 'Un code de vérification a été envoyé à votre adresse e-mail.',
    'forgotPassword.resetSuccess': 'Mot de passe réinitialisé. Redirection...',
    'shared.uploading': 'Téléversement...',
    'shared.fileTooLarge': 'Fichier trop volumineux ({size} Mo). Taille maximale autorisée : {maxSize} Mo.',
    'notice.draftTitle': 'Inscription à terminer',
    'notice.draftDescription': "Votre e-mail est vérifié. Reprenez votre inscription à l'étape des documents pour soumettre le dossier.",
    'notice.draftResume': "Reprendre l'inscription",
    'notice.reviewTitle': 'Examen de votre dossier',
    'notice.reviewDescription': "Votre dossier d'inscription complet a été soumis. Nos équipes d'administration procèdent actuellement à la validation de vos documents.",
    'notice.reviewFooter': 'Vous recevrez une notification par e-mail dès que votre compte sera approuvé.',
    'notice.adminComment': "Commentaire de l'administrateur :",
    'identityFields.heading': 'Informations professionnelles',
    'identityFields.managerLastName': 'Nom du responsable',
    'identityFields.managerFirstName': 'Prénom du responsable',
    'identityFields.companyName': 'Raison sociale',
    'profil.title': 'Mon profil',
    'profil.correctionSpace': 'Espace de correction',
    'profil.addressToCorrect': 'Adresse à corriger',
    'profil.address': 'Adresse',
    'profil.city': 'Ville',
    'profil.postalCode': 'Code Postal',
    'profil.replaceDocuments': 'Remplacer les justificatifs',
    'profil.kbisPdf': 'KBIS (PDF)',
    'profil.cinRecto': 'CIN Recto (Image)',
    'profil.cinVerso': 'CIN Verso (Image)',
    'profil.resubmitting': 'Soumission...',
    'profil.resubmit': 'Soumettre à nouveau mon dossier',
    'profil.resubmitSuccess': 'Votre dossier corrigé a bien été resoumis avec succès.',
    'profil.resubmitError': 'Erreur de resoumission.',
    'profil.refusedTitle': 'Soumission refusée',
    'profil.refusedIntro': 'Votre inscription a été définitivement refusée pour le(s) motif(s) suivant(s) :',
    'profil.refusedFooter': 'Aucune nouvelle soumission n\'est possible pour ce dossier. Pour toute question, veuillez contacter le support.',
    'profil.correctionTitle': 'Correction demandée sur votre inscription',
    'profil.offersInProgress': 'Offres en cours',
    'profil.offersWon': 'Offres gagnées',
    'profil.commissionDue': 'Commission à payer',
    'profil.salesFinalized': 'Ventes finalisées',
    'profil.myOffers': 'Mes offres',
    'profil.vehicle': 'Véhicule',
    'profil.session': 'Session',
    'profil.amountOffered': 'Montant offert',
    'profil.status': 'Statut',
    'profil.view': 'Voir →',
    'vendeurDashboard.vhuAgreement': 'Agrément VHU',
    'vendeurDashboard.vhuNumberPlaceholder': "Numéro d'agrément VHU",
    'vendeurDashboard.bankInfo': 'Informations bancaires',
    'vendeurDashboard.bic': 'BIC',
    'vendeurDashboard.ribLabel': 'RIB / Attestation bancaire (PDF)',
    'vendeurDashboard.title': 'Mon espace vendeur',
    'vendeurDashboard.draftsLabel': 'Brouillons',
    'vendeurDashboard.pendingValidation': 'En attente validation',
    'vendeurDashboard.publishedInSession': 'Publiés en session',
    'vendeurDashboard.myVehicleFiles': 'Mes dossiers véhicules',
    'vendeurDashboard.maxOffer': 'Offre max',
    'vendeurDashboard.actionDocuments': 'Documents →',
    'vendeurDashboard.actionDecide': 'Décider →',
    'vendeurDashboard.actionReschedule': 'Reprogrammer',
    'vendeurDashboard.statusPublished': 'Publié',
    'vendeurDashboard.statusAwarded': 'Adjugé',
    'vendeurDashboard.statusReserveNotMet': 'Réserve non atteinte',
    'vendeurDashboard.statusUnsold': 'Invendu',
    'vendeurDossiers.constructionTitle': 'Cette section est en cours de construction',
    'vendeurDossiers.constructionDescription': 'La gestion détaillée de vos dossiers véhicules sera disponible ici prochainement.',
    'support.myTickets': 'Mes requêtes',
    'support.searchPlaceholder': 'Rechercher une requête…',
    'support.newTicket': '+ Nouvelle requête',
    'support.noTickets': 'Aucune requête.',
    'support.fetchError': 'Erreur de récupération des requêtes.',
    'support.loadConversationError': 'Impossible de charger la conversation.',
    'support.ticketCreatedSuccess': 'Ticket ouvert avec succès !',
    'support.createError': 'Erreur de création.',
    'support.sendMessageError': "Impossible d'envoyer le message.",
    'support.createNewTicketTitle': 'Créer une nouvelle requête support',
    'support.ticketSubject': 'Sujet de la requête',
    'support.ticketSubjectPlaceholder': 'Ex: Code OTP non valide, justificatif refusé...',
    'support.category': 'Catégorie',
    'support.categoryGeneral': 'Question générale',
    'support.categoryInscription': 'Inscription',
    'support.categoryDocument': 'Justificatif / Document',
    'support.categoryPaiement': 'Problème de paiement',
    'support.categoryTechnique': 'Problème technique / Bug',
    'support.categoryEnlevement': "Problème d'enlèvement",
    'support.urgency': 'Urgence',
    'support.priorityLow': 'Basse',
    'support.priorityNormal': 'Normale',
    'support.priorityHigh': 'Haute',
    'support.detailedDescription': 'Description détaillée',
    'support.descriptionPlaceholder': 'Décrivez votre situation en fournissant les détails nécessaires...',
    'support.creating': 'Création en cours...',
    'support.sendRequest': 'Envoyer ma requête',
    'support.supportTeamName': 'Support DealsAutoPro',
    'support.me': 'Moi',
    'support.attachment': 'Fichier joint',
    'support.replyPlaceholder': 'Écrire une réponse…',
    'support.send': 'Envoyer',
    'support.ticketClosed': 'Cette requête support est clôturée.',
    'support.selectPrompt': 'Sélectionnez une requête pour afficher la discussion ou ouvrez un nouveau ticket.',
    'support.backToList': '← Retour aux requêtes',
    'ticketStatus.enAttenteAdmin': 'En attente admin',
    'ticketStatus.enAttenteUtilisateur': 'En attente de votre réponse',
    'ticketStatus.enCours': 'En cours de traitement',
    'ticketStatus.cloturee': 'Clôturée',
    'ticketStatus.ouverte': 'Ouverte',
    'profil.statusOfferInProgress': 'Offre en cours',
    'profil.statusWon': 'Gagnée',
    'profil.statusNotRetained': 'Non retenue',
    'documentUpload.selected': 'Sélectionné',
    'documentUpload.alreadySubmitted': 'Document déjà transmis',
    'documentUpload.selectDocument': 'Sélectionnez le document',
    'documentUpload.replace': 'Remplacer',
    'documentUpload.browse': 'Parcourir',
    'password.hide': 'Masquer le mot de passe',
    'password.show': 'Afficher le mot de passe',
    'notifications.title': 'Notifications',
    'notifications.markAllRead': 'Tout marquer comme lu',
    'notifications.empty': 'Aucune notification',
    'notifications.newOfferTitle': 'Nouvelle offre reçue',
    'notifications.newOfferMessage': 'Une offre a été déposée sur un véhicule de votre session en cours.',
    'notifications.fileValidatedTitle': 'Dossier validé',
    'notifications.fileValidatedMessage': 'Vos documents justificatifs ont été approuvés par notre équipe.',
    'notifications.sessionEndingTitle': 'Fin de session',
    'notifications.sessionEndingMessage': 'La session de vente se termine dans 2 heures.',
    'notifications.time5min': 'Il y a 5 min',
    'notifications.timeYesterday': 'Hier',
    'notifications.time2days': 'Il y a 2 jours'
  },
  en: {
    'nav.vehicles': 'Vehicles for sale',
    'nav.deposit': 'Submit a file',
    'nav.how': 'How it works',
    'nav.help': 'Help',
    'nav.auctionCalendar': 'Auction Calendar',
    'nav.sellWithUs': 'Sell with us',
    'nav.findUs': 'Find Us',
    'nav.contactUs': 'Contact Us',
    'nav.login': 'Sign in',
    'nav.register': 'Register',
    'nav.dashboard': 'My workspace',
    'nav.profile': 'My profile',
    'nav.sessions': 'Sessions',
    'nav.offers': 'My offers',
    'nav.files': 'My files',
    'nav.support': 'Support',
    'nav.logout': 'Sign out',
    'nav.language': 'Language',
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'register.createAccount': 'Create an account',
    'register.createAccountWithRole': 'Create a {role} account',
    'register.professionalInfo': 'Business information',
    'register.verifyAccount': 'Account verification',
    'register.documents': 'Supporting documents',
    'register.bankInfo': 'Bank details',
    'register.phone': 'Phone number',
    'register.phonePlaceholder': 'Select a country, then enter the number',
    'register.step1Success': 'Step 1 completed. An OTP code has been sent by email.',
    'register.otpSuccess': 'OTP code verified. You are signed in.',
    'register.completeBuyer': 'Registration complete. Your file is awaiting review.',
    'register.completeSeller': 'Registration complete. Your seller file has been submitted.',
    'register.resendOtp': 'A new OTP code has been sent.',
    'register.genericError': 'An error occurred.',
    'register.otpError': 'OTP code is incorrect or expired.',
    'register.submitError': 'Submission failed.',
    'register.phoneRequired': 'Please enter a valid phone number.',
    'register.passwordMismatch': 'Passwords do not match.',
    'home.title': 'DealsAutoPro',
    'home.description': 'A B2B digital platform for automotive professionals to buy and sell vehicles through auctions.',
    'home.buyerSpace': 'Buyer Space',
    'home.sellerSpace': 'Seller Space',
    'home.login': 'Sign in',
    'home.register': 'Create a business account',
    'home.proOnly': 'Reserved for automotive professionals only.',
    'login.logo': 'Logo',
    'login.buyerSpace': 'Buyer space',
    'login.sellerSpace': 'Seller space',
    'login.buyerHeadline': 'Access vehicle bidding sessions',
    'login.sellerHeadline': 'Submit your vehicle files in minutes',
    'login.buyerDescription': 'Garages, body shops, scrapyards, exporters and end-of-life vehicle centers: browse published files and place sealed bids.',
    'login.sellerDescription': 'End-of-life vehicle centers, dealerships, insurers and fleet managers: list your vehicles in a bidding session.',
    'login.reservedNotice': 'Reserved for verified professionals',
    'login.title': 'Sign in',
    'login.emailLabel': 'Email address',
    'login.passwordLabel': 'Password',
    'login.forgotPassword': 'Forgot password?',
    'login.submitting': 'Signing in...',
    'login.submit': 'Sign in',
    'login.successMessage': 'Signed in successfully! Redirecting...',
    'login.emailNotVerified': 'Your email is not verified. You will be redirected to verification.',
    'login.invalidCredentials': 'Incorrect credentials.',
    'login.roleMismatch': "This account doesn't exist in this login area.",
    'login.noAccount': "Don't have an account yet?",
    'login.createAccountWithRole': 'Create a {role} account',
    'login.switchSpace': 'Switch to {role} space',
    'role.acheteur': 'buyer',
    'role.vendeur': 'seller',
    'register.managerLastName': 'Manager last name',
    'register.managerLastNamePlaceholder': 'E.g.: Meunier',
    'register.managerFirstName': 'Manager first name',
    'register.managerFirstNamePlaceholder': 'E.g.: Guy',
    'register.companyName': 'Business name (Company name)',
    'register.companyNamePlaceholder': 'E.g.: Garage Meunier SARL',
    'register.activityType': 'Type of professional activity',
    'register.professionalEmail': 'Business email address',
    'register.professionalEmailPlaceholder': 'E.g.: contact@garage-meunier.fr',
    'register.passwordLabel': 'Password',
    'register.confirmPassword': 'Confirm password',
    'register.switchTo': 'Switch to',
    'register.switchSpace': 'Register as {role}',
    'register.validating': 'Validating...',
    'register.continue': 'Continue',
    'register.stepInfo': 'Information',
    'register.stepVerify': 'Verification',
    'register.stepDocuments': 'Documents',
    'register.stepBank': 'Bank details',
    'register.accountVerification': 'Account verification',
    'register.enterCodeTitle': 'Enter the code you received',
    'register.codeSentTo': 'A 6-digit code was sent to',
    'register.verifying': 'Verifying...',
    'register.verify': 'Verify',
    'register.codeNotReceived': "Didn't receive a code?",
    'register.resendCodeTimer': 'Resend code ({seconds}s)',
    'register.resendCode': 'Resend code',
    'register.headOfficeAddress': 'Head office address',
    'register.headOfficeAddressPlaceholder': 'E.g.: 14 Rue de la République',
    'register.postalCode': 'Postal code',
    'register.postalCodePlaceholder': 'E.g.: 69002',
    'register.city': 'City',
    'register.cityPlaceholder': 'E.g.: Lyon',
    'register.country': 'Country',
    'register.vhuNumber': 'End-of-life vehicle license number (Optional)',
    'register.vhuNumberPlaceholder': 'E.g.: PR7500001D',
    'register.professionalDocuments': 'Supporting professional documents',
    'register.kbisLabel': 'Business registration extract (PDF less than 3 months old)',
    'register.cinRectoLabel': 'ID card (Front)',
    'register.cinVersoLabel': 'ID card (Back)',
    'register.selected': 'Selected',
    'register.back': 'Back',
    'register.uploadingDocuments': 'Uploading documents...',
    'register.submitting2': 'Submitting...',
    'register.finishRegistration': 'Finish registration',
    'register.bankName': 'Bank name',
    'register.bankNamePlaceholder': 'E.g.: BNP Paribas',
    'register.accountHolder': 'Account holder',
    'register.accountHolderPlaceholder': 'E.g.: Casse Auto du Sud SAS',
    'register.iban': 'IBAN',
    'register.bic': 'BIC / SWIFT',
    'register.ribLabel': 'Bank statement / proof of account',
    'register.ribNameNotice': 'The account holder name must match the company name.',
    'register.paymentTitle': 'Sale payments',
    'register.paymentDescription': 'Amounts for auctioned vehicles will be transferred to this account after pickup is confirmed. This information remains confidential.',
    'register.documentsRequired': 'Please select all the supporting documents.',
    'register.ribRequired': 'Please select the bank statement or proof of account.',
    'register.invalidUploadResponse': 'Invalid upload response ({status}) for {docType}.',
    'register.uploadError': 'Error uploading the {docType} file.',
    'activity.garagiste': 'Garage',
    'activity.carrossier': 'Body shop',
    'activity.epaviste': 'Scrapyard',
    'activity.exportateur': 'Exporter',
    'activity.centreVhu': 'End-of-life vehicle center',
    'activity.centreVhuCasse': 'End-of-life vehicle center / Scrapyard',
    'activity.concessionnaire': 'Dealership',
    'activity.assureur': 'Insurer',
    'activity.gestionnaireFlotte': 'Fleet manager',
    'forgotPassword.title': 'Forgot password',
    'forgotPassword.heading': 'Reset my password',
    'forgotPassword.description': 'Enter your email address, we will send you a verification code.',
    'forgotPassword.sending': 'Sending...',
    'forgotPassword.sendCode': 'Send code',
    'forgotPassword.backToLogin': '← Back to sign in',
    'forgotPassword.verification': 'Verification',
    'forgotPassword.newPasswordTitle': 'New password',
    'forgotPassword.codeSentPrefix': 'A 6-digit code was sent to',
    'forgotPassword.codeSentSuffix': '. Enter it along with your new password.',
    'forgotPassword.verificationCodeLabel': 'Verification code',
    'forgotPassword.resetButton': 'Reset password',
    'forgotPassword.resendCode': '← Resend a code',
    'forgotPassword.changeEmail': 'Change email address',
    'forgotPassword.missingEmail': 'Email address is missing. Request a new reset code.',
    'forgotPassword.genericError': 'An error occurred.',
    'forgotPassword.codeSentSuccess': 'A verification code has been sent to your email address.',
    'forgotPassword.resetSuccess': 'Password reset. Redirecting...',
    'shared.uploading': 'Uploading...',
    'shared.fileTooLarge': 'File too large ({size} MB). Maximum allowed size: {maxSize} MB.',
    'notice.draftTitle': 'Registration to complete',
    'notice.draftDescription': 'Your email is verified. Resume your registration at the documents step to submit your file.',
    'notice.draftResume': 'Resume registration',
    'notice.reviewTitle': 'Your file is under review',
    'notice.reviewDescription': 'Your complete registration file has been submitted. Our administration teams are currently reviewing your documents.',
    'notice.reviewFooter': 'You will receive an email notification as soon as your account is approved.',
    'notice.adminComment': 'Administrator comment:',
    'identityFields.heading': 'Business information',
    'identityFields.managerLastName': 'Manager last name',
    'identityFields.managerFirstName': 'Manager first name',
    'identityFields.companyName': 'Business name',
    'profil.title': 'My profile',
    'profil.correctionSpace': 'Correction area',
    'profil.addressToCorrect': 'Address to correct',
    'profil.address': 'Address',
    'profil.city': 'City',
    'profil.postalCode': 'Postal code',
    'profil.replaceDocuments': 'Replace supporting documents',
    'profil.kbisPdf': 'KBIS (PDF)',
    'profil.cinRecto': 'ID card front (Image)',
    'profil.cinVerso': 'ID card back (Image)',
    'profil.resubmitting': 'Submitting...',
    'profil.resubmit': 'Resubmit my file',
    'profil.resubmitSuccess': 'Your corrected file has been successfully resubmitted.',
    'profil.resubmitError': 'Resubmission error.',
    'profil.refusedTitle': 'Submission refused',
    'profil.refusedIntro': 'Your registration has been permanently refused for the following reason(s):',
    'profil.refusedFooter': 'No new submission is possible for this file. For any question, please contact support.',
    'profil.correctionTitle': 'Correction requested on your registration',
    'profil.offersInProgress': 'Offers in progress',
    'profil.offersWon': 'Offers won',
    'profil.commissionDue': 'Commission due',
    'profil.salesFinalized': 'Sales finalized',
    'profil.myOffers': 'My offers',
    'profil.vehicle': 'Vehicle',
    'profil.session': 'Session',
    'profil.amountOffered': 'Amount offered',
    'profil.status': 'Status',
    'profil.view': 'View →',
    'vendeurDashboard.vhuAgreement': 'End-of-life vehicle license',
    'vendeurDashboard.vhuNumberPlaceholder': 'End-of-life vehicle license number',
    'vendeurDashboard.bankInfo': 'Bank details',
    'vendeurDashboard.bic': 'BIC',
    'vendeurDashboard.ribLabel': 'Bank statement / proof of account (PDF)',
    'vendeurDashboard.title': 'My seller space',
    'vendeurDashboard.draftsLabel': 'Drafts',
    'vendeurDashboard.pendingValidation': 'Pending validation',
    'vendeurDashboard.publishedInSession': 'Published in session',
    'vendeurDashboard.myVehicleFiles': 'My vehicle files',
    'vendeurDashboard.maxOffer': 'Max offer',
    'vendeurDashboard.actionDocuments': 'Documents →',
    'vendeurDashboard.actionDecide': 'Decide →',
    'vendeurDashboard.actionReschedule': 'Reschedule',
    'vendeurDashboard.statusPublished': 'Published',
    'vendeurDashboard.statusAwarded': 'Awarded',
    'vendeurDashboard.statusReserveNotMet': 'Reserve not met',
    'vendeurDashboard.statusUnsold': 'Unsold',
    'vendeurDossiers.constructionTitle': 'This section is under construction',
    'vendeurDossiers.constructionDescription': 'Detailed management of your vehicle files will be available here soon.',
    'support.myTickets': 'My tickets',
    'support.searchPlaceholder': 'Search a ticket…',
    'support.newTicket': '+ New ticket',
    'support.noTickets': 'No tickets.',
    'support.fetchError': 'Failed to fetch tickets.',
    'support.loadConversationError': 'Unable to load the conversation.',
    'support.ticketCreatedSuccess': 'Ticket opened successfully!',
    'support.createError': 'Creation error.',
    'support.sendMessageError': 'Unable to send the message.',
    'support.createNewTicketTitle': 'Create a new support ticket',
    'support.ticketSubject': 'Ticket subject',
    'support.ticketSubjectPlaceholder': 'E.g.: Invalid OTP code, rejected document...',
    'support.category': 'Category',
    'support.categoryGeneral': 'General question',
    'support.categoryInscription': 'Registration',
    'support.categoryDocument': 'Supporting document',
    'support.categoryPaiement': 'Payment issue',
    'support.categoryTechnique': 'Technical issue / Bug',
    'support.categoryEnlevement': 'Pickup issue',
    'support.urgency': 'Urgency',
    'support.priorityLow': 'Low',
    'support.priorityNormal': 'Normal',
    'support.priorityHigh': 'High',
    'support.detailedDescription': 'Detailed description',
    'support.descriptionPlaceholder': 'Describe your situation with the necessary details...',
    'support.creating': 'Creating...',
    'support.sendRequest': 'Send my request',
    'support.supportTeamName': 'DealsAutoPro Support',
    'support.me': 'Me',
    'support.attachment': 'Attachment',
    'support.replyPlaceholder': 'Write a reply…',
    'support.send': 'Send',
    'support.ticketClosed': 'This support ticket is closed.',
    'support.selectPrompt': 'Select a ticket to view the conversation, or open a new one.',
    'support.backToList': '← Back to tickets',
    'ticketStatus.enAttenteAdmin': 'Awaiting admin',
    'ticketStatus.enAttenteUtilisateur': 'Awaiting your response',
    'ticketStatus.enCours': 'In progress',
    'ticketStatus.cloturee': 'Closed',
    'ticketStatus.ouverte': 'Open',
    'profil.statusOfferInProgress': 'Offer in progress',
    'profil.statusWon': 'Won',
    'profil.statusNotRetained': 'Not retained',
    'documentUpload.selected': 'Selected',
    'documentUpload.alreadySubmitted': 'Document already submitted',
    'documentUpload.selectDocument': 'Select the document',
    'documentUpload.replace': 'Replace',
    'documentUpload.browse': 'Browse',
    'password.hide': 'Hide password',
    'password.show': 'Show password',
    'notifications.title': 'Notifications',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.empty': 'No notifications',
    'notifications.newOfferTitle': 'New offer received',
    'notifications.newOfferMessage': 'An offer was placed on a vehicle in your current session.',
    'notifications.fileValidatedTitle': 'File validated',
    'notifications.fileValidatedMessage': 'Your supporting documents have been approved by our team.',
    'notifications.sessionEndingTitle': 'Session ending',
    'notifications.sessionEndingMessage': 'The sale session ends in 2 hours.',
    'notifications.time5min': '5 min ago',
    'notifications.timeYesterday': 'Yesterday',
    'notifications.time2days': '2 days ago'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Dérivé du pathname (identique côté serveur et client au premier rendu) pour éviter
  // tout mismatch d'hydratation : le localStorage n'est lu qu'après le montage, dans un effet.
  const pathname = usePathname();
  const [language, setLanguageState] = useState<Language>(() => getLocaleFromPath(pathname) || 'fr');

  useEffect(() => {
    const localeFromPath = getLocaleFromPath(pathname);
    if (localeFromPath) {
      setLanguageState(prev => (prev === localeFromPath ? prev : localeFromPath));
      return;
    }

    const storedLocale = window.localStorage.getItem('language') as Language | null;
    const storedLanguage = supportedLanguages.includes(storedLocale as Language) ? storedLocale as Language : null;
    if (storedLanguage) {
      setLanguageState(prev => (prev === storedLanguage ? prev : storedLanguage));
    }
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem('language', nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: string, params?: Record<string, string | number>) => {
      const raw = translations[language][key] || translations.fr[key] || key;
      if (!params) return raw;
      return Object.entries(params).reduce(
        (acc, [paramKey, paramValue]) => acc.replaceAll(`{${paramKey}}`, String(paramValue)),
        raw
      );
    }
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageSelector({
  onLanguageChange,
  compact = false,
  className = ''
}: {
  onLanguageChange?: (language: Language) => Promise<void> | void;
  compact?: boolean;
  className?: string;
}) {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const handleSelect = async (nextLanguage: Language) => {
    if (nextLanguage !== language) {
      setLanguage(nextLanguage);
      await onLanguageChange?.(nextLanguage);
      router.push(localizedPath(pathname, nextLanguage));
    }
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-[12px]'} ${className}`}>
      {!compact && <span className="font-semibold text-current">{t('nav.language')}</span>}
      <DropdownMenu
        panelClassName="w-[150px] bg-white rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.18)] border border-[#efece3] overflow-hidden"
        trigger={({ onClick, open }) => (
          <button
            type="button"
            onClick={onClick}
            aria-label={t('nav.language')}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="h-9 flex items-center gap-2 rounded-[7px] border border-[#2c4266] bg-[#1c3050] px-3 font-semibold text-white outline-none cursor-pointer hover:bg-slate-800 transition"
          >
            <span className="text-[15px] leading-none">{flags[language]}</span>
            {!compact && <span>{labels[language]}</span>}
            <span className="text-[#8ea0bd] text-[10px]">▾</span>
          </button>
        )}
      >
        {({ close }) => (
          <div role="listbox">
            {supportedLanguages.map(option => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === language}
                onClick={() => { close(); handleSelect(option); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-left transition ${option === language ? 'bg-[#fbfaf7] text-[#13243c]' : 'text-[#4c5058] hover:bg-[#fbfaf7]'}`}
              >
                <span className="text-[16px] leading-none">{flags[option]}</span>
                <span>{labels[option]}</span>
              </button>
            ))}
          </div>
        )}
      </DropdownMenu>
    </div>
  );
}
