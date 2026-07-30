/**
 * @typedef {object} ReponseDialogue
 *
 * @property {string} id
 * Identifiant stable de la réponse constatée.
 *
 * @property {string} questionId
 * Identifiant non vide de la question à laquelle la réponse se rapporte.
 *
 * @property {string} contenu
 * Contenu explicite de la réponse constatée dans le dialogue.
 *
 * @property {string} auteurId
 * Identifiant du participant ayant apporté la réponse.
 *
 * @property {string[]} evenementSourceIds
 * Identifiants des événements historiques établissant la réponse.
 * Le tableau contient au moins un identifiant.
 *
 * @property {string} dateReponse
 * Date ISO 8601 à laquelle la réponse a été apportée.
 */
