/**
 * constants/VisibilitesEvenement.js
 *
 * Visibilités possibles d'un événement d'interaction (Gabida V2).
 * La visibilité détermine quels participants sont susceptibles de percevoir un
 * événement ou une action. Elle ne contient aucune règle de perception : elle
 * ne fait que qualifier la portée d'un événement.
 *
 * Utilisé par : types/EvenementInteraction.js (EvenementInteraction.visibilite)
 *               et types/ActionParticipant.js (ActionParticipant.visibilite).
 *
 * IMPORTANT : ce sont des IDENTIFIANTS stables, pas du langage naturel.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const VISIBILITES_EVENEMENT = Object.freeze({
  /** Perceptible par tous les participants de l'interaction. */
  PUBLIQUE: 'publique',

  /** Perceptible uniquement par les destinataires explicites. */
  PRIVEE: 'privee',

  /** Perceptible par un sous-ensemble restreint de participants. */
  RESTREINTE: 'restreinte',

  /** Événement technique interne, non destiné aux participants incarnés. */
  SYSTEME: 'systeme',
})
