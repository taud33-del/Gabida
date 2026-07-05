/**
 * core/stages/StageKeys.js
 *
 * Single responsibility: declare the official Context keys and names used by the
 * business-adapter stages (core/stages).
 *
 * These constants form the bridge contract between the immutable Context and the
 * existing business modules. No stage addresses a Context slot with a raw string.
 *
 * No logic. No dependencies. Constants only.
 */

/**
 * Generic-bag keys carried across the narrative stages.
 * Inputs are provided by the host before execution; outputs are written by stages.
 */
export const STAGE_KEYS = Object.freeze({
  // Entrees fournies par l'hote
  PLAYER_MESSAGE     : 'playerMessage',
  FICHES             : 'fiches',
  ETAT               : 'etat',
  // Sorties produites par les stages
  EVENEMENT          : 'evenement',
  FILTRE_RELATIONNEL : 'filtreRelationnel',
})

/**
 * Stable, unique names of the narrative adapter stages.
 */
export const STAGE_NAMES = Object.freeze({
  ANALYSE    : 'analyse',
  INFLUENCES : 'influences',
})
