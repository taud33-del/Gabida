/**
 * @typedef {object} DecisionDialogue
 *
 * @property {string} id
 * Identifiant stable de la décision.
 *
 * @property {string} contenu
 * Formulation explicite de la décision actuellement en vigueur.
 *
 * @property {string[]} participantIds
 * Identifiants des participants explicitement associés à la décision.
 * Le tableau est vide pour une décision collective non attribuée.
 *
 * @property {string[]} evenementSourceIds
 * Identifiants des événements historiques établissant la décision.
 * Le tableau contient au moins un identifiant.
 *
 * @property {string} dateDecision
 * Date ISO 8601 à laquelle la décision a été établie.
 */
