/**
 * decision/index.js
 *
 * Responsabilite unique : determiner la decision du personnage pour ce tour.
 *
 * Role (source : Cycle valide v1.0 — etape 6) :
 *   - Repondre a la question : "Que dois-je faire ?"
 *   - Choisir l'objectif immediat du personnage.
 *   - Choisir son attitude pour ce tour.
 *   - Determiner la direction narrative.
 *
 * Ordre dans le cycle : Analyse -> Influences -> Ressenti -> Decision
 *
 * La decision depend uniquement de :
 *   - L'identite du personnage (fiches).
 *   - L'evenement vecu (Evenement).
 *   - Le ressenti calcule (Ressenti) — seule entree psychologique autorisee.
 *   - L'etat courant de la session.
 *
 * FiltreRelationnel n'est PAS une entree de ce module.
 * Les influences sont absorbees par ressenti/ avant d'atteindre decision/.
 *
 * Ce module ne produit QUE des identifiants stables (constants/), jamais du
 * langage naturel : la mise en langage appartient exclusivement a prompt/.
 *
 * Module metier PUR :
 *   - aucune dependance sur core/, le Runtime ou le Context ;
 *   - aucune IA, aucun provider, aucun reseau ;
 *   - aucun effet de bord (pas de Date, pas de random, pas d'I/O) ;
 *   - deterministe : une meme entree produit toujours la meme sortie.
 *
 * Axiome 4  : Aucune decision ne repose sur un seul critere.
 * Axiome 10 : La relation est toujours prioritaire.
 * Axiome 18 : La coherence est plus importante que la variete.
 * Axiome 20 : Chaque reponse est le resultat d'un calcul, jamais du hasard.
 */

import { INTENTIONS }            from '../constants/Intentions.js'
import { MOMENTS_NARRATIFS }     from '../constants/MomentsNarratifs.js'
import { OBJECTIFS }             from '../constants/Objectifs.js'
import { ATTITUDES }             from '../constants/Attitudes.js'
import { DIRECTIONS_NARRATIVES } from '../constants/DirectionsNarratives.js'
import { DecisionError, InvalidRessentiError, MissingFichesError } from './DecisionError.js'

// ─── Constantes locales ─────────────────────────────────────────────────────

const NB_DOMINANTS = 3

/** Prefixe identifiant la famille relationnelle d'un critere (Axiome 10). */
const PREFIXE_RELATION = 'relation'

/** Seuil au-dela duquel un ressenti est considere comme marque. */
const SEUIL_INTENSITE = 0.5

// ─── Helpers purs ─────────────────────────────────────────────────────────────

/**
 * Indique si un critere appartient a la famille relationnelle.
 * Couvre 'relations' (chapitre fiche) et les identifiants pointes 'relation.*'.
 *
 * @param {string} critereId
 * @returns {boolean}
 */
export function estRelationnel(critereId) {
  return typeof critereId === 'string' && critereId.startsWith(PREFIXE_RELATION)
}

/**
 * Detecte un ressenti relationnel marque parmi les dominants (Axiome 10).
 *
 * @param {import('../types/Ressenti.js').RessentDominant[]} dominants
 * @returns {boolean}
 */
export function ressentiRelationnelMarque(dominants) {
  return dominants.some((d) => d.intensite >= SEUIL_INTENSITE && estRelationnel(d.critereId))
}

/**
 * Choisit l'objectif immediat a partir de l'intention et du ressenti.
 * Applique la priorite relationnelle (Axiome 10).
 *
 * @param {string} intention
 * @param {import('../types/Ressenti.js').RessentDominant[]} dominants
 * @returns {string} -- une valeur de OBJECTIFS
 */
export function choisirObjectif(intention, dominants) {
  let base
  switch (intention) {
    case INTENTIONS.QUESTION:
    case INTENTIONS.DEMANDE:      base = OBJECTIFS.REPONDRE_SOLLICITATION; break
    case INTENTIONS.CONFIDENCE:   base = OBJECTIFS.RENFORCER_RELATION;     break
    case INTENTIONS.PROVOCATION:  base = OBJECTIFS.PROTEGER_SOI;           break
    case INTENTIONS.OBSERVATION:  base = OBJECTIFS.FAIRE_AVANCER;          break
    case INTENTIONS.SILENCE:      base = OBJECTIFS.MAINTENIR_POSITION;     break
    default:                      base = OBJECTIFS.MAINTENIR_POSITION;     break
  }

  // Axiome 10 : la relation est prioritaire. Un ressenti relationnel marque
  // oriente vers le renforcement du lien — sauf face a une provocation, ou la
  // protection reste prioritaire.
  if (ressentiRelationnelMarque(dominants) && intention !== INTENTIONS.PROVOCATION) {
    return OBJECTIFS.RENFORCER_RELATION
  }

  return base
}

/**
 * Choisit l'attitude a partir de l'intention et de l'intensite du dominant principal.
 *
 * @param {string} intention
 * @param {import('../types/Ressenti.js').RessentDominant} principal
 * @returns {string} -- une valeur de ATTITUDES
 */
export function choisirAttitude(intention, principal) {
  if (intention === INTENTIONS.PROVOCATION) return ATTITUDES.DEFENSIVE
  if (intention === INTENTIONS.SILENCE)     return ATTITUDES.RESERVEE
  if (intention === INTENTIONS.CONFIDENCE)  return ATTITUDES.OUVERTE

  // Intentions restantes (QUESTION, DEMANDE, OBSERVATION) : module par l'intensite.
  if (principal.intensite >= SEUIL_INTENSITE) return ATTITUDES.OUVERTE
  return ATTITUDES.NEUTRE
}

