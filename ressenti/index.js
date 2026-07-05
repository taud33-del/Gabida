/**
 * ressenti/index.js
 *
 * Responsabilite unique : calculer le ressenti du personnage pour ce tour.
 *
 * Le module repond a la question : "Que ressent le personnage ?"
 *
 * Distinction fondamentale (source : langage interne Gabida v1.0) :
 *   - Une emotion est un etat brut issu de la fiche personnage (defini, nomme, stable).
 *   - Un ressenti est le resultat calcule de ce que le personnage eprouve a cet instant precis,
 *     sous l'effet du filtre relationnel et de l'evenement vecu.
 *
 * Ordre dans le cycle : Analyse -> Influences -> Ressenti -> Decision
 *
 * Ce module consomme exclusivement la sortie d'Influences (FiltreRelationnel),
 * plus l'Evenement (uniquement pour classer l'origine de chaque ressenti).
 * Il produit un Ressenti qui remplace FiltreRelationnel dans la suite du cycle :
 * decision/ recoit uniquement Ressenti -- jamais FiltreRelationnel.
 *
 * Module metier PUR :
 *   - aucune dependance sur core/, le Runtime ou le Context ;
 *   - aucun effet de bord (pas de Date, pas de random, pas d'I/O) ;
 *   - deterministe : une meme entree produit toujours la meme sortie ;
 *   - aucune emotion nommee en dur (Axiome 8) — tout vient des criteres du filtre.
 *
 * Axiome 6  : Les valeurs permanentes changent difficilement (personnalite...).
 * Axiome 7  : Les etats temporaires changent rapidement (colere, peur...).
 * Axiome 8  : Une emotion ne remplace jamais la personnalite.
 * Axiome 19 : Toute evolution doit etre explicable.
 */

import { SOURCES_INFLUENCE } from '../constants/SourcesInfluence.js'
import { ORIGINES_RESSENTI } from '../constants/OriginesRessenti.js'
import { InvalidFiltreRelationnelError } from './RessentiError.js'

// ─── Constantes locales ─────────────────────────────────────────────────────

const NB_DOMINANTS = 3

// ─── Helpers purs ─────────────────────────────────────────────────────────────

/**
 * Borne une valeur entre 0 et 1 inclus.
 *
 * @param {number} v
 * @returns {number}
 */
function clamp(v) {
  return Math.min(1, Math.max(0, v))
}

/**
 * Determine l'origine d'un ressenti a partir de la source de l'influence
 * et des criteres concernes par l'evenement.
 *
 *   - source SOUVENIR ou AXIOME              -> INFLUENCE
 *   - source CRITERE, cible dans l'evenement -> EVENEMENT
 *   - source CRITERE, sinon                  -> TRAIT
 *
 * @param {import('../types/FiltreRelationnel.js').InfluenceActive} influence
 * @param {string[]} criteresConernes
 * @returns {string} -- une valeur de ORIGINES_RESSENTI
 */
export function determinerOrigine(influence, criteresConernes) {
  if (influence.source === SOURCES_INFLUENCE.CRITERE) {
    return criteresConernes.includes(influence.cibleId)
      ? ORIGINES_RESSENTI.EVENEMENT
      : ORIGINES_RESSENTI.TRAIT
  }
  return ORIGINES_RESSENTI.INFLUENCE
}

/**
 * Ordonne les influences par poids decroissant, avec un tie-break alphabetique
 * sur cibleId pour garantir un ordre totalement deterministe.
 *
 * @param {import('../types/FiltreRelationnel.js').InfluenceActive[]} influences
 * @returns {import('../types/FiltreRelationnel.js').InfluenceActive[]}
 */
export function ordonnerInfluences(influences) {
  return [...influences].sort((a, b) => {
    if (b.poids !== a.poids) return b.poids - a.poids
    return a.cibleId < b.cibleId ? -1 : a.cibleId > b.cibleId ? 1 : 0
  })
}

/**
 * Construit les 3 ressentis dominants du tour, ordonnes par intensite decroissante.
 * Complete avec des dominants d'intensite 0 (origine TRAIT) si moins de 3 influences.
 *
 * @param {import('../types/FiltreRelationnel.js').InfluenceActive[]} influencesOrdonnees
 * @param {string[]} criteresConernes
 * @param {string} critereMoteur -- cible de repli pour le padding
 * @returns {import('../types/Ressenti.js').RessentDominant[]}
 */
