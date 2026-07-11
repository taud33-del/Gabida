/**
 * analyse/analyse.test.js
 *
 * Tests unitaires du module analyse.
 * Couvre chaque fonction exportee independamment (testabilite unitaire).
 */

import {
  normaliserTexte,
  detecterIntention,
  extraireElementsImportants,
  identifierCriteresConcernes,
  deduireMomentNarratif,
  extraireLieu,
  analyzeEvent,
} from './index.js'

import { INTENTIONS } from '../constants/Intentions.js'
import { MOMENTS_NARRATIFS } from '../constants/MomentsNarratifs.js'

// -----------------------------------------------------------------------------
// Assertions (conservees telles quelles : elles definissent le contrat teste)
// -----------------------------------------------------------------------------

function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion echouee')
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label ?? ''} : attendu "${expected}", recu "${actual}"`)
  }
}

function assertIncludes(arr, value, label) {
  if (!arr.includes(value)) {
    throw new Error(`${label ?? ''} : "${value}" absent de [${arr.join(', ')}]`)
  }
}

// -----------------------------------------------------------------------------
// Helpers : construction de contexteAnalyse de test
// -----------------------------------------------------------------------------

function makeCtx(texte, { fiches = {}, etat = {} } = {}) {
  const texteOriginal  = texte
  const texteNormalise = normaliserTexte(texte)
  const playerMessage  = { texte, tour: 1, sessionId: 'test', timestamp: 0 }
  return {
    playerMessage,
    texteOriginal,
    texteNormalise,
    fiches: { aventure: {}, personnage: {}, univers: {}, joueur: {}, memoire: {}, ...fiches },
    etat:   { tourCourant: 1, meta: {}, ...etat },
  }
}

// -----------------------------------------------------------------------------
// normaliserTexte
// -----------------------------------------------------------------------------

describe('normaliserTexte', () => {
  test('met en minuscules', () => {
    assertEqual(normaliserTexte('Bonjour'), 'bonjour')
  })

  test('normalise apostrophe typographique droite', () => {
    assertEqual(normaliserTexte('j\u2019ai'), "j'ai")
  })

  test('texte vide reste vide', () => {
    assertEqual(normaliserTexte(''), '')
  })
})

// -----------------------------------------------------------------------------
// detecterIntention
// -----------------------------------------------------------------------------

describe('detecterIntention', () => {
  test('detecte QUESTION via "?"', () => {
    assertEqual(detecterIntention(makeCtx('tu viens ?')), INTENTIONS.QUESTION)
  })

  test('detecte QUESTION via "pourquoi"', () => {
    assertEqual(detecterIntention(makeCtx('pourquoi tu fais ca')), INTENTIONS.QUESTION)
  })

  test('detecte DEMANDE via "aide-moi"', () => {
    assertEqual(detecterIntention(makeCtx('aide-moi a trouver la sortie')), INTENTIONS.DEMANDE)
  })

  test('detecte DEMANDE via "peux-tu"', () => {
    assertEqual(detecterIntention(makeCtx('peux-tu venir avec moi')), INTENTIONS.DEMANDE)
  })

  test('detecte PROVOCATION via "tu mens"', () => {
    assertEqual(detecterIntention(makeCtx('tu mens depuis le debut')), INTENTIONS.PROVOCATION)
  })

  test('detecte PROVOCATION via "incapable"', () => {
    assertEqual(detecterIntention(makeCtx('tu es incapable de faire ca')), INTENTIONS.PROVOCATION)
  })

  test('detecte CONFIDENCE via "je te confie"', () => {
    assertEqual(detecterIntention(makeCtx('je te confie quelque chose')), INTENTIONS.CONFIDENCE)
  })

  test('detecte CONFIDENCE via "je souffre"', () => {
    assertEqual(detecterIntention(makeCtx('je souffre depuis longtemps')), INTENTIONS.CONFIDENCE)
  })

  test('detecte OBSERVATION via "on dirait"', () => {
    assertEqual(detecterIntention(makeCtx('on dirait que le temps change')), INTENTIONS.OBSERVATION)
  })

  test('retourne SILENCE si texte vide', () => {
    assertEqual(detecterIntention(makeCtx('')), INTENTIONS.SILENCE)
  })

  test('retourne SILENCE si texte uniquement espaces', () => {
    assertEqual(detecterIntention(makeCtx('   ')), INTENTIONS.SILENCE)
  })

  test('retourne OBSERVATION si aucun pattern ne matche', () => {
    assertEqual(detecterIntention(makeCtx('blabla sans sens particulier')), INTENTIONS.OBSERVATION)
  })

  test('QUESTION a priorite sur OBSERVATION', () => {
    assertEqual(detecterIntention(makeCtx('je constate que tu viens ?')), INTENTIONS.QUESTION)
  })
})

// -----------------------------------------------------------------------------
// extraireElementsImportants
// -----------------------------------------------------------------------------

describe('extraireElementsImportants', () => {
  test('extrait fragment apres "je promets"', () => {
    const ctx = makeCtx('je promets de revenir demain')
    const result = extraireElementsImportants(ctx)
    assert(result.length === 1, 'doit trouver 1 element')
    assert(result[0].startsWith('de revenir'), `fragment inattendu : "${result[0]}"`)
  })

  test('extrait fragment apres "je refuse"', () => {
    const ctx = makeCtx("je refuse d'obeir a tes ordres")
    const result = extraireElementsImportants(ctx)
    assert(result.length === 1, 'doit trouver 1 element')
  })

  test('retourne tableau vide si aucun marqueur', () => {
    const result = extraireElementsImportants(makeCtx('bonjour comment vas-tu'))
    assertEqual(result.length, 0, 'tableau doit etre vide')
  })

  test('fragment tronque a 60 caracteres', () => {
    const ctx = makeCtx('je promets ' + 'a'.repeat(100))
    const result = extraireElementsImportants(ctx)
    assert(result[0].length <= 60, `fragment trop long : ${result[0].length}`)
  })
})

// -----------------------------------------------------------------------------
// identifierCriteresConcernes
// -----------------------------------------------------------------------------

describe('identifierCriteresConcernes', () => {
  test('detecte critere "emotions" via "peur"', () => {
    assertIncludes(identifierCriteresConcernes(makeCtx("j'ai peur")), 'emotions')
  })

  test('detecte critere "valeurs" via "honneur"', () => {
    assertIncludes(identifierCriteresConcernes(makeCtx("c'est une question d'honneur")), 'valeurs')
  })

  test('detecte critere "relations" via "confiance"', () => {
    assertIncludes(identifierCriteresConcernes(makeCtx('je te fais confiance')), 'relations')
  })

  test('detecte critere "histoire" via "enfance"', () => {
    assertIncludes(identifierCriteresConcernes(makeCtx('mon enfance etait difficile')), 'histoire')
  })

  test('retourne ["communication"] par defaut si aucun critere', () => {
    const result = identifierCriteresConcernes(makeCtx('zzz qqq xxx'))
    assertEqual(result.length, 1, 'doit contenir exactement 1 element')
    assertEqual(result[0], 'communication')
  })

  test('peut retourner plusieurs criteres', () => {
    const result = identifierCriteresConcernes(makeCtx("j'ai peur de trahir ma famille"))
    assert(result.length >= 2, `doit avoir >= 2 criteres, en a ${result.length}`)
    assertIncludes(result, 'emotions')
    assertIncludes(result, 'relations')
  })
})

// -----------------------------------------------------------------------------
// deduireMomentNarratif
// -----------------------------------------------------------------------------

describe('deduireMomentNarratif', () => {
  function ctxTour(n, dureeEstimee = 20) {
    return makeCtx('texte', {
      fiches: { aventure: { dureeEstimee } },
      etat:   { tourCourant: n, meta: {} },
    })
  }

  test('tour 1 -> OUVERTURE', () => {
    assertEqual(deduireMomentNarratif(ctxTour(1)), MOMENTS_NARRATIFS.OUVERTURE)
  })

  test('tour 2 -> OUVERTURE', () => {
    assertEqual(deduireMomentNarratif(ctxTour(2)), MOMENTS_NARRATIFS.OUVERTURE)
  })

  test('tour 3 -> DEVELOPPEMENT', () => {
    assertEqual(deduireMomentNarratif(ctxTour(3)), MOMENTS_NARRATIFS.DEVELOPPEMENT)
  })

  test('tour 19 (N-1) -> TENSION', () => {
    assertEqual(deduireMomentNarratif(ctxTour(19)), MOMENTS_NARRATIFS.TENSION)
  })

  test('tour 20 (N) -> RESOLUTION', () => {
    assertEqual(deduireMomentNarratif(ctxTour(20)), MOMENTS_NARRATIFS.RESOLUTION)
  })

  test('tour 21 (N+1) -> EPILOGUE', () => {
    assertEqual(deduireMomentNarratif(ctxTour(21)), MOMENTS_NARRATIFS.EPILOGUE)
  })

  test('fiche sans dureeEstimee : defaut 20 tours', () => {
    assertEqual(deduireMomentNarratif(ctxTour(1, undefined)), MOMENTS_NARRATIFS.OUVERTURE)
    assertEqual(deduireMomentNarratif(ctxTour(20, undefined)), MOMENTS_NARRATIFS.RESOLUTION)
  })

  test('fiche aventure absente : defaut 20 tours', () => {
    const ctx = makeCtx('texte', {
      fiches: { aventure: null },
      etat:   { tourCourant: 1, meta: {} },
    })
    assertEqual(deduireMomentNarratif(ctx), MOMENTS_NARRATIFS.OUVERTURE)
  })
})

// -----------------------------------------------------------------------------
// extraireLieu
// -----------------------------------------------------------------------------

describe('extraireLieu', () => {
  test('retourne etat.meta.lieuCourant en priorite', () => {
    const ctx = makeCtx('texte', {
      fiches: { aventure: { lieuDepart: 'Foret' } },
      etat:   { tourCourant: 1, meta: { lieuCourant: 'Taverne' } },
    })
    assertEqual(extraireLieu(ctx), 'Taverne')
  })

  test('retourne ficheAventure.lieuDepart si pas de lieuCourant', () => {
    const ctx = makeCtx('texte', {
      fiches: { aventure: { lieuDepart: 'Foret' } },
      etat:   { tourCourant: 1, meta: {} },
    })
    assertEqual(extraireLieu(ctx), 'Foret')
  })

  test('retourne null si aucun lieu disponible', () => {
    assertEqual(extraireLieu(makeCtx('texte')), null)
  })
})

// -----------------------------------------------------------------------------
// analyzeEvent (integration -- interface publique inchangee)
// -----------------------------------------------------------------------------

describe('analyzeEvent (integration)', () => {
  const fichesMock = {
    aventure:    { dureeEstimee: 10, lieuDepart: 'Village' },
    personnage:  {},
    univers:     {},
    joueur:      {},
    memoire:     {},
  }

  const etatTour1 = {
    tourCourant: 1,
    sessionId:   'test-session',
    memoireVecue: { souvenirs: [] },
    historique:   [],
    meta:         { debutTimestamp: 0, langue: 'fr' },
  }

  test('retourne un Evenement complet', () => {
    const msg = { texte: 'pourquoi tu fais ca ?', tour: 1, sessionId: 'test-session', timestamp: 0 }
    const evt = analyzeEvent(msg, fichesMock, etatTour1)
    assert(evt.intention !== undefined,          'intention manquante')
    assert(Array.isArray(evt.criteresConernes),  'criteresConernes doit etre un tableau')
    assert(Array.isArray(evt.elementsImportants),'elementsImportants doit etre un tableau')
    assert(evt.contexte !== undefined,           'contexte manquant')
    assert(evt.contexte.moment !== undefined,    'contexte.moment manquant')
  })

  test('question au tour 1 -> QUESTION + OUVERTURE + lieu de la fiche', () => {
    const msg = { texte: 'pourquoi tu fais ca ?', tour: 1, sessionId: 's', timestamp: 0 }
    const evt = analyzeEvent(msg, fichesMock, etatTour1)
    assertEqual(evt.intention,        INTENTIONS.QUESTION)
    assertEqual(evt.contexte.moment,  MOMENTS_NARRATIFS.OUVERTURE)
    assertEqual(evt.contexte.lieu,    'Village')
  })

  test('criteresConernes est non vide', () => {
    const msg = { texte: 'bonjour', tour: 1, sessionId: 's', timestamp: 0 }
    const evt = analyzeEvent(msg, fichesMock, etatTour1)
    assert(evt.criteresConernes.length >= 1, 'doit avoir au moins 1 critere')
  })

  test('message avec marqueur -> element important extrait', () => {
    const msg = { texte: "je promets de te proteger quoi qu'il arrive", tour: 1, sessionId: 's', timestamp: 0 }
    const evt = analyzeEvent(msg, fichesMock, etatTour1)
    assert(evt.elementsImportants.length === 1, 'doit extraire 1 element important')
  })

  test('message vide -> SILENCE', () => {
    const msg = { texte: '', tour: 1, sessionId: 's', timestamp: 0 }
    const evt = analyzeEvent(msg, fichesMock, etatTour1)
    assertEqual(evt.intention, INTENTIONS.SILENCE)
  })
})
