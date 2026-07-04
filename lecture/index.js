/**
 * lecture/index.js
 *
 * Responsabilité unique : charger et valider les fiches fournies en entrée.
 *
 * Fiches supportées (source : Spécifications techniques v1.0) :
 *   - Fiche Personnage
 *   - Fiche Aventure
 *   - Fiche Univers
 *   - Fiche Joueur
 *   - Fiche Mémoire
 *
 * Ce module ne connaît jamais le contenu sémantique des fiches.
 * Il connaît uniquement leur structure et leurs types de critères.
 *
 * Axiome 11 : Gabida n'invente jamais. Il interprète uniquement ce que les fiches lui donnent.
 * Axiome 12 : Une fiche ne connaît jamais les autres fiches. C'est Gabida qui les relie.
 * Axiome 13 : Une information n'existe qu'à un seul endroit.
 */

/**
 * loadFiches(sources)
 *
 * Charge et valide l'ensemble des fiches fournies en entrée.
 * Retourne un objet structuré contenant les 5 fiches validées.
 * Lève une erreur si une fiche obligatoire est absente ou invalide.
 *
 * @param {object} sources
 * @param {unknown} sources.personnage — Données brutes de la fiche personnage.
 * @param {unknown} sources.aventure  — Données brutes de la fiche aventure.
 * @param {unknown} sources.univers   — Données brutes de la fiche univers.
 * @param {unknown} sources.joueur    — Données brutes de la fiche joueur.
 * @param {unknown} sources.memoire   — Données brutes de la fiche mémoire.
 *
 * @returns {FichesChargees}
 *
 * @typedef {object} FichesChargees
 * @property {object} personnage
 * @property {object} aventure
 * @property {object} univers
 * @property {object} joueur
 * @property {object} memoire
 */
export function loadFiches(sources) {
  // TODO : implémenter
  throw new Error('loadFiches : non implémenté')
}

/**
 * validateFiche(type, data)
 *
 * Valide une fiche individuelle selon son schéma.
 * Retourne la fiche normalisée si valide.
 * Lève une erreur descriptive si invalide.
 *
 * @param {string}  type — Identifiant du type de fiche : 'personnage' | 'aventure' | 'univers' | 'joueur' | 'memoire'.
 * @param {unknown} data — Données brutes à valider.
 *
 * @returns {object} — Fiche normalisée.
 */
export function validateFiche(type, data) {
  // TODO : implémenter
  throw new Error('validateFiche : non implémenté')
}
