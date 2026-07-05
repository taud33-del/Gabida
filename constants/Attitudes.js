/**
 * constants/Attitudes.js
 *
 * Attitudes possibles adoptees par un personnage pour un tour.
 * L'attitude est la maniere d'etre : ton, posture, degre d'ouverture.
 *
 * Utilise par : types/Decision.js (Decision.attitude), module decision.
 *
 * IMPORTANT : ce sont des IDENTIFIANTS stables, pas du langage naturel.
 * La mise en langage appartient exclusivement au module prompt (Axiome 17).
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportees.
 */

/**
 * @readonly
 * @enum {string}
 */
export const ATTITUDES = Object.freeze({
  /** Disposition positive, disponible, sans mefiance. */
  OUVERTE: 'ouverte',

  /** Position d'attente, ni favorable ni defavorable. */
  NEUTRE: 'neutre',

  /** Sur la reserve, distance perceptible, engagement mesure. */
  RESERVEE: 'reservee',

  /** Sur la defensive, protection active face a une menace percue. */
  DEFENSIVE: 'defensive',
})
