/**
 * @typedef {object} FaitDialogue
 *
 * @property {string} id
 * Identifiant stable du fait dans la projection.
 *
 * @property {string} contenu
 * Formulation factuelle explicite établie dans le dialogue.
 *
 * @property {string[]} evenementSourceIds
 * Identifiants des événements historiques établissant ce fait.
 * Le tableau contient au moins un identifiant.
 *
 * @property {string} dateMiseAJour
 * Date ISO 8601 du dernier événement ayant établi ou actualisé ce fait.
 */
