/**
 * types/Sollicitation.js
 *
 * Contrat de données d'une sollicitation (Gabida V2 — Phase 1).
 *
 * Une sollicitation est une demande faite à un ou plusieurs participants de
 * réagir à un événement d'interaction. Elle exprime « qui doit être sollicité »
 * sans décrire comment la réaction est produite (aucune logique de perception ni
 * d'orchestration n'est définie en Phase 1).
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 */

/**
 * @typedef {object} Sollicitation
 *
 * @property {string} id
 *   [obligatoire] Identifiant unique et stable de la sollicitation.
 *
 * @property {import('./EvenementInteraction.js').EvenementInteraction} evenement
 *   [obligatoire] Événement à l'origine de la sollicitation.
 *
 * @property {string[]} participantIdsCibles
 *   [obligatoire] Identifiants des participants sollicités. Peut être vide.
 *
 * @property {Object} options
 *   [obligatoire] Options libres de la sollicitation. Peut être un objet vide.
 *
 * @property {string} date
 *   [obligatoire] Horodatage de la sollicitation. Format ISO 8601.
 */
