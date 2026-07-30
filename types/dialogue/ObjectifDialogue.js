/**
 * @typedef {object} ObjectifDialogue
 *
 * @property {string} id
 * Identifiant stable de l'objectif dans la projection.
 *
 * @property {string} contenu
 * Formulation explicite de l'objectif actuellement poursuivi dans le dialogue.
 *
 * @property {string[]} participantIds
 * Identifiants des participants explicitement associés à l'objectif.
 * Le tableau est vide lorsque l'objectif concerne globalement le dialogue.
 *
 * @property {string[]} evenementSourceIds
 * Identifiants des événements historiques établissant ou maintenant cet objectif.
 * Le tableau contient au moins un identifiant.
 *
 * @property {string} dateMiseAJour
 * Date ISO 8601 du dernier événement ayant établi ou actualisé cet objectif.
 */
