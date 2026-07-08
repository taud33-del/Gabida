/**
 * langage/index.js
 *
 * Responsabilité unique : définir le langage universel des critères.
 *
 * Le moteur ne connaît jamais les critères par leur nom narratif.
 * Il connaît uniquement :
 *   - leur type
 *   - leur famille de langage
 *   - leur valeur
 *
 * Source : Spécifications techniques §7
 *
 * Ce module centralise :
 *   - les familles de valeurs possibles (ex. : intensité, fréquence, polarité...)
 *   - les types de critères (texte, choix unique, choix multiple, booléen, numérique...)
 *   - les règles de lecture d'une valeur par le moteur
 *
 * Il ne contient aucun critère nommé.
 * Aucune référence à un personnage, une aventure ou un univers.
 */

/**
 * TYPES_CRITERE
 *
 * Types structurels d'un critère dans une fiche.
 * Déterminent comment la valeur est lue et validée par le module lecture.
 *
 * @type {Record<string, string>}
 */
export const TYPES_CRITERE = {
  TEXTE        : 'texte',
  CHOIX_UNIQUE : 'choix_unique',
  CHOIX_MULTIPLE: 'choix_multiple',
  BOOLEEN      : 'booleen',
  NUMERIQUE    : 'numerique',
}

/**
 * FAMILLES_VALEUR
 *
 * Familles de langage universel.
 * Le moteur ne connaît jamais un critère par son nom — uniquement par sa famille.
 * (Source : Spécifications techniques §7)
 *
 * NOTE ARCHITECTURE : la liste exacte des familles de valeurs n'est pas encore
 * documentée dans les carnets de conception.
 * Cet emplacement est réservé — aucune famille n'est inventée ici.
 * Une validation d'architecture est nécessaire avant de remplir cette constante.
 *
 * @type {Record<string, string>}
 */
export const FAMILLES_VALEUR = {
  // À définir lors de la validation du langage universel.
}

/**
 * resolveValeur(type, rawValue)
 *
 * Normalise une valeur brute issue d'une fiche selon son type de critère.
 * Retourne la valeur dans le format attendu par le moteur.
 * Lève une erreur si la valeur est incompatible avec le type déclaré.
 *
 * @param {string}  type     — Type du critère (valeur de TYPES_CRITERE).
 * @param {unknown} rawValue — Valeur brute issue de la fiche.
 *
 * @returns {unknown} — Valeur normalisée.
 */
export function resolveValeur(type, rawValue) {
  // TODO : implémenter
  throw new Error('resolveValeur : non implémenté')
}
