/**
 * constants/DirectionsNarratives.js
 *
 * Directions narratives possibles pour un tour.
 * Une direction narrative oriente la dynamique de l'aventure — elle ne dicte
 * jamais le texte de la reponse.
 *
 * Utilise par : types/Decision.js (Decision.directionNarrative), module decision.
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
export const DIRECTIONS_NARRATIVES = Object.freeze({
  /** Inviter le joueur a s'exprimer davantage (poser une question, ouvrir). */
  INVITER_JOUEUR: 'inviter_joueur',

  /** Laisser au joueur l'initiative du prochain pas. */
  LAISSER_INITIATIVE: 'laisser_initiative',

  /** Approfondir le lien ou revenir sur un element du passe partage. */
  APPROFONDIR_LIEN: 'approfondir_lien',

  /** Desamorcer une tension, apaiser la situation. */
  APAISER_TENSION: 'apaiser_tension',

  /** Conclure ou stabiliser la situation en cours. */
  CONCLURE_SITUATION: 'conclure_situation',
})
