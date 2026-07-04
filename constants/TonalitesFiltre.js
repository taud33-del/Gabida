/**
 * constants/TonalitesFiltre.js
 *
 * Tonalités relationnelles dominantes du filtre relationnel.
 * Représentent la disposition générale du personnage envers le joueur ce tour.
 * Utilisé par : types/FiltreRelationnel.js (SyntheseFiltre.tonalite), module influences.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const TONALITES_FILTRE = Object.freeze({
  /** Le personnage est disposé positivement, disponible, sans méfiance. */
  OUVERTE: 'ouverte',

  /** Le personnage n'est ni favorable ni défavorable — position d'attente. */
  NEUTRE: 'neutre',

  /** Le personnage se protège, garde une distance, répond a minima. */
  FERMEE: 'fermee',

  /** Le personnage perçoit le joueur comme une menace ou une opposition active. */
  HOSTILE: 'hostile',
})
