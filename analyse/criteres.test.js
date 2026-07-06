/**
 * analyse/criteres.test.js
 *
 * Ancrage de l'identification des criteres dans la fiche personnage (Axiome 11) :
 * Analyse n'attribue que des criteres reellement definis par la fiche, tout en
 * conservant le comportement historique quand la fiche n'expose pas de chapitres.
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  normaliserTexte,
  identifierCriteresConcernes,
  criteresDefinisParFiche,
  analyzeEvent,
} from './index.js'
import { chargerReference } from '../lecture/reference.js'
import { loadFiches } from '../lecture/index.js'

const CAS_REFERENCE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'reference',
  'Léa Martin',
)

function makeCtx(texte, criteresDisponibles) {
  return {
    playerMessage: { texte, tour: 1, sessionId: 'test', timestamp: 0 },
    texteOriginal: texte,
    texteNormalise: normaliserTexte(texte),
    fiches: {},
    ...(criteresDisponibles ? { criteresDisponibles } : {}),
    etat: { tourCourant: 1, meta: {} },
  }
}

describe('criteresDefinisParFiche', () => {
  test('deduit les criteres depuis les titres de chapitres (accents ignores)', () => {
    const personnage = {
      chapitres: [
        { titre: 'Identité' },
        { titre: 'Communication' },
        { titre: 'Émotions' },
        { titre: 'Décision' },
        { titre: 'Particularités' },
      ],
    }
    expect(criteresDefinisParFiche(personnage)).toEqual([
      'communication',
      'emotions',
      'decision',
    ])
  })

  test('retourne un tableau vide si la fiche n’expose aucun chapitre', () => {
    expect(criteresDefinisParFiche({})).toEqual([])
    expect(criteresDefinisParFiche(null)).toEqual([])
  })
})

describe('identifierCriteresConcernes — ancrage fiche', () => {
  test('sans criteres disponibles : comportement historique (tous les patterns)', () => {
    const res = identifierCriteresConcernes(makeCtx("j'ai peur de trahir ma famille"))
    expect(res).toEqual(expect.arrayContaining(['emotions', 'relations']))
  })

  test('restreint aux criteres definis par la fiche', () => {
    const res = identifierCriteresConcernes(
      makeCtx("j'ai peur de trahir ma famille", ['communication', 'emotions']),
    )
    expect(res).toContain('emotions')
    expect(res).not.toContain('relations')
  })

  test('defaut : au moins un critere, meme restreint', () => {
    const res = identifierCriteresConcernes(makeCtx('zzz qqq', ['communication', 'emotions']))
    expect(res).toEqual(['communication'])
  })
})

describe('analyzeEvent — cas de reference Léa Martin', () => {
  test('les criteres concernes sont un sous-ensemble des criteres definis par la fiche', () => {
    const fiches = loadFiches(chargerReference(CAS_REFERENCE))
    const disponibles = criteresDefinisParFiche(fiches.personnage)
    const pm = { texte: "j'ai peur de trahir ma famille", tour: 1, sessionId: 's', timestamp: 0 }
    const evt = analyzeEvent(pm, fiches, { tourCourant: 1, meta: {}, historique: [] })
    for (const critere of evt.criteresConernes) {
      expect(disponibles).toContain(critere)
    }
    expect(evt.criteresConernes).toEqual(expect.arrayContaining(['emotions', 'relations']))
  })
})
