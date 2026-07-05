/**
 * lecture/lecture.test.js
 *
 * Tests unitaires du module lecture/ (chargement + validation des fiches).
 *
 * Couverture :
 *   - validateFiche : types valides/invalides, objet requis, retour inchangé
 *   - loadFiches    : 5 fiches → objet fiches ; sources/fiches absentes ou invalides
 *   - immutabilité  : les données reçues ne sont jamais mutées
 *   - erreurs typées + chaîne d'héritage
 *   - compatibilité : l'objet retourné satisfait les préconditions de core.preparerTour
 */

import { loadFiches, validateFiche, TYPES_FICHE } from './index.js'
import {
  LectureError,
  SourcesInvalidesError,
  FicheManquanteError,
  TypeFicheInvalideError,
  FicheInvalideError,
} from './LectureError.js'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function fabriqueSources(overrides = {}) {
  return {
    personnage: { nom: 'Aldric', criteres: {} },
    aventure  : { dureeEstimee: 20, lieuDepart: 'Taverne' },
    univers   : { nom: 'Eldoria' },
    joueur    : { role: 'Voyageur' },
    memoire   : { permanente: [] },
    ...overrides,
  }
}

// ─── validateFiche ───────────────────────────────────────────────────────────

describe('validateFiche', () => {
  test('accepte chacun des 5 types avec un objet', () => {
    for (const type of TYPES_FICHE) {
      expect(validateFiche(type, { ok: true })).toEqual({ ok: true })
    }
  })

  test('retourne la fiche inchangée (même référence)', () => {
    const data = { nom: 'Aldric' }
    expect(validateFiche('personnage', data)).toBe(data)
  })

  test('TypeFicheInvalideError si type inconnu', () => {
    expect(() => validateFiche('inconnu', {})).toThrow(TypeFicheInvalideError)
  })

  test('FicheInvalideError si data null', () => {
    expect(() => validateFiche('personnage', null)).toThrow(FicheInvalideError)
  })

  test('FicheInvalideError si data est un tableau', () => {
    expect(() => validateFiche('personnage', [])).toThrow(FicheInvalideError)
  })

  test('FicheInvalideError si data est une primitive', () => {
    expect(() => validateFiche('univers', 'texte')).toThrow(FicheInvalideError)
  })
})

// ─── loadFiches ──────────────────────────────────────────────────────────────

describe('loadFiches', () => {
  test('retourne les 5 fiches validées', () => {
    const fiches = loadFiches(fabriqueSources())
    for (const type of TYPES_FICHE) {
      expect(fiches[type]).toBeDefined()
    }
  })

  test('objet retourné compatible avec core.preparerTour (5 clés présentes)', () => {
    const fiches = loadFiches(fabriqueSources())
    const cles = ['personnage', 'aventure', 'univers', 'joueur', 'memoire']
    for (const cle of cles) {
      expect(fiches[cle]).toBeTruthy()
    }
  })

  test('conserve les valeurs des fiches sans les modifier', () => {
    const sources = fabriqueSources()
    const fiches = loadFiches(sources)
    expect(fiches.personnage).toBe(sources.personnage)
    expect(fiches.aventure.dureeEstimee).toBe(20)
  })

  test('ne mute pas l objet sources', () => {
    const sources = fabriqueSources()
    const avant = JSON.stringify(sources)
    loadFiches(sources)
    expect(JSON.stringify(sources)).toBe(avant)
  })

  test('SourcesInvalidesError si sources absent', () => {
    expect(() => loadFiches(undefined)).toThrow(SourcesInvalidesError)
    expect(() => loadFiches(null)).toThrow(SourcesInvalidesError)
  })

  test('SourcesInvalidesError si sources n est pas un objet', () => {
    expect(() => loadFiches('texte')).toThrow(SourcesInvalidesError)
    expect(() => loadFiches([])).toThrow(SourcesInvalidesError)
  })

  test('FicheManquanteError si une fiche est absente', () => {
    const sources = fabriqueSources()
    delete sources.univers
    expect(() => loadFiches(sources)).toThrow(FicheManquanteError)
  })

  test('FicheManquanteError si une fiche est null', () => {
    expect(() => loadFiches(fabriqueSources({ joueur: null }))).toThrow(FicheManquanteError)
  })

  test('FicheInvalideError si une fiche présente est invalide', () => {
    expect(() => loadFiches(fabriqueSources({ memoire: 'nope' }))).toThrow(FicheInvalideError)
  })

  test('est déterministe (même entrée → même sortie)', () => {
    const sources = fabriqueSources()
    expect(loadFiches(sources)).toEqual(loadFiches(sources))
  })
})

// ─── Erreurs typées ──────────────────────────────────────────────────────────

describe('erreurs lecture — héritage', () => {
  test('toutes les erreurs héritent de LectureError', () => {
    expect(new SourcesInvalidesError('x')).toBeInstanceOf(LectureError)
    expect(new FicheManquanteError('personnage')).toBeInstanceOf(LectureError)
    expect(new TypeFicheInvalideError('x')).toBeInstanceOf(LectureError)
    expect(new FicheInvalideError('univers', 'y')).toBeInstanceOf(LectureError)
    expect(new LectureError('x')).toBeInstanceOf(Error)
  })
})
