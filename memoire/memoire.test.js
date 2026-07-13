/**
 * memoire/memoire.test.js
 *
 * Tests unitaires du module memoire/.
 *
 * Couverture :
 *   - detecterSouvenirsCandidats : detection par intention, elements importants, moment narratif
 *   - selectionnerSouvenirsPermanents : regles de protection
 *   - fusionnerEtPrioriser : tri, deduplication, combinaison
 *   - appliquerOubli : ecretage capacite, protection des importants
 *   - assemblerMiseAJour : construction du MiseAJourMemoire
 *   - updateMemory : integration complete
 */

import {
  detecterSouvenirsCandidats,
  selectionnerSouvenirsPermanents,
  fusionnerEtPrioriser,
  appliquerOubli,
  assemblerMiseAJour,
  updateMemory,
  appliquerMiseAJour,
} from './index.js'

import { TYPES_SOUVENIR }      from '../constants/TypesSouvenir.js'
import { INTENTIONS }          from '../constants/Intentions.js'
import { MOMENTS_NARRATIFS }   from '../constants/MomentsNarratifs.js'
import { IMPORTANCES_MEMOIRE } from '../constants/ImportancesMemoire.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function fabriqueSouvenir(overrides = {}) {
  return {
    id         : crypto.randomUUID(),
    type       : TYPES_SOUVENIR.DIALOGUE,
    contenu    : 'Souvenir de test.',
    importance : 0.5,
    tour       : 1,
    ...overrides,
  }
}

function fabriqueCtx(overrides = {}) {
  return {
    evenement          : {},
    decision           : {},
    reponseIA          : { action: 'Action test.', dialogue: 'Reponse test.' },
    fiches             : {},
    etat               : { tourCourant: 5, sessionId: 'session-test', memoireVecue: { souvenirs: [] } },
    intention          : INTENTIONS.OBSERVATION,
    elementsImportants : [],
    criteresConernes   : [],
    momentNarratif     : MOMENTS_NARRATIFS.DEVELOPPEMENT,
    objectifDecision   : 'etablir_confiance',
    directionNarrative : 'poser_question',
    criteresDecision   : ['relations'],
    actionReponse      : 'Action test.',
    dialogueReponse    : 'Reponse test.',
    tourCourant        : 5,
    souvenirsCourants  : [],
    capaciteMax        : 20,
    sessionId          : 'session-test',
    ...overrides,
  }
}

// ─── detecterSouvenirsCandidats ───────────────────────────────────────────────

