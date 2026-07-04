/**
 * constants/SourcesInfluence.js
 *
 * Origines possibles d'une influence active dans le filtre relationnel.
 * Utilisé par : types/FiltreRelationnel.js (InfluenceActive.source), module influences.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const SOURCES_INFLUENCE = Object.freeze({
  /** L'influence provient directement de la valeur d'un critère dans une fiche. */
  CRITERE: 'critere',

  /** L'influence provient d'un souvenir retenu dans la mémoire vécue. */
  SOUVENIR: 'souvenir',

  /** L'influence résulte de l'application d'un axiome Gabida. */
  AXIOME: 'axiome',
})
