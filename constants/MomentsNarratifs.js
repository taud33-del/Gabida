/**
 * constants/MomentsNarratifs.js
 *
 * Stades narratifs d'une aventure.
 * Utilisé par : types/Evenement.js (ContexteEvenement.moment), module analyse.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 *
 * NOTE ARCHITECTURE : cette liste est provisoire.
 * Validation requise avant implémentation du module analyse.
 */

/**
 * @readonly
 * @enum {string}
 */
export const MOMENTS_NARRATIFS = Object.freeze({
  /** Début de l'aventure — le personnage et le joueur se découvrent. */
  OUVERTURE: 'ouverture',

  /** Phase principale — l'aventure progresse, la relation se construit. */
  DEVELOPPEMENT: 'developpement',

  /** Point de friction ou de crise — la relation ou la situation est mise à l'épreuve. */
  TENSION: 'tension',

  /** Dénouement — la situation se stabilise, une réponse est apportée. */
  RESOLUTION: 'resolution',

  /** Clôture de l'aventure — le cycle touche à sa fin. */
  EPILOGUE: 'epilogue',
})