describe('detecterSouvenirsCandidats', () => {
  test('retourne tableau vide si aucun signal', () => {
    const ctx = fabriqueCtx({
      elementsImportants : [],
      intention          : INTENTIONS.OBSERVATION,
      objectifDecision   : '',
      criteresDecision   : [],
      directionNarrative : '',
    })
    expect(detecterSouvenirsCandidats(ctx)).toHaveLength(0)
  })

  test('detecte un mensonge dans elementsImportants', () => {
    const ctx = fabriqueCtx({ elementsImportants: ['il ment sur sa presence'] })
    const candidats = detecterSouvenirsCandidats(ctx)
    const mensonge = candidats.find(s => s.type === TYPES_SOUVENIR.MENSONGE)
    expect(mensonge).toBeDefined()
    expect(mensonge.importance).toBe(IMPORTANCES_MEMOIRE.IMPORTANCE_MENSONGE)
  })

  test('detecte une promesse dans elementsImportants', () => {
    const ctx = fabriqueCtx({ elementsImportants: ['promesse de ne jamais trahir'] })
    const candidats = detecterSouvenirsCandidats(ctx)
    const promesse = candidats.find(s => s.type === TYPES_SOUVENIR.PROMESSE)
    expect(promesse).toBeDefined()
    expect(promesse.importance).toBe(IMPORTANCES_MEMOIRE.IMPORTANCE_PROMESSE)
  })

  test('detecte une confidence', () => {
    const ctx = fabriqueCtx({ intention: INTENTIONS.CONFIDENCE })
    const candidats = detecterSouvenirsCandidats(ctx)
    const dialogue = candidats.find(s => s.type === TYPES_SOUVENIR.DIALOGUE)
    expect(dialogue).toBeDefined()
    expect(dialogue.importance).toBe(IMPORTANCES_MEMOIRE.IMPORTANCE_CONFIDENCE)
  })

  test('detecte une provocation avec elements importants', () => {
    const ctx = fabriqueCtx({
      intention          : INTENTIONS.PROVOCATION,
      elementsImportants : ['attaque sur les valeurs'],
    })
    const candidats = detecterSouvenirsCandidats(ctx)
    const dialogue = candidats.find(s => s.type === TYPES_SOUVENIR.DIALOGUE && s.contenu.includes('Provocation'))
    expect(dialogue).toBeDefined()
  })

  test('amplifie l importance en moment de tension', () => {
    const ctx = fabriqueCtx({
      elementsImportants : ['il ment sur son passe'],
      momentNarratif     : MOMENTS_NARRATIFS.TENSION,
    })
    const candidats    = detecterSouvenirsCandidats(ctx)
    const mensonge     = candidats.find(s => s.type === TYPES_SOUVENIR.MENSONGE)
    const attendu      = Math.min(1, IMPORTANCES_MEMOIRE.IMPORTANCE_MENSONGE * IMPORTANCES_MEMOIRE.AMPLIFICATION_TENSION)
    expect(mensonge.importance).toBeCloseTo(attendu, 5)
  })

  test('amplifie l importance en epilogue', () => {
    const ctx = fabriqueCtx({
      intention      : INTENTIONS.CONFIDENCE,
      momentNarratif : MOMENTS_NARRATIFS.EPILOGUE,
    })
    const candidats = detecterSouvenirsCandidats(ctx)
    const dialogue  = candidats.find(s => s.type === TYPES_SOUVENIR.DIALOGUE)
    const attendu   = Math.min(1, IMPORTANCES_MEMOIRE.IMPORTANCE_CONFIDENCE * IMPORTANCES_MEMOIRE.AMPLIFICATION_EPILOGUE)
    expect(dialogue.importance).toBeCloseTo(attendu, 5)
  })

  test('borne l importance a 1.0 au maximum', () => {
    const ctx = fabriqueCtx({
      elementsImportants : ['ment contradit'],
      momentNarratif     : MOMENTS_NARRATIFS.TENSION,
    })
    const candidats = detecterSouvenirsCandidats(ctx)
    candidats.forEach(s => expect(s.importance).toBeLessThanOrEqual(1))
  })

  test('chaque souvenir possede un id unique', () => {
    const ctx = fabriqueCtx({
      intention          : INTENTIONS.CONFIDENCE,
      elementsImportants : ['promesse de fidelite'],
    })
    const candidats = detecterSouvenirsCandidats(ctx)
    const ids = candidats.map(s => s.id)
    const uniques = new Set(ids)
    expect(uniques.size).toBe(ids.length)
  })

  test('chaque souvenir porte le tourCourant', () => {
    const ctx = fabriqueCtx({
      intention   : INTENTIONS.CONFIDENCE,
      tourCourant : 7,
    })
    const candidats = detecterSouvenirsCandidats(ctx)
    candidats.forEach(s => expect(s.tour).toBe(7))
  })

  test('cree un souvenir DECISION si objectifDecision et criteresDecision presents', () => {
    const ctx = fabriqueCtx({
      objectifDecision : 'proteger_identite',
      criteresDecision : ['valeurs', 'honneur'],
    })
    const candidats = detecterSouvenirsCandidats(ctx)
    const decision  = candidats.find(s => s.type === TYPES_SOUVENIR.DECISION)
    expect(decision).toBeDefined()
    expect(decision.contenu).toContain('proteger_identite')
  })
})

// ─── selectionnerSouvenirsPermanents ─────────────────────────────────────────

