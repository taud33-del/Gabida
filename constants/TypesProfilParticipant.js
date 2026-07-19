/**
 * constants/TypesProfilParticipant.js
 *
 * Types de profil possibles pour un participant (Gabida V2).
 * Le profil décrit ce QU'INCARNE un participant (sa nature narrative), là où
 * TYPES_PARTICIPANT décrit sa nature technique. « Personnage » n'est ici qu'un
 * type de profil parmi d'autres : le participant redevient l'unité centrale.
 *
 * Utilisé par : types/Participant.js (ProfilParticipant.type).
 *
 * IMPORTANT : ce sont des IDENTIFIANTS stables, pas du langage naturel.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const TYPES_PROFIL_PARTICIPANT = Object.freeze({
  /** Personnage incarné, doté de fiches, d'une psychologie et d'objectifs. */
  PERSONNAGE: 'personnage',

  /** Utilisateur/joueur humain prenant part à l'interaction. */
  UTILISATEUR: 'utilisateur',

  /** Voix narrative décrivant la scène sans être un acteur incarné. */
  NARRATEUR: 'narrateur',

  /** Profil technique interne (règles, mécanismes, orchestration). */
  SYSTEME: 'systeme',

  /** Profil libre, non couvert par les catégories ci-dessus. */
  PERSONNALISE: 'personnalise',
})
