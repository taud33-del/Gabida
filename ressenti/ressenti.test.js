/**
 * ressenti/ressenti.test.js
 *
 * Tests du module Ressenti (Sprint 23).
 *
 * Verifie :
 *   - le respect strict du contrat types/Ressenti.js (dominants length 3,
 *     traitsPermanents non vide, valeurs bornees) ;
 *   - la classification d'origine EVENEMENT / INFLUENCE / TRAIT ;
 *   - la derivation des etats temporaires / traits permanents ;
 *   - le determinisme (meme entree -> meme sortie, tie-break stable) ;
 *   - les erreurs typees sur filtre invalide ;
 *   - la purete (aucune mutation des entrees).
 */

import {
  computeRessenti,
  determinerOrigine,
  ordonnerInfluences,
} from './index.js'
import { RessentiError, InvalidFiltreRelationnelError } from './RessentiError.js'
import { SOURCES_INFLUENCE } from '../constants/SourcesInfluence.js'
import { ORIGINES_RESSENTI } from '../constants/OriginesRessenti.js'
import { TONALITES_FILTRE } from '../constants/TonalitesFiltre.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function influence(cibleId, poids, source = SOURCES_INFLUENCE.CRITERE) {
  return { source, cibleId, poids, raison: `raison ${cibleId}` }
}

function filtre(influences, critereMoteur, intensite = 0.6) {
  return {
    influences,
    synthese: { tonalite: TONALITES_FILTRE.NEUTRE, intensite, critereMoteur },
  }
}

const evenement = {
  intention: 'question',
  criteresConernes: ['emotions'],
  elementsImportants: [],
  contexte: { lieu: null, moment: 'ouverture' },
}

// ─── determinerOrigine ──────────────────────────────────────────────────────────

describe('determinerOrigine', () => {
  test('CRITERE + cible dans l evenement -> EVENEMENT', () => {
    expect(determinerOrigine(influence('emotions', 0.8), ['emotions']))
      .toBe(ORIGINES_RESSENTI.EVENEMENT)
  })

  test('CRITERE + cible hors evenement -> TRAIT', () => {
    expect(determinerOrigine(influence('valeurs', 0.8), ['emotions']))
      .toBe(ORIGINES_RESSENTI.TRAIT)
  })

  test('SOUVENIR -> INFLUENCE', () => {
    expect(determinerOrigine(influence('souvenir.promesse', 0.5, SOURCES_INFLUENCE.SOUVENIR), ['emotions']))
      .toBe(ORIGINES_RESSENTI.INFLUENCE)
  })

  test('AXIOME -> INFLUENCE', () => {
    expect(determinerOrigine(influence('accumulation', 0.3, SOURCES_INFLUENCE.AXIOME), ['emotions']))
      .toBe(ORIGINES_RESSENTI.INFLUENCE)
  })
})

// ─── ordonnerInfluences ─────────────────────────────────────────────────────────

describe('ordonnerInfluences', () => {
  test('trie par poids decroissant', () => {
    const out = ordonnerInfluences([influence('a', 0.2), influence('b', 0.9), influence('c', 0.5)])
    expect(out.map(i => i.cibleId)).toEqual(['b', 'c', 'a'])
  })

  test('tie-break alphabetique deterministe sur cibleId', () => {
    const out = ordonnerInfluences([influence('zeta', 0.5), influence('alpha', 0.5)])
    expect(out.map(i => i.cibleId)).toEqual(['alpha', 'zeta'])
  })

  test('ne mute pas le tableau recu', () => {
    const src = [influence('a', 0.2), influence('b', 0.9)]
    ordonnerInfluences(src)
    expect(src.map(i => i.cibleId)).toEqual(['a', 'b'])
  })
})

// ─── computeRessenti : contrat de sortie ─────────────────────────────────────────

