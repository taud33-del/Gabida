/**
 * constants/Intentions.js
 *
 * Intentions détectables dans un message joueur.
 * Utilisé par : types/Evenement.js, module analyse.
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
export const INTENTIONS = Object.freeze({
  /** Le joueur pose une question directe ou implicite. */
  QUESTION: 'question',

  /** Le joueur partage quelque chose de personnel ou d'intime. */
  CONFIDENCE: 'confidence',

  /** Le joueur cherche à déstabiliser, tester ou défier le personnage. */
  PROVOCATION: 'provocation',

  /** Le joueur formule une demande explicite (aide, faveur, action). */
  DEMANDE: 'demande',

  /** Le joueur observe, commente ou décrit sans demander ni interpeller. */
  OBSERVATION: 'observation',

  /** Le joueur n'envoie rien ou un message vide / insignifiant. */
  SILENCE: 'silence',
})