describe('selectionnerSouvenirsPermanents', () => {
  test('protege les souvenirs a importance >= seuil', () => {
    const souvenir = fabriqueSouvenir({ importance: 0.85, tour: 1 })
    const ctx = fabriqueCtx({ souvenirsCourants: [souvenir], tourCourant: 10 })
    const permanents = selectionnerSouvenirsPermanents(ctx)
    expect(permanents).toContainEqual(souvenir)
  })

  test('ne protege pas les souvenirs sous le seuil et anciens', () => {
    const souvenir = fabriqueSouvenir({ importance: 0.3, tour: 1 })
    const ctx = fabriqueCtx({ souvenirsCourants: [souvenir], tourCourant: 10 })
    const permanents = selectionnerSouvenirsPermanents(ctx)
    expect(permanents).not.toContainEqual(souvenir)
  })

  test('protege les souvenirs recents (tour >= tourCourant - 2)', () => {
    const souvenir = fabriqueSouvenir({ importance: 0.2, tour: 4 })
    const ctx = fabriqueCtx({ souvenirsCourants: [souvenir], tourCourant: 5 })
    const permanents = selectionnerSouvenirsPermanents(ctx)
    expect(permanents).toContainEqual(souvenir)
  })

  test('protege toujours les PROMESSES quel que soit le tour', () => {
    const promesse = fabriqueSouvenir({ type: TYPES_SOUVENIR.PROMESSE, importance: 0.1, tour: 1 })
    const ctx = fabriqueCtx({ souvenirsCourants: [promesse], tourCourant: 50 })
    const permanents = selectionnerSouvenirsPermanents(ctx)
    expect(permanents).toContainEqual(promesse)
  })

  test('retourne tableau vide si mémoire vide', () => {
    const ctx = fabriqueCtx({ souvenirsCourants: [] })
    expect(selectionnerSouvenirsPermanents(ctx)).toHaveLength(0)
  })
})

// ─── fusionnerEtPrioriser ─────────────────────────────────────────────────────

describe('fusionnerEtPrioriser', () => {
  test('trie par importance decroissante', () => {
    const s1 = fabriqueSouvenir({ importance: 0.3, tour: 1 })
    const s2 = fabriqueSouvenir({ importance: 0.8, tour: 1 })
    const ctx = fabriqueCtx({ souvenirsCourants: [s1, s2] })
    const fusion = fusionnerEtPrioriser(ctx, [], [s1, s2])
    expect(fusion[0].importance).toBeGreaterThanOrEqual(fusion[1].importance)
  })

  test('integre les candidats nouveaux', () => {
    const ctx       = fabriqueCtx({ souvenirsCourants: [] })
    const candidat  = fabriqueSouvenir({ type: TYPES_SOUVENIR.PROMESSE, importance: 0.85 })
    const fusion    = fusionnerEtPrioriser(ctx, [candidat], [])
    expect(fusion).toContainEqual(candidat)
  })

  test('ne duplique pas les souvenirs existants', () => {
    const souvenir = fabriqueSouvenir({ tour: 1 })
    const ctx      = fabriqueCtx({ souvenirsCourants: [souvenir] })
    const fusion   = fusionnerEtPrioriser(ctx, [], [souvenir])
    const occurrences = fusion.filter(s => s.id === souvenir.id)
    expect(occurrences).toHaveLength(1)
  })

  test('ne modifie pas ctx.souvenirsCourants', () => {
    const souvenir  = fabriqueSouvenir()
    const avant     = [souvenir]
    const ctx       = fabriqueCtx({ souvenirsCourants: avant })
    fusionnerEtPrioriser(ctx, [], [])
    expect(ctx.souvenirsCourants).toHaveLength(1)
  })
})

// ─── appliquerOubli ───────────────────────────────────────────────────────────