describe('computeRessenti : contrat types/Ressenti.js', () => {
  test('dominants a toujours exactement 3 elements, tries par intensite decroissante', () => {
    const r = computeRessenti(evenement, filtre(
      [influence('emotions', 0.9), influence('valeurs', 0.6), influence('relations', 0.3), influence('histoire', 0.1)],
      'emotions',
    ))
    expect(r.dominants).toHaveLength(3)
    expect(r.dominants.map(d => d.intensite)).toEqual([0.9, 0.6, 0.3])
  })

  test('pad avec intensite 0 (origine TRAIT) si moins de 3 influences', () => {
    const r = computeRessenti(evenement, filtre([influence('emotions', 0.9)], 'emotions'))
    expect(r.dominants).toHaveLength(3)
    expect(r.dominants[1]).toEqual({ critereId: 'emotions', intensite: 0, origine: ORIGINES_RESSENTI.TRAIT })
    expect(r.dominants[2].intensite).toBe(0)
  })

  test('traitsPermanents n est jamais vide (repli sur critereMoteur)', () => {
    // Toutes les influences sont situationnelles (dans l evenement) -> aucun TRAIT naturel
    const r = computeRessenti(
      { ...evenement, criteresConernes: ['emotions', 'relations'] },
      filtre([influence('emotions', 0.8), influence('relations', 0.7)], 'emotions', 0.75),
    )
    expect(r.traitsPermanents.length).toBeGreaterThanOrEqual(1)
    expect(r.traitsPermanents[0]).toEqual({ critereId: 'emotions', valeur: 0.75 })
  })

  test('etatsTemporaires contient les influences situationnelles (EVENEMENT/INFLUENCE)', () => {
    const r = computeRessenti(evenement, filtre(
      [influence('emotions', 0.8), influence('souvenir.promesse', 0.5, SOURCES_INFLUENCE.SOUVENIR), influence('valeurs', 0.4)],
      'emotions',
    ))
    const ids = r.etatsTemporaires.map(e => e.critereId)
    expect(ids).toContain('emotions')          // EVENEMENT
    expect(ids).toContain('souvenir.promesse') // INFLUENCE
    expect(ids).not.toContain('valeurs')       // TRAIT
  })

  test('classifie correctement l origine des dominants', () => {
    const r = computeRessenti(evenement, filtre(
      [influence('emotions', 0.9), influence('valeurs', 0.6), influence('accumulation', 0.5, SOURCES_INFLUENCE.AXIOME)],
      'emotions',
    ))
    expect(r.dominants[0].origine).toBe(ORIGINES_RESSENTI.EVENEMENT) // emotions dans l evenement
    expect(r.dominants[1].origine).toBe(ORIGINES_RESSENTI.TRAIT)     // valeurs hors evenement
    expect(r.dominants[2].origine).toBe(ORIGINES_RESSENTI.INFLUENCE) // axiome
  })
})

// ─── Determinisme ────────────────────────────────────────────────────────────────

describe('computeRessenti : determinisme', () => {
  test('meme entree -> meme sortie', () => {
    const f = () => computeRessenti(evenement, filtre(
      [influence('emotions', 0.9), influence('valeurs', 0.6), influence('relations', 0.6)],
      'emotions',
    ))
    expect(f()).toEqual(f())
  })

  test('ne mute pas le filtre recu', () => {
    const inf = [influence('a', 0.2), influence('b', 0.9)]
    const original = JSON.parse(JSON.stringify(inf))
    computeRessenti(evenement, filtre(inf, 'a'))
    expect(inf).toEqual(original)
  })
})

// ─── Erreurs typees ──────────────────────────────────────────────────────────────

describe('computeRessenti : erreurs typees', () => {
  test('filtre absent -> InvalidFiltreRelationnelError', () => {
    expect(() => computeRessenti(evenement, null)).toThrow(InvalidFiltreRelationnelError)
  })

  test('influences vide -> InvalidFiltreRelationnelError', () => {
    expect(() => computeRessenti(evenement, { influences: [], synthese: {} }))
      .toThrow(InvalidFiltreRelationnelError)
  })

  test('synthese absente -> InvalidFiltreRelationnelError', () => {
    expect(() => computeRessenti(evenement, { influences: [influence('a', 0.5)] }))
      .toThrow(InvalidFiltreRelationnelError)
  })

  test('InvalidFiltreRelationnelError est une RessentiError', () => {
    expect(new InvalidFiltreRelationnelError('x')).toBeInstanceOf(RessentiError)
  })
})
