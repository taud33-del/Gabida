/**
 * Relation directionnelle et privee portee par un participant envers un autre.
 *
 * @typedef {object} RelationParticipant
 * @property {string} id
 * @property {string} participantId
 * @property {string} cibleParticipantId
 * @property {Object.<string, number>} dimensions Valeurs finies dans [-1, 1].
 * @property {string} statut
 * @property {import('./ProvenanceRelation.js').ProvenanceRelation[]} provenance
 * @property {string[]} evenementSourceIds
 * @property {string} dateCreation
 * @property {string} dateMiseAJour
 * @property {Object} metadata
 */
