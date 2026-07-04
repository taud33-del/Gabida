/**
 * influences/index.js
 *
 * Responsabilite unique : produire un FiltreRelationnel a partir d'un Evenement,
 * des fiches et de la memoire vecue.
 *
 * Role (source : Cycle valide v1.0 — etape 4) :
 *   - Appliquer les valeurs des criteres issus des fiches (source : CRITERE).
 *   - Appliquer les influences des souvenirs de la memoire vecue (source : SOUVENIR).
 *   - Appliquer les axiomes structurels de Gabida (source : AXIOME).
 *   - Fusionner l'ensemble en un filtre relationnel coherent.
 *
 * Ce module ne calcule jamais un ressenti.
 * Il ne prend jamais de decision.
 * Il ne modifie jamais la memoire.
 * Il ne construit jamais de prompt.
 *
 * Ordre dans le cycle : Analyse -> Influences -> Ressenti -> Decision
 *
 * Axiome 2 : Toute valeur influence le comportement. Une valeur n'est jamais decorative.
 * Axiome 3 : Les influences sont cumulatives. Elles ne s'annulent pas.
 * Axiome 4 : Aucune decision ne repose sur un seul critere.
 * Axiome 9 : Les souvenirs importants priment sur les souvenirs mineurs.
 * Axiome 19 : Toute evolution doit etre explicable.
 */

import { SOURCES_INFLUENCE } from '../constants/SourcesInfluence.js'
import { TONALITES_FILTRE }  from '../constants/TonalitesFiltre.js'
import { TYPES_SOUVENIR }    from '../constants/TypesSouvenir.js'

// -----------------------------------------------------------------------------
// ContexteInfluence
// -----------------------------------------------------------------------------

/**
 * @typedef {object} ContexteInfluence
 *
 * Objet unique transmis a toutes les sous-fonctions internes du module.
 * Construit une seule fois dans computeInfluences.
 * Considere comme immuable : aucune sous-fonction ne le modifie.
 *
 * @property {import('../types/Evenement.js').Evenement} evenement
 *   Evenement produit par le module analyse pour ce tour.
 *
 * @property {object} fiches
 *   Les 5 fiches validees issues de lecture.loadFiches.
 *
 * @property {import('../types/Etat.js').Etat} etat
 *   Etat courant de la session, contient la memoire vecue.
 *
 * @property {object[]} souvenirs
 *   Raccourci vers etat.memoireVecue.souvenirs (tableau, jamais null).
 */

// -----------------------------------------------------------------------------
// Correspondance intention -> types de souvenir pertinents
// -----------------------------------------------------------------------------

/**
 * Pour chaque intention d'un evenement, indique quels types de souvenir
 * sont susceptibles d'avoir un impact relationnel ce tour.
 *
 * Logique : un souvenir "promesse" pese davantage si l'evenement est une DEMANDE ;
 * un souvenir "mensonge" pese davantage si l'evenement est une PROVOCATION, etc.
 *
 * @type {Record<string, string[]>}
 */
const SOUVENIRS_PAR_INTENTION = {
  question:     [TYPES_SOUVENIR.DIALOGUE, TYPES_SOUVENIR.DECISION],
  confidence:   [TYPES_SOUVENIR.DIALOGUE, TYPES_SOUVENIR.PROMESSE, TYPES_SOUVENIR.MENSONGE],
  provocation:  [TYPES_SOUVENIR.MENSONGE, TYPES_SOUVENIR.DECISION, TYPES_SOUVENIR.EVENEMENT],
  demande:      [TYPES_SOUVENIR.PROMESSE, TYPES_SOUVENIR.DECISION, TYPES_SOUVENIR.DIALOGUE],
  observation:  [TYPES_SOUVENIR.EVENEMENT, TYPES_SOUVENIR.DIALOGUE],
  silence:      [TYPES_SOUVENIR.EVENEMENT],
}

// -----------------------------------------------------------------------------
// Seuils de tonalite
// -----------------------------------------------------------------------------

