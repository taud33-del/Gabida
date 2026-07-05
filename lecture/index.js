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
 * Il connaît uniquement leur structure : chaque fiche doit être un objet.
 * Il n'interprète, ne normalise ni n'invente aucune valeur narrative.
 *
 * Axiome 11 : Gabida n'invente jamais. Il interprète uniquement ce que les fiches lui donnent.
 * Axiome 12 : Une fiche ne connaît jamais les autres fiches. C'est Gabida qui les relie.
 * Axiome 13 : Une information n'existe qu'à un seul endroit.
 *
 * @module lecture
 */

import {
  SourcesInvalidesError,
  FicheManquanteError,
  TypeFicheInvalideError,
  FicheInvalideError,
} from './LectureError.js'

/**
 * Types de fiches obligatoires attendus par le moteur (core.preparerTour).
 * Ordre stable, source unique de vérité du module.
 *
 * @type {readonly string[]}
 */
export const TYPES_FICHE = Object.freeze([
  'personnage',
  'aventure',
  'univers',
  'joueur',
  'memoire',
])

/**
 * estObjet(valeur)
 *
 * Pure. Vrai si la valeur est un objet exploitable (ni null, ni tableau).
 *
 * @param {unknown} valeur
 * @returns {boolean}
 */
function estObjet(valeur) {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

/**
 * validateFiche(type, data)
 *
 * Valide une fiche individuelle. Validation strictement structurelle :
 * le type doit être l'un des 5 types Gabida et la donnée doit être un objet.
 * Aucune interprétation du contenu, aucune valeur par défaut narrative.
 * Retourne la fiche telle quelle si valide (jamais mutée).
 *
 * @param {string}  type — 'personnage' | 'aventure' | 'univers' | 'joueur' | 'memoire'.
 * @param {unknown} data — Données brutes à valider.
 * @returns {object} — Fiche validée (inchangée).
 * @throws {TypeFicheInvalideError} type inconnu.
 * @throws {FicheInvalideError} data absente ou non-objet.
 */
export function validateFiche(type, data) {
  if (!TYPES_FICHE.includes(type)) {
    throw new TypeFicheInvalideError(type)
  }
  if (!estObjet(data)) {
    throw new FicheInvalideError(type, 'doit être un objet non nul.')
  }
  return data
}

/**
 * loadFiches(sources)
 *
 * Charge et valide l'ensemble des 5 fiches fournies en entrée.
 * Retourne un objet structuré contenant les 5 fiches validées, prêt à être
 * transmis à executeTurn(). Ne modifie jamais les données reçues.
 *
 * @param {object} sources
 * @param {unknown} sources.personnage — Données brutes de la fiche personnage.
 * @param {unknown} sources.aventure  — Données brutes de la fiche aventure.
 * @param {unknown} sources.univers   — Données brutes de la fiche univers.
 * @param {unknown} sources.joueur    — Données brutes de la fiche joueur.
 * @param {unknown} sources.memoire   — Données brutes de la fiche mémoire.
 *
 * @returns {FichesChargees}
 * @throws {SourcesInvalidesError} sources absent ou non-objet.
 * @throws {FicheManquanteError} une fiche obligatoire est absente.
 * @throws {FicheInvalideError} une fiche présente est invalide.
 *
 * @typedef {object} FichesChargees
 * @property {object} personnage
 * @property {object} aventure
 * @property {object} univers
 * @property {object} joueur
 * @property {object} memoire
 */
export function loadFiches(sources) {
  if (!estObjet(sources)) {
    throw new SourcesInvalidesError('lecture.loadFiches : sources est absent ou n\'est pas un objet.')
  }

  /** @type {FichesChargees} */
  const fiches = {}

  for (const type of TYPES_FICHE) {
    const brute = sources[type]
    if (brute === undefined || brute === null) {
      throw new FicheManquanteError(type)
    }
    fiches[type] = validateFiche(type, brute)
  }

  return fiches
}
