/**
 * types/RelationParticipant.js
 *
 * Contrat de données d'une relation entre participants (Gabida V2 — Phase 1).
 *
 * Une relation est DIRECTIONNELLE : elle décrit ce que `sourceId` porte envers
 * `cibleId`. Une relation réciproque est donc représentée par deux relations
 * distinctes. Les dimensions relationnelles sont libres (confiance, respect…) et
 * ne sont pas figées ici.
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 */

/**
 * @typedef {object} RelationParticipant
 *
 * @property {string} sourceId
 *   [obligatoire] Identifiant du participant qui porte la relation.
 *
 * @property {string} cibleId
 *   [obligatoire] Identifiant du participant visé par la relation.
 *
 * @property {Object} dimensions
 *   [obligatoire] Dimensions relationnelles indexées par nom (ex. { confiance: 20 }).
 *   Structure libre. Peut être un objet vide.
 *
 * @property {Object} metadata
 *   [obligatoire] Métadonnées libres. Peut être un objet vide.
 */