/**
 * Seuils de la moyenne ponderee des poids pour determiner la tonalite.
 * La moyenne est calculee sur l'ensemble des influences actives du tour.
 *
 *   >= 0.70  -> OUVERTE   (forte disposition positive)
 *   >= 0.45  -> NEUTRE    (equilibre, pas de signal fort)
 *   >= 0.25  -> FERMEE    (retrait, mefiance)
 *   <  0.25  -> HOSTILE   (opposition active)
 */
const SEUIL_OUVERTE  = 0.70
const SEUIL_NEUTRE   = 0.45
const SEUIL_FERMEE   = 0.25

// -----------------------------------------------------------------------------
// Sous-fonctions (recoivent toutes ContexteInfluence)
// -----------------------------------------------------------------------------

/**
 * collecerInfluencesCriteres(ctx)
 *
 * Produit une InfluenceActive pour chaque critere de la fiche personnage
 * mentionne dans evenement.criteresConernes.
 *
 * Le poids est lu directement sur la fiche (critere.valeur).
 * Si la fiche ne contient pas de valeur pour un critere, le poids est 0.5
 * (valeur neutre, Axiome 2 : toute valeur compte).
 *
 * @param {ContexteInfluence} ctx
 * @returns {import('../types/FiltreRelationnel.js').InfluenceActive[]}
 */
export function collecterInfluencesCriteres(ctx) {
  const criteres = ctx.fiches.personnage?.criteres ?? {}
  return ctx.evenement.criteresConernes.map((critereId) => {
    const poids = typeof criteres[critereId] === 'number'
      ? clamp(criteres[critereId])
      : 0.5
    return {
      source:   SOURCES_INFLUENCE.CRITERE,
      cibleId:  critereId,
      poids,
      raison:   `Critere "${critereId}" concerne par l'evenement (Axiome 2).`,
    }
  })
}

/**
 * collecterInfluencesSouvenirs(ctx)
 *
 * Produit une InfluenceActive pour chaque souvenir de la memoire vecue
 * dont le type est pertinent pour l'intention de l'evenement (Axiome 9).
 *
 * Le poids est egal a souvenir.importance.
 * Les souvenirs sans type pertinent ne generent pas d'influence ce tour.
 *
 * @param {ContexteInfluence} ctx
 * @returns {import('../types/FiltreRelationnel.js').InfluenceActive[]}
 */
export function collecterInfluencesSouvenirs(ctx) {
  const typesPertinents = SOUVENIRS_PAR_INTENTION[ctx.evenement.intention] ?? []
  if (typesPertinents.length === 0) return []

  return ctx.souvenirs
    .filter((s) => typesPertinents.includes(s.type))
    .map((s) => ({
      source:  SOURCES_INFLUENCE.SOUVENIR,
      cibleId: `souvenir.${s.type}`,
      poids:   clamp(s.importance),
      raison:  `Souvenir de type "${s.type}" actif ce tour (importance ${s.importance.toFixed(2)}, Axiome 9).`,
    }))
}

/**
 * collecterInfluencesAxiomes(ctx)
 *
 * Produit les influences structurelles issues des axiomes de Gabida.
 *
 * Axiome 3 (accumulation) : si plusieurs criteres sont concernes, une influence
 * supplementaire est ajoutee pour materialiser leur effet cumulatif.
 *
 * Axiome 4 (pluralite) : si un seul critere est concerne, une influence de
 * plancher est ajoutee pour garantir qu'au moins deux criteres pesent.
 *
 * Ces influences ne remplacent jamais les autres — elles s'y ajoutent.
 *
 * @param {ContexteInfluence} ctx
 * @returns {import('../types/FiltreRelationnel.js').InfluenceActive[]}
 */
export function collecterInfluencesAxiomes(ctx) {
  const influences = []
  const nbCriteres = ctx.evenement.criteresConernes.length

  if (nbCriteres >= 2) {
    influences.push({
      source:  SOURCES_INFLUENCE.AXIOME,
      cibleId: 'accumulation',
      poids:   clamp(0.1 * Math.min(nbCriteres, 5)),
      raison:  `${nbCriteres} criteres actifs ce tour — effet cumulatif (Axiome 3).`,
    })
  }

  if (nbCriteres === 1) {
    influences.push({
      source:  SOURCES_INFLUENCE.AXIOME,
      cibleId: 'pluralite',
      poids:   0.3,
      raison:  `Un seul critere actif — influence de plancher pour respecter Axiome 4.`,
    })
  }

  return influences
}

