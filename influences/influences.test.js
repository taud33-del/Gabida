/**
 * influences/influences.test.js
 *
 * Tests unitaires du module influences.
 * Couvre chaque sous-fonction et l'interface publique.
 *
 * Execution : node influences/influences.test.js
 */

import {
  collecterInfluencesCriteres,
  collecterInfluencesSouvenirs,
  collecterInfluencesAxiomes,
  fusionnerInfluences,
  calculerSynthese,
  computeInfluences,
} from './index.js'

import { SOURCES_INFLUENCE } from '../constants/SourcesInfluence.js'
import { TONALITES_FILTRE }  from '../constants/TonalitesFiltre.js'
import { TYPES_SOUVENIR }    from '../constants/TypesSouvenir.js'

// -----------------------------------------------------------------------------
// Runner minimal
// -----------------------------------------------------------------------------

let passed = 0
let failed = 0

function test(label, fn) {
  try {
    fn()
    console.log(`  [OK]  ${label}`)
    passed++
  } catch (err) {
    console.error(`  [KO]  ${label}`)
    console.error(`        ${err.message}`)
    failed++
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg ?? 'Assertion echouee')
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label ?? ''} : attendu "${expected}", recu "${actual}"`)
  }
}

function assertBetween(v, min, max, label) {
  if (v < min || v > max) {
    throw new Error(`${label ?? ''} : ${v} hors de [${min}, ${max}]`)
  }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function makeCtx({ criteresConernes = ['emotions'], intention = 'question', criteres = {}, souvenirs = [] } = {}) {
  return {
    evenement: { intention, criteresConernes, elementsImportants: [], contexte: { lieu: null, moment: 'ouverture' } },
    fiches: {
      personnage: { criteres },
      aventure: {}, univers: {}, joueur: {}, memoire: {},
    },
    etat: {
      tourCourant: 1,
      sessionId: 'test',
      memoireVecue: { souvenirs },
      historique: [],
      meta: { debutTimestamp: 0, langue: 'fr' },
    },
    souvenirs,
  }
}

function makeSouvenir(type, importance, tour = 1) {
  return { id: `s-${type}-${tour}`, type, contenu: `Souvenir ${type}`, importance, tour }
}

// -----------------------------------------------------------------------------
// collecterInfluencesCriteres
// -----------------------------------------------------------------------------

console.log('\ncollecterInfluencesCriteres')

test('produit une influence par critere concerne', () => {
  const ctx = makeCtx({ criteresConernes: ['emotions', 'valeurs'], criteres: { emotions: 0.8, valeurs: 0.4 } })
  const result = collecterInfluencesCriteres(ctx)
  assertEqual(result.length, 2, 'nb influences')
})

test('source est CRITERE', () => {
  const ctx = makeCtx({ criteresConernes: ['emotions'], criteres: { emotions: 0.6 } })
  const result = collecterInfluencesCriteres(ctx)
  assertEqual(result[0].source, SOURCES_INFLUENCE.CRITERE)
})

test('poids lu depuis la fiche', () => {
  const ctx = makeCtx({ criteresConernes: ['emotions'], criteres: { emotions: 0.75 } })
  const result = collecterInfluencesCriteres(ctx)
  assertEqual(result[0].poids, 0.75, 'poids')
})

test('poids neutre 0.5 si critere absent de la fiche', () => {
  const ctx = makeCtx({ criteresConernes: ['inconnu'], criteres: {} })
  const result = collecterInfluencesCriteres(ctx)
  assertEqual(result[0].poids, 0.5, 'poids defaut')
})

test('poids borne a 1 si valeur fiche > 1', () => {
  const ctx = makeCtx({ criteresConernes: ['emotions'], criteres: { emotions: 1.5 } })
  const result = collecterInfluencesCriteres(ctx)
  assertEqual(result[0].poids, 1, 'poids clamp')
})

test('raison non vide', () => {
  const ctx = makeCtx({ criteresConernes: ['emotions'], criteres: { emotions: 0.5 } })
  const result = collecterInfluencesCriteres(ctx)
  assert(result[0].raison.length > 0, 'raison vide')
})

test('retourne tableau vide si criteresConernes vide', () => {
  const ctx = makeCtx({ criteresConernes: [] })
  assertEqual(collecterInfluencesCriteres(ctx).length, 0)
})

// -----------------------------------------------------------------------------
// collecterInfluencesSouvenirs
// -----------------------------------------------------------------------------

console.log('\ncollecterInfluencesSouvenirs')

test('souvenir pertinent produit une influence', () => {
  const s = makeSouvenir(TYPES_SOUVENIR.DIALOGUE, 0.7)
  const ctx = makeCtx({ intention: 'question', souvenirs: [s] })
  const result = collecterInfluencesSouvenirs(ctx)
  assertEqual(result.length, 1)
})

test('souvenir non pertinent ne produit pas d influence', () => {
  const s = makeSouvenir(TYPES_SOUVENIR.MENSONGE, 0.7)
  const ctx = makeCtx({ intention: 'question', souvenirs: [s] })
  const result = collecterInfluencesSouvenirs(ctx)
  // MENSONGE n'est pas dans les types pertinents pour QUESTION
  assertEqual(result.length, 0)
})

test('source est SOUVENIR', () => {
  const s = makeSouvenir(TYPES_SOUVENIR.PROMESSE, 0.6)
  const ctx = makeCtx({ intention: 'demande', souvenirs: [s] })
  const result = collecterInfluencesSouvenirs(ctx)
  assertEqual(result[0].source, SOURCES_INFLUENCE.SOUVENIR)
})

test('poids egal a importance du souvenir', () => {
  const s = makeSouvenir(TYPES_SOUVENIR.MENSONGE, 0.9)
  const ctx = makeCtx({ intention: 'provocation', souvenirs: [s] })
  const result = collecterInfluencesSouvenirs(ctx)
  assertEqual(result[0].poids, 0.9)
})

test('plusieurs souvenirs pertinents -> plusieurs influences', () => {
  const souvenirs = [
    makeSouvenir(TYPES_SOUVENIR.PROMESSE, 0.8),
    makeSouvenir(TYPES_SOUVENIR.DIALOGUE, 0.5),
  ]
  const ctx = makeCtx({ intention: 'confidence', souvenirs })
  const result = collecterInfluencesSouvenirs(ctx)
  assertEqual(result.length, 2)
})

test('retourne tableau vide si aucun souvenir', () => {
  const ctx = makeCtx({ intention: 'question', souvenirs: [] })
  assertEqual(collecterInfluencesSouvenirs(ctx).length, 0)
})

// -----------------------------------------------------------------------------
// collecterInfluencesAxiomes
// -----------------------------------------------------------------------------

console.log('\ncollecterInfluencesAxiomes')

test('un seul critere -> influence de plancher Axiome 4', () => {
  const ctx = makeCtx({ criteresConernes: ['emotions'] })
  const result = collecterInfluencesAxiomes(ctx)
  assertEqual(result.length, 1)
  assertEqual(result[0].cibleId, 'pluralite')
  assertEqual(result[0].source, SOURCES_INFLUENCE.AXIOME)
})

test('deux criteres -> influence cumulative Axiome 3', () => {
  const ctx = makeCtx({ criteresConernes: ['emotions', 'valeurs'] })
  const result = collecterInfluencesAxiomes(ctx)
  assertEqual(result.length, 1)
  assertEqual(result[0].cibleId, 'accumulation')
})

test('poids accumulation proportionnel au nb de criteres (2 -> 0.2)', () => {
  const ctx = makeCtx({ criteresConernes: ['a', 'b'] })
  const result = collecterInfluencesAxiomes(ctx)
  assertEqual(result[0].poids, 0.2)
})

test('poids accumulation plafonne a 0.5 (5 criteres)', () => {
  const ctx = makeCtx({ criteresConernes: ['a', 'b', 'c', 'd', 'e'] })
  const result = collecterInfluencesAxiomes(ctx)
  assertEqual(result[0].poids, 0.5)
})

test('zero critere -> aucune influence axiome', () => {
  const ctx = makeCtx({ criteresConernes: [] })
  assertEqual(collecterInfluencesAxiomes(ctx).length, 0)
})

// -----------------------------------------------------------------------------
// fusionnerInfluences
// -----------------------------------------------------------------------------

console.log('\nfusionnerInfluences')

test('ordonne par poids decroissant', () => {
  const influences = [
    { source: SOURCES_INFLUENCE.CRITERE, cibleId: 'a', poids: 0.3, raison: 'r' },
    { source: SOURCES_INFLUENCE.CRITERE, cibleId: 'b', poids: 0.9, raison: 'r' },
    { source: SOURCES_INFLUENCE.CRITERE, cibleId: 'c', poids: 0.6, raison: 'r' },
  ]
  const result = fusionnerInfluences(influences)
  assert(result[0].poids >= result[1].poids, 'ordre incorrect 0-1')
  assert(result[1].poids >= result[2].poids, 'ordre incorrect 1-2')
})

test('tableau vide -> influence neutre de plancher', () => {
  const result = fusionnerInfluences([])
  assertEqual(result.length, 1)
  assertEqual(result[0].cibleId, 'neutre')
  assertEqual(result[0].source, SOURCES_INFLUENCE.AXIOME)
})

test('ne modifie pas le tableau d entree', () => {
  const original = [
    { source: SOURCES_INFLUENCE.CRITERE, cibleId: 'a', poids: 0.3, raison: 'r' },
    { source: SOURCES_INFLUENCE.CRITERE, cibleId: 'b', poids: 0.9, raison: 'r' },
  ]
  fusionnerInfluences(original)
  assertEqual(original[0].cibleId, 'a', 'tableau original modifie')
})

// -----------------------------------------------------------------------------
// calculerSynthese
// -----------------------------------------------------------------------------

console.log('\ncalculerSynthese')

test('critereMoteur = cibleId de la premiere influence', () => {
  const influences = [
    { source: SOURCES_INFLUENCE.CRITERE, cibleId: 'emotions', poids: 0.9, raison: 'r' },
    { source: SOURCES_INFLUENCE.CRITERE, cibleId: 'valeurs',  poids: 0.4, raison: 'r' },
  ]
  const synthese = calculerSynthese(influences)
  assertEqual(synthese.critereMoteur, 'emotions')
})

test('intensite = moyenne des poids', () => {
  const influences = [
    { source: SOURCES_INFLUENCE.CRITERE, cibleId: 'a', poids: 0.6, raison: 'r' },
    { source: SOURCES_INFLUENCE.CRITERE, cibleId: 'b', poids: 0.4, raison: 'r' },
  ]
  const synthese = calculerSynthese(influences)
  assertEqual(synthese.intensite, 0.5)
})

test('intensite >= 0.70 -> OUVERTE', () => {
  const influences = [{ source: SOURCES_INFLUENCE.CRITERE, cibleId: 'a', poids: 0.85, raison: 'r' }]
  assertEqual(calculerSynthese(influences).tonalite, TONALITES_FILTRE.OUVERTE)
})

test('intensite 0.50 -> NEUTRE', () => {
  const influences = [{ source: SOURCES_INFLUENCE.CRITERE, cibleId: 'a', poids: 0.50, raison: 'r' }]
  assertEqual(calculerSynthese(influences).tonalite, TONALITES_FILTRE.NEUTRE)
})

test('intensite 0.30 -> FERMEE', () => {
  const influences = [{ source: SOURCES_INFLUENCE.CRITERE, cibleId: 'a', poids: 0.30, raison: 'r' }]
  assertEqual(calculerSynthese(influences).tonalite, TONALITES_FILTRE.FERMEE)
})

test('intensite 0.10 -> HOSTILE', () => {
  const influences = [{ source: SOURCES_INFLUENCE.CRITERE, cibleId: 'a', poids: 0.10, raison: 'r' }]
  assertEqual(calculerSynthese(influences).tonalite, TONALITES_FILTRE.HOSTILE)
})

// -----------------------------------------------------------------------------
// computeInfluences (integration)
// -----------------------------------------------------------------------------

console.log('\ncomputeInfluences (integration)')

const fichesMock = {
  personnage: { criteres: { emotions: 0.8, relations: 0.6 } },
  aventure: {}, univers: {}, joueur: {}, memoire: {},
}

const etatVide = {
  tourCourant: 1, sessionId: 'test',
  memoireVecue: { souvenirs: [] },
  historique: [], meta: { debutTimestamp: 0, langue: 'fr' },
}

const etatAvecSouvenirs = {
  ...etatVide,
  memoireVecue: {
    souvenirs: [
      makeSouvenir(TYPES_SOUVENIR.DIALOGUE, 0.9),
      makeSouvenir(TYPES_SOUVENIR.MENSONGE, 0.7),
    ],
  },
}

const evenementQuestion = {
  intention: 'question',
  criteresConernes: ['emotions', 'relations'],
  elementsImportants: [],
  contexte: { lieu: null, moment: 'ouverture' },
}

const evenementProvocation = {
  intention: 'provocation',
  criteresConernes: ['valeurs'],
  elementsImportants: [],
  contexte: { lieu: null, moment: 'tension' },
}

test('retourne un FiltreRelationnel complet', () => {
  const filtre = computeInfluences(evenementQuestion, fichesMock, etatVide)
  assert(Array.isArray(filtre.influences), 'influences doit etre un tableau')
  assert(filtre.influences.length >= 1, 'influences ne doit pas etre vide')
  assert(filtre.synthese !== undefined, 'synthese manquante')
  assert(filtre.synthese.tonalite !== undefined, 'tonalite manquante')
  assertBetween(filtre.synthese.intensite, 0, 1, 'intensite')
  assert(filtre.synthese.critereMoteur !== undefined, 'critereMoteur manquant')
})

test('influences ordonnees par poids decroissant', () => {
  const filtre = computeInfluences(evenementQuestion, fichesMock, etatVide)
  for (let i = 0; i < filtre.influences.length - 1; i++) {
    assert(
      filtre.influences[i].poids >= filtre.influences[i + 1].poids,
      `ordre incorrect a l'index ${i}`
    )
  }
})

