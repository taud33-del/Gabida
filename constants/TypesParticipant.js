/**
 * constants/TypesParticipant.js
 *
 * Types techniques possibles d'un participant à une interaction (Gabida V2).
 * Le type décrit la NATURE technique d'un participant, pas son profil narratif
 * (voir constants/TypesProfilParticipant.js pour le profil).
 *
 * Utilisé par : types/Participant.js (Participant.type).
 *
 * IMPORTANT : ce sont des IDENTIFIANTS stables, pas du langage naturel.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const TYPES_PARTICIPANT = Object.freeze({
  /** Entité pilotée par le moteur : perçoit, analyse, ressent, décide, agit. */
  AGENT_AUTONOME: 'agent_autonome',

  /** Source externe d'événements non pilotée par le moteur (ex. joueur humain). */
  EMETTEUR_EXTERNE: 'emetteur_externe',

  /** Voix narrative mettant la scène en place, sans être un acteur incarné. */
  NARRATEUR: 'narrateur',

  /** Participant technique interne (règles, mécanismes, orchestration). */
  SYSTEME: 'systeme',
})