export function construireDominants(influencesOrdonnees, criteresConernes, critereMoteur) {
  const dominants = influencesOrdonnees.slice(0, NB_DOMINANTS).map((inf) => ({
    critereId: inf.cibleId,
    intensite: clamp(inf.poids),
    origine:   determinerOrigine(inf, criteresConernes),
  }))

  while (dominants.length < NB_DOMINANTS) {
    dominants.push({
      critereId: critereMoteur,
      intensite: 0,
      origine:   ORIGINES_RESSENTI.TRAIT,
    })
  }

  return dominants
}

/**
 * Extrait les etats temporaires (Axiome 7) : criteres situationnels du tour,
 * issus des influences d'origine EVENEMENT ou INFLUENCE.
 *
 * @param {import('../types/FiltreRelationnel.js').InfluenceActive[]} influencesOrdonnees
 * @param {string[]} criteresConernes
 * @returns {import('../types/Ressenti.js').EtatCritere[]}
 */
export function extraireEtatsTemporaires(influencesOrdonnees, criteresConernes) {
  return influencesOrdonnees
    .filter((inf) => determinerOrigine(inf, criteresConernes) !== ORIGINES_RESSENTI.TRAIT)
    .map((inf) => ({ critereId: inf.cibleId, valeur: clamp(inf.poids) }))
}

/**
 * Extrait les traits permanents (Axiome 6) : criteres de fond, issus des
 * influences d'origine TRAIT. Garantit un tableau non vide : si aucun trait
 * n'emerge, insere le critere moteur du filtre comme trait de fond.
 *
 * @param {import('../types/FiltreRelationnel.js').InfluenceActive[]} influencesOrdonnees
 * @param {string[]} criteresConernes
 * @param {import('../types/FiltreRelationnel.js').SyntheseFiltre} synthese
 * @returns {import('../types/Ressenti.js').EtatCritere[]}
 */
export function extraireTraitsPermanents(influencesOrdonnees, criteresConernes, synthese) {
  const traits = influencesOrdonnees
    .filter((inf) => determinerOrigine(inf, criteresConernes) === ORIGINES_RESSENTI.TRAIT)
    .map((inf) => ({ critereId: inf.cibleId, valeur: clamp(inf.poids) }))

  if (traits.length === 0) {
    return [{ critereId: synthese.critereMoteur, valeur: clamp(synthese.intensite) }]
  }

  return traits
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Valide la conformite minimale du FiltreRelationnel recu.
 *
 * @param {import('../types/FiltreRelationnel.js').FiltreRelationnel} filtreRelationnel
 * @returns {void}
 * @throws {InvalidFiltreRelationnelError}
 */
function validerFiltre(filtreRelationnel) {
  if (!filtreRelationnel || typeof filtreRelationnel !== 'object') {
    throw new InvalidFiltreRelationnelError('filtre absent')
  }
  if (!Array.isArray(filtreRelationnel.influences) || filtreRelationnel.influences.length === 0) {
    throw new InvalidFiltreRelationnelError('aucune influence active')
  }
  if (!filtreRelationnel.synthese || typeof filtreRelationnel.synthese !== 'object') {
    throw new InvalidFiltreRelationnelError('synthese absente')
  }
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * computeRessenti(evenement, filtreRelationnel)
 *
 * Calcule le ressenti du personnage pour ce tour.
 *
 * Le ressenti est produit apres les influences — il en est la synthese interpretee.
 * Il constitue la seule entree psychologique transmise a decision/.
 * FiltreRelationnel ne sera plus accessible apres ce module.
 *
 * Interface publique definitive (Sprint 23) :
 *   consomme exclusivement la sortie d'Influences (filtreRelationnel), plus
 *   l'evenement (uniquement pour classer l'origine des ressentis).
 *
 * @param {import('../types/Evenement.js').Evenement} evenement
 * @param {import('../types/FiltreRelationnel.js').FiltreRelationnel} filtreRelationnel
 *
 * @returns {import('../types/Ressenti.js').Ressenti}
 * @throws {InvalidFiltreRelationnelError}
 */
export function computeRessenti(evenement, filtreRelationnel) {
  validerFiltre(filtreRelationnel)

  const criteresConernes = evenement?.criteresConernes ?? []
  const synthese         = filtreRelationnel.synthese
  const influencesOrdonnees = ordonnerInfluences(filtreRelationnel.influences)

  return {
    dominants:        construireDominants(influencesOrdonnees, criteresConernes, synthese.critereMoteur),
    etatsTemporaires: extraireEtatsTemporaires(influencesOrdonnees, criteresConernes),
    traitsPermanents: extraireTraitsPermanents(influencesOrdonnees, criteresConernes, synthese),
  }
}
