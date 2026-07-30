/**
 * @typedef {object} ContrainteDialogue
 *
 * @property {string} id
 * Identifiant stable de la contrainte.
 *
 * @property {string} contenu
 * Formulation explicite de la contrainte actuellement applicable.
 *
 * @property {string[]} participantIds
 * Identifiants des participants auxquels la contrainte s'applique.
 * Le tableau est vide lorsque la contrainte concerne tout le dialogue.
 *
 * @property {string[]} evenementSourceIds
 * Identifiants des événements historiques établissant la contrainte.
 * Le tableau contient au moins un identifiant.
 *
 * @property {string} dateMiseAJour
 * Date ISO 8601 du dernier événement ayant établi ou actualisé la contrainte.
 */