describe('appliquerOubli', () => {
  test('ne supprime rien si sous la capacite max', () => {
    const souvenirs = Array.from({ length: 5 }, () => fabriqueSouvenir())
    const ctx       = fabriqueCtx({ capaciteMax: 20, tourCourant: 10 })
    const { oublies } = appliquerOubli(ctx, souvenirs)
    expect(oublies).toHaveLength(0)
  })

  test('supprime les souvenirs de plus faible importance si capacite depassee', () => {
    const souvenirs = Array.from({ length: 22 }, (_, i) =>
      fabriqueSouvenir({ importance: (i + 1) / 22, tour: 1 })
    ).sort((a, b) => b.importance - a.importance)
    const ctx = fabriqueCtx({ capaciteMax: 20, tourCourant: 10 })
    const { conserves, oublies } = appliquerOubli(ctx, souvenirs)
    expect(conserves).toHaveLength(20)
    expect(oublies).toHaveLength(2)
  })

  test('ne supprime jamais un souvenir protege', () => {
    const protege = fabriqueSouvenir({ importance: 0.95, tour: 1 })
    const faibles = Array.from({ length: 21 }, () => fabriqueSouvenir({ importance: 0.1, tour: 1 }))
    const fusion  = [protege, ...faibles]
    const ctx     = fabriqueCtx({ capaciteMax: 20, tourCourant: 10 })
    const { conserves } = appliquerOubli(ctx, fusion)
    expect(conserves).toContainEqual(protege)
  })

  test('ne supprime jamais une promesse', () => {
    const promesse = fabriqueSouvenir({ type: TYPES_SOUVENIR.PROMESSE, importance: 0.1, tour: 1 })
    const faibles  = Array.from({ length: 21 }, () => fabriqueSouvenir({ importance: 0.2, tour: 1 }))
    const fusion   = [promesse, ...faibles]
    const ctx      = fabriqueCtx({ capaciteMax: 20, tourCourant: 10 })
    const { conserves } = appliquerOubli(ctx, fusion)
    expect(conserves).toContainEqual(promesse)
  })

  test('retourne oublies contenant les ids supprimes', () => {
    const faibles = Array.from({ length: 22 }, () =>
      fabriqueSouvenir({ importance: 0.1, tour: 1 })
    )
    const ctx = fabriqueCtx({ capaciteMax: 20, tourCourant: 10 })
    const { oublies, conserves } = appliquerOubli(ctx, faibles)
    oublies.forEach(id => {
      expect(conserves.find(s => s.id === id)).toBeUndefined()
    })
  })
})

// ─── assemblerMiseAJour ───────────────────────────────────────────────────────

describe('assemblerMiseAJour', () => {
  test('produit un MiseAJourMemoire valide', () => {
    const existant   = fabriqueSouvenir()
    const nouveau    = fabriqueSouvenir()
    const ctx        = fabriqueCtx()
    const result     = assemblerMiseAJour(ctx, [existant, nouveau], ['oublie-id'], [nouveau])

    expect(Array.isArray(result.ajoutes)).toBe(true)
    expect(Array.isArray(result.oublies)).toBe(true)
    expect(Array.isArray(result.conserves)).toBe(true)
  })

  test('ajoutes contient uniquement les nouveaux souvenirs (candidats conserves)', () => {
    const ancien  = fabriqueSouvenir({ tour: 1 })
    const nouveau = fabriqueSouvenir({ tour: 5 })
    const ctx     = fabriqueCtx()
    const result  = assemblerMiseAJour(ctx, [ancien, nouveau], [], [nouveau])
    expect(result.ajoutes).toContainEqual(nouveau)
    expect(result.ajoutes).not.toContainEqual(ancien)
  })

  test('conserves ne contient pas les ajoutes', () => {
    const ancien  = fabriqueSouvenir()
    const nouveau = fabriqueSouvenir()
    const ctx     = fabriqueCtx()
    const result  = assemblerMiseAJour(ctx, [ancien, nouveau], [], [nouveau])
    expect(result.conserves).not.toContainEqual(nouveau)
    expect(result.conserves).toContainEqual(ancien)
  })

  test('oublies est transmis tel quel', () => {
    const ctx    = fabriqueCtx()
    const result = assemblerMiseAJour(ctx, [], ['id-1', 'id-2'], [])
    expect(result.oublies).toEqual(['id-1', 'id-2'])
  })
})

