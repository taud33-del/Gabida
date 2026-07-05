/**
 * decision/decision.test.js
 *
 * Tests du module Decision (Sprint 24).
 *
 * Verifie :
 *   - le respect strict du contrat types/Decision.js (identifiants stables,
 *     criteresActifs non vide, axiomesAppliques non vide, explication non vide) ;
 *   - la selection objectif / attitude / direction ;
 *   - la priorite relationnelle (Axiome 10) ;
 *   - le determinisme (meme entree -> meme sortie) ;
 *   - la purete (aucune mutation des entrees) ;
 *   - les erreurs typees (ressenti/fiches invalides).
 */

import {
  computeDecision,
  estRelationnel,
  ressentiRelationnelMarque,
  choisirObjectif,
  choisirDirection,
  construireCriteresActifs,
  construireAxiomesAppliques,
} from './index.js'
import { DecisionError, InvalidRessentiError, MissingFichesError } from './DecisionError.js'
import { INTENTIONS }            from '../constants/Intentions.js'
import { MOMENTS_NARRATIFS }     from '../constants/MomentsNarratifs.js'
import { OBJECTIFS }             from '../constants/Objectifs.js'
import { ATTITUDES }             from '../constants/Attitudes.js'
import { DIRECTIONS_NARRATIVES } from '../constants/DirectionsNarratives.js'
import { ORIGINES_RESSENTI }     from '../constants/OriginesRessenti.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function dominant(critereId, intensite, origine = ORIGINES_RESSENTI.EVENEMENT) {
  return { critereId, intensite, origine }
}

function ressentiDe(dominants, { temporaires = [], permanents = [{ critereId: 'personnalite', valeur: 0.5 }] } = {}) {
  return { dominants, etatsTemporaires: temporaires, traitsPermanents: permanents }
}

function evenementDe(intention, { moment = MOMENTS_NARRATIFS.OUVERTURE, criteres = ['emotions'] } = {}) {
  return { intention, criteresConernes: criteres, elementsImportants: [], contexte: { lieu: null, moment } }
}

const fiches = { personnage: { criteres: { personnalite: 0.6 } } }
const etat   = { sessionId: 's1', tourCourant: 1, memoireVecue: {}, historique: [], meta: {} }

const ressentiBase = ressentiDe([
  dominant('emotions', 0.8),
  dominant('valeurs', 0.4, ORIGINES_RESSENTI.TRAIT),
  dominant('personnalite', 0.2, ORIGINES_RESSENTI.TRAIT),
])

// ─── Helpers purs ───────────────────────────────────────────────────────────────

describe('estRelationnel', () => {
  test('reconnait la famille relationnelle', () => {
    expect(estRelationnel('relations')).toBe(true)
    expect(estRelationnel('relation.confiance')).toBe(true)
  })
  test('rejette les autres familles', () => {
    expect(estRelationnel('emotions')).toBe(false)
    expect(estRelationnel(undefined)).toBe(false)
  })
})

describe('ressentiRelationnelMarque', () => {
  test('vrai si un dominant relationnel depasse le seuil', () => {
    expect(ressentiRelationnelMarque([dominant('relations', 0.7)])).toBe(true)
  })
  test('faux si le dominant relationnel est faible', () => {
    expect(ressentiRelationnelMarque([dominant('relations', 0.2)])).toBe(false)
  })
})

// ─── choisirObjectif : priorite relationnelle ─────────────────────────────────────

describe('choisirObjectif (Axiome 10)', () => {
  test('question/demande sans relation -> REPONDRE_SOLLICITATION', () => {
    expect(choisirObjectif(INTENTIONS.QUESTION, ressentiBase.dominants)).toBe(OBJECTIFS.REPONDRE_SOLLICITATION)
  })

  test('ressenti relationnel marque -> RENFORCER_RELATION (priorite)', () => {
    const doms = [dominant('relations', 0.9), dominant('emotions', 0.4), dominant('valeurs', 0.1)]
    expect(choisirObjectif(INTENTIONS.QUESTION, doms)).toBe(OBJECTIFS.RENFORCER_RELATION)
  })

  test('provocation garde la protection meme avec relation marquee', () => {
    const doms = [dominant('relations', 0.9), dominant('emotions', 0.4), dominant('valeurs', 0.1)]
    expect(choisirObjectif(INTENTIONS.PROVOCATION, doms)).toBe(OBJECTIFS.PROTEGER_SOI)
  })

  test('silence -> MAINTENIR_POSITION', () => {
    expect(choisirObjectif(INTENTIONS.SILENCE, ressentiBase.dominants)).toBe(OBJECTIFS.MAINTENIR_POSITION)
  })
})

// ─── choisirDirection ─────────────────────────────────────────────────────────────

