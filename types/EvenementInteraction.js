/**
 * types/EvenementInteraction.js
 *
 * Contrat de données d'un événement d'interaction (Gabida V2 — Phase 1).
 *
 * Un événement d'interaction est un fait survenu dans l'interaction, émis par un
 * participant (ou par personne, ex. événement d'ambiance) et destiné à un ou
 * plusieurs participants. C'est l'unité générique circulant entre participants,
 * indépendante de tout personnage.
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 *
 * NOTE : ce type est distinct de types/Evenement.js (V1), qui qualifie le
 * message joueur pour le pipeline mono-personnage. Aucun type existant n'est
 * modifié ni remplacé.
 *
 * Constantes utilisées :
 *   - VISIBILITES_EVENEMENT (constants/VisibilitesEvenement.js) → EvenementInteraction.visibilite
 */

/**
 * @typedef {object} EvenementInteraction
 *
 * @property {string} id
 *   [obligatoire] Identifiant unique et stable de l'événement.
 *
 * @property {string} type
 *   [obligatoire] Type d'événement (chaîne libre à ce stade).
 *
 * @property {string|null} emetteurId
 *   [obligatoire] Identifiant du participant émetteur, ou null si l'événement
 *   n'émane d'aucun participant (ex. événement d'ambiance ou système).
 *
 * @property {string[]} destinataireIds
 *   [obligatoire] Identifiants des participants destinataires. Peut être vide.
 *
 * @property {unknown} contenu
 *   [obligatoire] Charge utile de l'événement. Structure libre.
 *
 * @property {string} visibilite
 *   [obligatoire] Portée perceptive de l'événement.
 *   Valeurs : VISIBILITES_EVENEMENT.PUBLIQUE | .PRIVEE | .RESTREINTE | .SYSTEME
 *   Voir constants/VisibilitesEvenement.js.
 *
 * @property {string} date
 *   [obligatoire] Horodatage de l'événement. Format ISO 8601.
 *
 * @property {Object} metadata
 *   [obligatoire] Métadonnées libres. Peut être un objet vide.
 */
