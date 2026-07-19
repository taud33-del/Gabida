/**
 * constants/StatutsParticipant.js
 *
 * Statuts possibles d'un participant à une interaction (Gabida V2).
 * Le statut décrit le degré de participation courant, indépendamment du type.
 *
 * Utilisé par : types/Participant.js (Participant.statut).
 *
 * IMPORTANT : ce sont des IDENTIFIANTS stables, pas du langage naturel.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const STATUTS_PARTICIPANT = Object.freeze({
  /** Participe pleinement : perçoit et peut produire des actions. */
  ACTIF: 'actif',

  /** Présent et percevant, mais ne produit pas d'action pour l'instant. */
  PASSIF: 'passif',

  /** Ne participe plus : ne perçoit pas et ne produit aucune action. */
  INACTIF: 'inactif',
})
