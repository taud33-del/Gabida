/**
 * types/ActionParticipant.js
 *
 * Contrat de données d'une action produite par un participant (Gabida V2 — Phase 1).
 *
 * Une action est ce qu'un participant produit lors d'un tour. Elle est
 * générique : parole, geste, réaction interne, observation ou silence. Sa
 * portée est qualifiée par une visibilité, comme un événement d'interaction.
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 *
 * Constantes utilisées :
 *   - TYPES_ACTION_PARTICIPANT (constants/TypesActionParticipant.js) → ActionParticipant.type
 *   - VISIBILITES_EVENEMENT    (constants/VisibilitesEvenement.js)   → ActionParticipant.visibilite
 */

/**
 * @typedef {object} ActionParticipant
 *
 * @property {string} id
 *   [obligatoire] Identifiant unique et stable de l'action.
 *
 * @property {string} participantId
 *   [obligatoire] Identifiant du participant auteur de l'action.
 *
 * @property {string} type
 *   [obligatoire] Nature de l'action produite.
 *   Valeurs : TYPES_ACTION_PARTICIPANT.PAROLE | .ACTION | .REACTION_INTERNE
 *             | .OBSERVATION | .SILENCE
 *   Voir constants/TypesActionParticipant.js.
 *
 * @property {unknown} contenu
 *   [obligatoire] Charge utile de l'action. Structure libre.
 *
 * @property {string[]} destinataireIds
 *   [obligatoire] Identifiants des participants destinataires. Peut être vide.
 *
 * @property {string} visibilite
 *   [obligatoire] Portée perceptive de l'action.
 *   Valeurs : VISIBILITES_EVENEMENT.PUBLIQUE | .PRIVEE | .RESTREINTE | .SYSTEME
 *   Voir constants/VisibilitesEvenement.js.
 *
 * @property {Object} metadata
 *   [obligatoire] Métadonnées libres. Peut être un objet vide.
 */
