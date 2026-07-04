/**
 * types/PlayerMessage.js
 *
 * Produit par  : application hôte
 * Consommé par : core, analyse
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 */

/**
 * @typedef {object} PlayerMessage
 *
 * Message brut émis par le joueur.
 * Première donnée reçue par le cycle — point de départ de tout tour.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} texte
 *   [obligatoire] Contenu brut du message tel que saisi par le joueur.
 *   Ne doit pas être vide. Longueur maximale non définie à ce stade.
 *
 * @property {number} tour
 *   [obligatoire] Numéro du tour en cours.
 *   Entier strictement positif, commence à 1. Incrémenté par core à chaque cycle.
 *
 * @property {string} sessionId
 *   [obligatoire] Identifiant unique et opaque de la session en cours.
 *   Produit par l'application hôte. Format libre (ex. : UUID v4).
 *   Stable pendant toute la durée de la session.
 *
 * @property {number} timestamp
 *   [obligatoire] Horodatage Unix en millisecondes au moment de l'envoi du message.
 *   Utilisé pour la traçabilité — non utilisé dans les calculs du cycle.
 */
