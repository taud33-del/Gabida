/**
 * types/TraceInteraction.js
 *
 * Contrat de données minimal d'une trace d'interaction (Gabida V2 — Phase 1).
 *
 * Une trace permettra plus tard de journaliser les étapes traversées par le
 * moteur multi-participants (audit, debug, explicabilité). Phase 1 définit
 * uniquement le contrat : AUCUNE logique de traçage n'est créée.
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 */

/**
 * @typedef {object} TraceInteraction
 *
 * @property {string} id
 *   [obligatoire] Identifiant unique et stable de la trace.
 *
 * @property {string|null} participantId
 *   [obligatoire] Participant concerné par l'étape, ou null si l'étape est
 *   globale (non rattachée à un participant particulier).
 *
 * @property {string} etape
 *   [obligatoire] Nom de l'étape tracée (chaîne libre à ce stade).
 *
 * @property {unknown} donnees
 *   [obligatoire] Données associées à l'étape. Structure libre.
 *
 * @property {string} date
 *   [obligatoire] Horodatage de la trace. Format ISO 8601.
 */