test('chaque influence a une raison non vide', () => {
  const filtre = computeInfluences(evenementQuestion, fichesMock, etatVide)
  for (const inf of filtre.influences) {
    assert(inf.raison && inf.raison.length > 0, `raison vide pour ${inf.cibleId}`)
  }
})

test('avec souvenirs pertinents : davantage d influences', () => {
  const sansMemoire = computeInfluences(evenementQuestion, fichesMock, etatVide)
  const avecMemoire = computeInfluences(evenementQuestion, fichesMock, etatAvecSouvenirs)
  assert(avecMemoire.influences.length > sansMemoire.influences.length, 'les souvenirs doivent augmenter le nb d influences')
})

test('provocation avec souvenir mensonge -> MENSONGE prise en compte', () => {
  const filtre = computeInfluences(evenementProvocation, fichesMock, etatAvecSouvenirs)
  const sourcesSouvenir = filtre.influences.filter(i => i.source === SOURCES_INFLUENCE.SOUVENIR)
  assert(sourcesSouvenir.length >= 1, 'aucune influence souvenir trouvee pour provocation+mensonge')
})

test('ne modifie pas l etat en entree', () => {
  const nbAvant = etatAvecSouvenirs.memoireVecue.souvenirs.length
  computeInfluences(evenementQuestion, fichesMock, etatAvecSouvenirs)
  assertEqual(etatAvecSouvenirs.memoireVecue.souvenirs.length, nbAvant, 'etat modifie')
})

test('ne modifie pas les fiches en entree', () => {
  const valeurAvant = fichesMock.personnage.criteres.emotions
  computeInfluences(evenementQuestion, fichesMock, etatVide)
  assertEqual(fichesMock.personnage.criteres.emotions, valeurAvant, 'fiche modifiee')
})

// -----------------------------------------------------------------------------
// Rapport final
// -----------------------------------------------------------------------------

console.log(`\n${'─'.repeat(50)}`)
console.log(`Resultats : ${passed} OK  /  ${failed} KO  /  ${passed + failed} total`)
if (failed > 0) process.exit(1)