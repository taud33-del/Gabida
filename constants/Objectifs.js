/**
 * constants/Objectifs.js
 *
 * Objectifs immediats possibles d'un personnage pour un tour.
 * Un objectif est ce que le personnage cherche a accomplir ce tour — une
 * intention, jamais une action ni une phrase.
 *
 * Utilise par : types/Decision.js (Decision.objectifImmediat), module decision.
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
export const OBJECTIFS = Object.freeze({
  /** Renforcer ou reparer le lien avec le joueur (priorite relationnelle). */
  RENFORCER_RELATION: 'renforcer_relation',

  /** Se proteger, garder une distance prudente face au joueur. */
  PROTEGER_SOI: 'proteger_soi',

  /** Repondre a une sollicitation directe (question, demande) du joueur. */
  REPONDRE_SOLLICITATION: 'repondre_sollicitation',

  /** Explorer, faire avancer la situation ou la comprehension mutuelle. */
  FAIRE_AVANCER: 'faire_avancer',

  /** Maintenir la position actuelle sans engagement supplementaire. */
  MAINTENIR_POSITION: 'maintenir_position',
})
