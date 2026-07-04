/**
 * constants/OriginesRessenti.js
 *
 * Ce qui a principalement déclenché un ressenti dominant ce tour.
 * Permet de distinguer un ressenti situationnel d'un trait de fond.
 * Utilisé par : types/Ressenti.js (RessentDominant.origine), module ressenti.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const ORIGINES_RESSENTI = Object.freeze({
  /** Le ressenti a été déclenché par ce que le joueur a dit ou fait ce tour. */
  EVENEMENT: 'evenement',

  /** Le ressenti a été amplifié ou créé par le filtre relationnel (influences). */
  INFLUENCE: 'influence',

  /** Le ressenti est présent indépendamment de l'événement — fond de personnalité stable. */
  TRAIT: 'trait',
})
