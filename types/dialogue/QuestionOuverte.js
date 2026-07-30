/**
 * @typedef {object} QuestionOuverte
 *
 * @property {string} id
 * Identifiant stable de la question.
 *
 * @property {string} contenu
 * Formulation explicite de la question encore ouverte.
 *
 * @property {string} auteurId
 * Identifiant du participant ayant posé la question.
 *
 * @property {string[]} destinataireIds
 * Identifiants des participants auxquels la question est adressée.
 * Le tableau est vide lorsqu'aucun destinataire explicite n'existe.
 *
 * @property {string[]} evenementSourceIds
 * Identifiants des événements historiques maintenant la question ouverte.
 * Le tableau contient au moins un identifiant.
 *
 * @property {string} dateOuverture
 * Date ISO 8601 de l'ouverture de la question.
 */