/**
 * fusionnerInfluences(toutes)
 *
 * Ordonne toutes les influences par poids decroissant.
 * Garantit que le tableau retourne n'est jamais vide :
 * si aucune influence n'a ete produite, une influence neutre de plancher est inseree.
 *
 * @param {import('../types/FiltreRelationnel.js').InfluenceActive[]} toutes
 * @returns {import('../types/FiltreRelationnel.js').InfluenceActive[]}
 */
export function fusionnerInfluences(toutes) {
  if (toutes.length === 0) {
    return [{
      source:  SOURCES_INFLUENCE.AXIOME,
      cibleId: 'neutre',
      poids:   0.5,
      raison:  'Aucune influence detectee — filtre neutre par defaut (Axiome 2).',
    }]
  }
  return [...toutes].sort((a, b) => b.poids - a.poids)
}

/**
 * calculerSynthese(influencesOrdonnees)
 *
 * Calcule la SyntheseFiltre a partir de la liste d'influences ordonnees.
 *
 * - critereMoteur : cibleId de l'influence avec le poids le plus eleve.
 * - intensite     : moyenne simple des poids (valeur entre 0 et 1).
 * - tonalite      : deduite de l'intensite selon les seuils declares.
 *
 * @param {import('../types/FiltreRelationnel.js').InfluenceActive[]} influencesOrdonnees
 * @returns {import('../types/FiltreRelationnel.js').SyntheseFiltre}
 */
export function calculerSynthese(influencesOrdonnees) {
  const critereMoteur = influencesOrdonnees[0].cibleId

  const intensite = clamp(
    influencesOrdonnees.reduce((sum, i) => sum + i.poids, 0) / influencesOrdonnees.length
  )

  const tonalite = intensite >= SEUIL_OUVERTE  ? TONALITES_FILTRE.OUVERTE
                 : intensite >= SEUIL_NEUTRE   ? TONALITES_FILTRE.NEUTRE
                 : intensite >= SEUIL_FERMEE   ? TONALITES_FILTRE.FERMEE
                 :                               TONALITES_FILTRE.HOSTILE

  return { tonalite, intensite, critereMoteur }
}

// -----------------------------------------------------------------------------
// Utilitaire
// -----------------------------------------------------------------------------

/**
 * Borne une valeur entre 0 et 1 inclus.
 *
 * @param {number} v
 * @returns {number}
 */
function clamp(v) {
  return Math.min(1, Math.max(0, v))
}

// -----------------------------------------------------------------------------
// Interface publique
// -----------------------------------------------------------------------------

/**
 * computeInfluences(evenement, fiches, etat)
 *
 * Fusionne toutes les influences actives de ce tour et produit un FiltreRelationnel.
 *
 * Construit le contexteInfluence interne, collecte les trois categories d'influences
 * (criteres, souvenirs, axiomes), les fusionne et calcule la synthese.
 *
 * Interface publique stable -- ne change pas.
 *
 * @param {import('../types/Evenement.js').Evenement} evenement
 * @param {object} fiches -- Les 5 fiches validees (issues de lecture.loadFiches).
 * @param {import('../types/Etat.js').Etat} etat
 *
 * @returns {import('../types/FiltreRelationnel.js').FiltreRelationnel}
 */
export function computeInfluences(evenement, fiches, etat) {
  const ctx = {
    evenement,
    fiches,
    etat,
    souvenirs: etat.memoireVecue?.souvenirs ?? [],
  }

  const brutes = [
    ...collecterInfluencesCriteres(ctx),
    ...collecterInfluencesSouvenirs(ctx),
    ...collecterInfluencesAxiomes(ctx),
  ]

  const influences = fusionnerInfluences(brutes)
  const synthese   = calculerSynthese(influences)

  return { influences, synthese }
}