// ─── updateMemory — integration ───────────────────────────────────────────────

describe('updateMemory', () => {
  function fabriqueEntrees(overrides = {}) {
    return {
      evenement : {
        intention          : INTENTIONS.CONFIDENCE,
        elementsImportants : ['promesse de fidelite'],
        criteresConernes   : ['relations'],
        contexte           : { moment: MOMENTS_NARRATIFS.DEVELOPPEMENT },
        ...overrides.evenement,
      },
      decision : {
        objectifImmediat   : 'etablir_confiance',
        directionNarrative : 'poser_question',
        attitude           : 'ouverte',
        priorite           : 'normale',
        justification      : { criteresActifs: ['relations'], axiomesAppliques: [10], explication: 'test' },
        ...overrides.decision,
      },
      reponseIA : {
        action   : 'Action du personnage.',
        dialogue : 'Reponse du personnage.',
        meta     : { provider: 'test', tokensEntree: 10, tokensSortie: 20, dureeMs: 300 },
        ...overrides.reponseIA,
      },
      fiches : { personnage: { nom: 'Aldric' } },
      etat   : {
        sessionId    : 'session-1',
        tourCourant  : 3,
        memoireVecue : { souvenirs: [] },
        historique   : [],
        meta         : { langue: 'fr', debutTimestamp: Date.now() },
        ...overrides.etat,
      },
    }
  }

  test('retourne un MiseAJourMemoire valide', () => {
    const { evenement, decision, reponseIA, fiches, etat } = fabriqueEntrees()
    const result = updateMemory(evenement, decision, reponseIA, fiches, etat)
    expect(Array.isArray(result.ajoutes)).toBe(true)
    expect(Array.isArray(result.oublies)).toBe(true)
    expect(Array.isArray(result.conserves)).toBe(true)
  })

  test('ajoute des souvenirs lors d une confidence avec promesse', () => {
    const { evenement, decision, reponseIA, fiches, etat } = fabriqueEntrees()
    const result = updateMemory(evenement, decision, reponseIA, fiches, etat)
    expect(result.ajoutes.length).toBeGreaterThan(0)
  })

  test('ne modifie pas les entrees recues', () => {
    const entrees = fabriqueEntrees()
    const etatAvant = JSON.stringify(entrees.etat)
    updateMemory(entrees.evenement, entrees.decision, entrees.reponseIA, entrees.fiches, entrees.etat)
    expect(JSON.stringify(entrees.etat)).toBe(etatAvant)
  })

  test('ne cree aucun souvenir sur un tour ordinaire sans signal', () => {
    const { evenement, decision, reponseIA, fiches, etat } = fabriqueEntrees({
      evenement : {
        intention          : INTENTIONS.OBSERVATION,
        elementsImportants : [],
        criteresConernes   : [],
        contexte           : { moment: MOMENTS_NARRATIFS.DEVELOPPEMENT },
      },
      decision : {
        objectifImmediat   : '',
        directionNarrative : '',
        attitude           : 'reservee',
        priorite           : 'faible',
        justification      : { criteresActifs: [], axiomesAppliques: [], explication: '' },
      },
    })
    const result = updateMemory(evenement, decision, reponseIA, fiches, etat)
    expect(result.ajoutes).toHaveLength(0)
  })

  test('conserve les souvenirs existants proteges', () => {
    const souvenir = fabriqueSouvenir({ importance: 0.9, tour: 1 })
    const { evenement, decision, reponseIA, fiches, etat } = fabriqueEntrees({
      etat : {
        sessionId    : 'session-1',
        tourCourant  : 10,
        memoireVecue : { souvenirs: [souvenir] },
        historique   : [],
        meta         : { langue: 'fr', debutTimestamp: Date.now() },
      },
      evenement : {
        intention          : INTENTIONS.OBSERVATION,
        elementsImportants : [],
        criteresConernes   : [],
        contexte           : { moment: MOMENTS_NARRATIFS.DEVELOPPEMENT },
      },
      decision : {
        objectifImmediat   : '',
        directionNarrative : '',
        attitude           : 'reservee',
        priorite           : 'faible',
        justification      : { criteresActifs: [], axiomesAppliques: [], explication: '' },
      },
    })
    const result = updateMemory(evenement, decision, reponseIA, fiches, etat)
    expect(result.conserves).toContainEqual(souvenir)
  })

  test('respecte la capacite max et oublie les souvenirs de moindre importance', () => {
    const souvenirs = Array.from({ length: 20 }, () =>
      fabriqueSouvenir({ importance: 0.3, tour: 1 })
    )
    const { evenement, decision, reponseIA, fiches, etat } = fabriqueEntrees({
      etat : {
        sessionId    : 'session-1',
        tourCourant  : 10,
        memoireVecue : { souvenirs },
        historique   : [],
        meta         : { langue: 'fr', debutTimestamp: Date.now() },
      },
    })
    const result = updateMemory(evenement, decision, reponseIA, fiches, etat)
    const total = result.ajoutes.length + result.conserves.length
    expect(total).toBeLessThanOrEqual(20)
  })
})