describe('choisirDirection', () => {
  test('mappe les moments narratifs', () => {
    expect(choisirDirection(MOMENTS_NARRATIFS.OUVERTURE, INTENTIONS.QUESTION)).toBe(DIRECTIONS_NARRATIVES.INVITER_JOUEUR)
    expect(choisirDirection(MOMENTS_NARRATIFS.TENSION, INTENTIONS.QUESTION)).toBe(DIRECTIONS_NARRATIVES.APAISER_TENSION)
    expect(choisirDirection(MOMENTS_NARRATIFS.RESOLUTION, INTENTIONS.QUESTION)).toBe(DIRECTIONS_NARRATIVES.CONCLURE_SITUATION)
  })

  test('silence force LAISSER_INITIATIVE quel que soit le moment', () => {
    expect(choisirDirection(MOMENTS_NARRATIFS.TENSION, INTENTIONS.SILENCE)).toBe(DIRECTIONS_NARRATIVES.LAISSER_INITIATIVE)
  })
})

// ─── construireCriteresActifs / axiomes ───────────────────────────────────────────

describe('construireCriteresActifs (Axiome 4)', () => {
  test('union dedupliquee et triee des dominants et criteres evenement', () => {
    const out = construireCriteresActifs(
      [dominant('emotions', 0.8), dominant('valeurs', 0.4), dominant('emotions', 0.1)],
      ['relations', 'emotions'],
    )
    expect(out).toEqual(['emotions', 'relations', 'valeurs'])
  })

  test('ignore les dominants d intensite nulle mais garantit non vide', () => {
    const out = construireCriteresActifs(
      [dominant('emotions', 0), dominant('valeurs', 0), dominant('personnalite', 0)],
      [],
    )
    expect(out).toEqual(['emotions']) // repli sur le dominant principal
  })
})

describe('construireAxiomesAppliques', () => {
  test('toujours 4, 10, 20 ; + 8 si traits permanents ; + 18 si tour > 1', () => {
    const out = construireAxiomesAppliques(ressentiBase, { tourCourant: 3 })
    expect(out).toEqual([4, 8, 10, 18, 20])
  })

  test('non vide au tour 1 sans traits permanents', () => {
    const out = construireAxiomesAppliques(ressentiDe(ressentiBase.dominants, { permanents: [] }), { tourCourant: 1 })
    expect(out).toEqual([4, 10, 20])
  })
})

// ─── computeDecision : contrat de sortie ─────────────────────────────────────────

describe('computeDecision : contrat types/Decision.js', () => {
  test('produit des identifiants stables valides', () => {
    const d = computeDecision(evenementDe(INTENTIONS.QUESTION), ressentiBase, fiches, etat)
    expect(Object.values(OBJECTIFS)).toContain(d.objectifImmediat)
    expect(Object.values(ATTITUDES)).toContain(d.attitude)
    expect(Object.values(DIRECTIONS_NARRATIVES)).toContain(d.directionNarrative)
  })

  test('justification complete : criteres/axiomes non vides, explication non vide', () => {
    const d = computeDecision(evenementDe(INTENTIONS.QUESTION), ressentiBase, fiches, etat)
    expect(d.justification.criteresActifs.length).toBeGreaterThan(0)
    expect(d.justification.axiomesAppliques.length).toBeGreaterThan(0)
    expect(d.justification.explication).not.toBe('')
  })

  test('provocation -> attitude defensive', () => {
    const d = computeDecision(evenementDe(INTENTIONS.PROVOCATION), ressentiBase, fiches, etat)
    expect(d.attitude).toBe(ATTITUDES.DEFENSIVE)
  })
})

// ─── Determinisme & purete ────────────────────────────────────────────────────────

describe('computeDecision : determinisme et purete', () => {
  test('meme entree -> meme sortie', () => {
    const f = () => computeDecision(evenementDe(INTENTIONS.CONFIDENCE), ressentiBase, fiches, etat)
    expect(f()).toEqual(f())
  })

  test('ne mute pas les entrees', () => {
    const ev = evenementDe(INTENTIONS.QUESTION)
    const r  = ressentiDe([dominant('emotions', 0.8), dominant('valeurs', 0.4), dominant('personnalite', 0.2)])
    const snapshotEv = JSON.parse(JSON.stringify(ev))
    const snapshotR  = JSON.parse(JSON.stringify(r))
    computeDecision(ev, r, fiches, etat)
    expect(ev).toEqual(snapshotEv)
    expect(r).toEqual(snapshotR)
  })
})

// ─── Erreurs typees ──────────────────────────────────────────────────────────────

describe('computeDecision : erreurs typees', () => {
  test('ressenti absent -> InvalidRessentiError', () => {
    expect(() => computeDecision(evenementDe(INTENTIONS.QUESTION), null, fiches, etat)).toThrow(InvalidRessentiError)
  })

  test('dominants de mauvaise longueur -> InvalidRessentiError', () => {
    const r = ressentiDe([dominant('emotions', 0.8)])
    expect(() => computeDecision(evenementDe(INTENTIONS.QUESTION), r, fiches, etat)).toThrow(InvalidRessentiError)
  })

  test('fiches absentes -> MissingFichesError', () => {
    expect(() => computeDecision(evenementDe(INTENTIONS.QUESTION), ressentiBase, null, etat)).toThrow(MissingFichesError)
  })

  test('les erreurs specifiques sont des DecisionError', () => {
    expect(new InvalidRessentiError('x')).toBeInstanceOf(DecisionError)
    expect(new MissingFichesError()).toBeInstanceOf(DecisionError)
  })
})
