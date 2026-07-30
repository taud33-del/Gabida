/**
 * @typedef {object} EtatDialogue
 *
 * @property {import('./FaitDialogue.js').FaitDialogue[]} faits
 * Faits actuellement établis dans le dialogue.
 *
 * @property {import('./ObjectifDialogue.js').ObjectifDialogue[]} objectifs
 * Objectifs actuellement actifs dans le dialogue.
 *
 * @property {import('./QuestionOuverte.js').QuestionOuverte[]} questionsOuvertes
 * Questions actuellement ouvertes.
 *
 * @property {import('./DecisionDialogue.js').DecisionDialogue[]} decisions
 * Décisions actuellement en vigueur dans le dialogue.
 *
 * @property {import('./ContrainteDialogue.js').ContrainteDialogue[]} contraintes
 * Contraintes actuellement applicables au dialogue.
 *
 * @property {import('./ReponseDialogue.js').ReponseDialogue[]} reponses
 * Réponses explicitement apportées à des questions du dialogue.
 *
 * @property {import('./FaitAConfirmer.js').FaitAConfirmer[]} faitsAConfirmer
 * Informations évoquées mais nécessitant encore une confirmation.
 *
 * @property {string[]} evenementSourceIds
 * Identifiants ordonnés chronologiquement des événements historiques utilisés pour
 * construire cette projection. Le tableau contient au moins un identifiant.
 *
 * @property {string} dateMiseAJour
 * Date ISO 8601 du dernier événement pris en compte dans la projection.
 */