// ─── appliquerMiseAJour ─────────────────────────────────────────────────────────

describe('appliquerMiseAJour', () => {
  const conserve = { id: 'c1', type: TYPES_SOUVENIR.DIALOGUE, contenu: 'conserve', importance: 0.6, tour: 1 }
  const ajoute   = { id: 'a1', type: TYPES_SOUVENIR.PROMESSE, contenu: 'ajoute',   importance: 0.9, tour: 2 }

  function fabriqueMiseAJour(overrides = {}) {
    return { ajoutes: [], oublies: [], conserves: [], ...overrides }
  }

  test('fusionne conserves et ajoutes dans memoireVecue.souvenirs', () => {
    const result = appliquerMiseAJour(fabriqueMiseAJour({ conserves: [conserve], ajoutes: [ajoute] }))
    expect(result.souvenirs).toHaveLength(2)
  })

  test('trie par importance decroissante', () => {
    const faible = { id: 'f1', type: TYPES_SOUVENIR.DIALOGUE, contenu: 'faible', importance: 0.3, tour: 1 }
    const fort   = { id: 'f2', type: TYPES_SOUVENIR.PROMESSE, contenu: 'fort',   importance: 0.9, tour: 1 }
    const result = appliquerMiseAJour(fabriqueMiseAJour({ conserves: [faible], ajoutes: [fort] }))
    expect(result.souvenirs[0].importance).toBeGreaterThan(result.souvenirs[1].importance)
  })

  test('retourne une MemoireVecue vide si aucun souvenir', () => {
    expect(appliquerMiseAJour(fabriqueMiseAJour())).toEqual({ souvenirs: [] })
  })

  test('ne reinjecte pas les oublies', () => {
    const result = appliquerMiseAJour(
      fabriqueMiseAJour({ conserves: [conserve], oublies: ['x1', 'x2'] })
    )
    expect(result.souvenirs).toHaveLength(1)
    expect(result.souvenirs[0].id).toBe('c1')
  })

  test('ne mute pas les tableaux d entree (write-as-copy)', () => {
    const conserves = [conserve]
    const ajoutes   = [ajoute]
    appliquerMiseAJour(fabriqueMiseAJour({ conserves, ajoutes }))
    expect(conserves).toHaveLength(1)
    expect(ajoutes).toHaveLength(1)
  })

  test('est deterministe (meme entree -> meme sortie)', () => {
    const maj = fabriqueMiseAJour({ conserves: [conserve], ajoutes: [ajoute] })
    expect(appliquerMiseAJour(maj)).toEqual(appliquerMiseAJour(maj))
  })
})
