/**
 * constants/TypesSouvenir.js
 *
 * Types d'origines possibles d'un souvenir dans la mémoire vécue.
 * Utilisé par : memoire/types.js (Souvenir.type), module memoire.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const TYPES_SOUVENIR = Object.freeze({
  /** Échange verbal notable entre le joueur et le personnage. */
  DIALOGUE: 'dialogue',

  /** Fait objectif survenu dans l'aventure, indépendant des intentions. */
  EVENEMENT: 'evenement',

  /** Choix significatif effectué par le joueur ou le personnage. */
  DECISION: 'decision',

  /** Engagement explicite exprimé par l'une des parties. */
  PROMESSE: 'promesse',

  /** Écart détecté entre ce qui a été dit et la réalité connue du personnage. */
  MENSONGE: 'mensonge',
})
