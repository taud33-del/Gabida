/**
 * constants/TypesActionParticipant.js
 *
 * Types d'action qu'un participant peut produire lors d'un tour (Gabida V2).
 * Le type qualifie la nature d'une action produite, sans en décrire le contenu.
 *
 * Utilisé par : types/ActionParticipant.js (ActionParticipant.type).
 *
 * IMPORTANT : ce sont des IDENTIFIANTS stables, pas du langage naturel.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const TYPES_ACTION_PARTICIPANT = Object.freeze({
  /** Paroles réellement prononcées par le participant. */
  PAROLE: 'parole',

  /** Geste, posture, déplacement ou action concrète observable. */
  ACTION: 'action',

  /** Réaction intérieure non exprimée (pensée, ressenti) — non observable. */
  REACTION_INTERNE: 'reaction_interne',

  /** Prise en compte perceptive de la scène ou d'un autre participant. */
  OBSERVATION: 'observation',

  /** Absence volontaire d'action ou de parole. */
  SILENCE: 'silence',
})
