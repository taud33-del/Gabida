/**
 * @typedef {object} FaitAConfirmer
 *
 * @property {string} id
 * Identifiant stable de l'information à confirmer.
 *
 * @property {string} contenu
 * Formulation explicite de l'information nécessitant une confirmation.
 *
 * @property {string[]} confirmationParticipantIds
 * Identifiants des participants dont une confirmation est attendue.
 * Le tableau est vide lorsque la source de confirmation n'est pas déterminée.
 *
 * @property {string[]} evenementSourceIds
 * Identifiants des événements historiques à l'origine de l'information.
 * Le tableau contient au moins un identifiant.
 *
 * @property {string} dateMiseAJour
 * Date ISO 8601 du dernier événement ayant maintenu ou actualisé cette attente.
 */