/**
 * Choisit la direction narrative a partir du moment narratif et de l'intention.
 *
 * @param {string} moment
 * @param {string} intention
 * @returns {string} -- une valeur de DIRECTIONS_NARRATIVES
 */
export function choisirDirection(moment, intention) {
  if (intention === INTENTIONS.SILENCE) return DIRECTIONS_NARRATIVES.LAISSER_INITIATIVE

  switch (moment) {
    case MOMENTS_NARRATIFS.OUVERTURE:     return DIRECTIONS_NARRATIVES.INVITER_JOUEUR
    case MOMENTS_NARRATIFS.DEVELOPPEMENT: return DIRECTIONS_NARRATIVES.APPROFONDIR_LIEN
    case MOMENTS_NARRATIFS.TENSION:       return DIRECTIONS_NARRATIVES.APAISER_TENSION
    case MOMENTS_NARRATIFS.RESOLUTION:    return DIRECTIONS_NARRATIVES.CONCLURE_SITUATION
    case MOMENTS_NARRATIFS.EPILOGUE:      return DIRECTIONS_NARRATIVES.CONCLURE_SITUATION
    default:                              return DIRECTIONS_NARRATIVES.INVITER_JOUEUR
  }
}

/**
 * Construit la liste des criteres actifs (Axiome 4).
 * Union des criteres dominants (intensite > 0) et des criteres concernes par
 * l'evenement, dedupliquee et triee (determinisme). Garantie non vide.
 *
 * @param {import('../types/Ressenti.js').RessentDominant[]} dominants
 * @param {string[]} criteresConernes
 * @returns {string[]}
 */
export function construireCriteresActifs(dominants, criteresConernes) {
  const actifs = new Set()
  for (const d of dominants) {
    if (d.intensite > 0) actifs.add(d.critereId)
  }
  for (const c of criteresConernes) actifs.add(c)

  // Repli : au moins le critere du dominant principal (Axiome 4).
  if (actifs.size === 0) actifs.add(dominants[0].critereId)

  return [...actifs].sort()
}

/**
 * Determine les axiomes appliques ce tour (Axiome 19). Toujours non vide.
 *
 * @param {import('../types/Ressenti.js').Ressenti} ressenti
 * @param {import('../types/Etat.js').Etat} etat
 * @returns {number[]}
 */
export function construireAxiomesAppliques(ressenti, etat) {
  const axiomes = new Set([4, 10, 20]) // multi-criteres, relation prioritaire, calcul non aleatoire

  // Axiome 8 : la personnalite (traits permanents) n'est jamais effacee par l'emotion.
  if (Array.isArray(ressenti.traitsPermanents) && ressenti.traitsPermanents.length > 0) {
    axiomes.add(8)
  }
  // Axiome 18 : coherence inter-tours des lors qu'un historique existe.
  if (etat && typeof etat.tourCourant === 'number' && etat.tourCourant > 1) {
    axiomes.add(18)
  }

  return [...axiomes].sort((a, b) => a - b)
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * @param {import('../types/Ressenti.js').Ressenti} ressenti
 * @returns {void}
 * @throws {InvalidRessentiError}
 */
function validerRessenti(ressenti) {
  if (!ressenti || typeof ressenti !== 'object') {
    throw new InvalidRessentiError('ressenti absent')
  }
  if (!Array.isArray(ressenti.dominants) || ressenti.dominants.length !== NB_DOMINANTS) {
    throw new InvalidRessentiError(`dominants doit contenir exactement ${NB_DOMINANTS} elements`)
  }
}

/**
 * @param {object} fiches
 * @returns {void}
 * @throws {MissingFichesError}
 */
function validerFiches(fiches) {
  if (!fiches || typeof fiches !== 'object') {
    throw new MissingFichesError()
  }
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * computeDecision(evenement, ressenti, fiches, etat)
 *
 * Determine la decision du personnage pour ce tour.
 * Repond a la question : "Que dois-je faire ?"
 * Retourne l'objectif immediat, l'attitude et la direction narrative choisie,
 * accompagnes de leur justification complete (Axiome 19).
 *
 * Toutes les valeurs narratives sont des IDENTIFIANTS stables (constants/),
 * jamais du langage naturel. La justification.explication est une trace d'audit.
 *
 * @param {import('../types/Evenement.js').Evenement} evenement
 * @param {import('../types/Ressenti.js').Ressenti} ressenti
 * @param {object} fiches -- Les 5 fiches validees (issues de lecture.loadFiches).
 * @param {import('../types/Etat.js').Etat} etat
 *
 * @returns {import('../types/Decision.js').Decision}
 * @throws {InvalidRessentiError|MissingFichesError}
 */
export function computeDecision(evenement, ressenti, fiches, etat) {
  validerRessenti(ressenti)
  validerFiches(fiches)

  const intention        = evenement?.intention
  const moment           = evenement?.contexte?.moment
  const criteresConernes = evenement?.criteresConernes ?? []
  const dominants        = ressenti.dominants
  const principal        = dominants[0]

  const objectifImmediat   = choisirObjectif(intention, dominants)
  const attitude           = choisirAttitude(intention, principal)
  const directionNarrative = choisirDirection(moment, intention)

  const criteresActifs   = construireCriteresActifs(dominants, criteresConernes)
  const axiomesAppliques = construireAxiomesAppliques(ressenti, etat)

  const explication =
    `Objectif "${objectifImmediat}", attitude "${attitude}", direction "${directionNarrative}" ` +
    `retenus a partir des criteres [${criteresActifs.join(', ')}] ` +
    `sous les axiomes ${axiomesAppliques.join(', ')}.`

  return {
    objectifImmediat,
    attitude,
    directionNarrative,
    justification: {
      criteresActifs,
      axiomesAppliques,
      explication,
    },
  }
}

export { DecisionError, InvalidRessentiError, MissingFichesError }
