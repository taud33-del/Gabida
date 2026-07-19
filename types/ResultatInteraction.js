/**
 * types/ResultatInteraction.js
 *
 * Contrat de données du résultat d'une interaction (Gabida V2 — Phase 1).
 *
 * Un résultat d'interaction regroupe ce qui a été produit en réponse à une
 * sollicitation : les actions des participants, les événements qui en découlent,
 * l'état résultant et les traces des étapes. Purement structurel : aucune
 * logique ne produit ce résultat en Phase 1.
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 */

/**
 * @typedef {object} ResultatInteraction
 *
 * @property {string} sollicitationId
 *   [obligatoire] Identifiant de la sollicitation à l'origine du résultat.
 *
 * @property {import('./Intention.js').Intention[]} intentionsRetenues
 *   [obligatoire] Intentions arbitrees avant l orchestration.
 *
 * @property {import('./ActionParticipant.js').ActionParticipant[]} actions
 *   [obligatoire] Actions produites par les participants. Peut être vide.
 *
 * @property {import('./EvenementInteraction.js').EvenementInteraction[]} evenementsProduits
 *   [obligatoire] Événements découlant des actions. Peut être vide.
 *
 * @property {import('./EtatInteraction.js').EtatInteraction} etat
 *   [obligatoire] État de l'interaction après traitement.
 *
 * @property {import('./TraceInteraction.js').TraceInteraction[]} traces
 *   [obligatoire] Traces des étapes traversées. Peut être vide.
 */
