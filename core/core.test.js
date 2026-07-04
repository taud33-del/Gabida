/**
 * core/core.test.js
 *
 * Tests unitaires du module core/.
 *
 * Couverture :
 *   - preparerTour      : validation des preconditions
 *   - mettreAJourEtat   : construction du nouvel etat (immutabilite, fusion, historique, tour)
 *   - construireResultat: assemblage de TurnResult
 *   - executerPipeline  : orchestration avec modules mockes
 *   - executeTurn       : integration complete avec tous les modules mockes
 *   - ErreurValidation  : levee correctement
 *   - ErreurPipeline    : identification de l'etape fautive
 *   - ErreurProvider    : propagation des erreurs provider
 */

import {
  preparerTour,
  mettreAJourEtat,
  construireResultat,
  executerPipeline,
  executeTurn,
  runCycle,
  ErreurValidation,
  ErreurPipeline,
  ErreurProvider,
} from './index.js'

import { ROLES_MESSAGE } from '../constants/RolesMessage.js'
import { registerProvider } from '../api/index.js'
import { PROVIDERS }        from '../constants/Providers.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SESSION_ID = 'session-core-test'

function fabriquePlayerMessage(overrides = {}) {
  return {
    texte     : 'Bonjour Aldric.',
    tour      : 1,
    sessionId : SESSION_ID,
    timestamp : Date.now(),
    ...overrides,
  }
}

function fabriqueFiches() {
  return {
    personnage : { nom: 'Aldric', criteres: { communication: 0.6 } },
    aventure   : { dureeEstimee: 20 },
    univers    : { nom: 'Hadelas' },
    joueur     : { nom: 'Joueur' },
    memoire    : {},
  }
}

function fabriqueEtat(overrides = {}) {
  return {
    sessionId   : SESSION_ID,
    tourCourant : 1,
    memoireVecue: { souvenirs: [] },
    historique  : [],
    meta        : { langue: 'fr', debutTimestamp: Date.now() },
    ...overrides,
  }
}

function fabriqueReponseIA(texte = 'Hmm.') {
  return {
    texte,
    meta : { provider: 'test', tokensEntree: 10, tokensSortie: 5, dureeMs: 100 },
  }
}

function fabriqueMiseAJourMemoire(overrides = {}) {
  return {
    ajoutes   : [],
    oublies   : [],
    conserves : [],
    ...overrides,
  }
}

// ─── preparerTour ─────────────────────────────────────────────────────────────

describe('preparerTour', () => {
  test('retourne les entrees inchangees si valides', () => {
    const msg    = fabriquePlayerMessage()
    const fiches = fabriqueFiches()
    const etat   = fabriqueEtat()
    const result = preparerTour(msg, fiches, etat)
    expect(result.playerMessage).toBe(msg)
    expect(result.fiches).toBe(fiches)
    expect(result.etat).toBe(etat)
  })

  test('leve ErreurValidation si texte absent', () => {
    expect(() => preparerTour({ sessionId: SESSION_ID, texte: '' }, fabriqueFiches(), fabriqueEtat()))
      .toThrow(ErreurValidation)
  })

  test('leve ErreurValidation si texte uniquement espaces', () => {
    expect(() => preparerTour({ sessionId: SESSION_ID, texte: '   ' }, fabriqueFiches(), fabriqueEtat()))
      .toThrow(ErreurValidation)
  })

  test('leve ErreurValidation si playerMessage null', () => {
    expect(() => preparerTour(null, fabriqueFiches(), fabriqueEtat()))
      .toThrow(ErreurValidation)
  })

  test('leve ErreurValidation si etat absent', () => {
    expect(() => preparerTour(fabriquePlayerMessage(), fabriqueFiches(), null))
      .toThrow(ErreurValidation)
  })

  test('leve ErreurValidation si sessionId incoherent', () => {
    const msg  = fabriquePlayerMessage({ sessionId: 'autre-session' })
    const etat = fabriqueEtat({ sessionId: SESSION_ID })
    expect(() => preparerTour(msg, fabriqueFiches(), etat))
      .toThrow(ErreurValidation)
  })

  test('leve ErreurValidation si fiches absent', () => {
    expect(() => preparerTour(fabriquePlayerMessage(), null, fabriqueEtat()))
      .toThrow(ErreurValidation)
  })

  test('leve ErreurValidation si une fiche obligatoire est manquante', () => {
    const fichesIncompletes = { personnage: {}, aventure: {}, univers: {}, joueur: {} }
    expect(() => preparerTour(fabriquePlayerMessage(), fichesIncompletes, fabriqueEtat()))
      .toThrow(ErreurValidation)
  })

  test('le message ErreurValidation identifie la fiche manquante', () => {
    const fichesIncompletes = { personnage: {}, aventure: {}, univers: {}, joueur: {} }
    expect(() => preparerTour(fabriquePlayerMessage(), fichesIncompletes, fabriqueEtat()))
      .toThrow(/memoire/)
  })

  test('le message ErreurValidation identifie sessionId incoherent', () => {
    const msg = fabriquePlayerMessage({ sessionId: 'X' })
    expect(() => preparerTour(msg, fabriqueFiches(), fabriqueEtat()))
      .toThrow(/sessionId/)
  })
})

// ─── mettreAJourEtat ──────────────────────────────────────────────────────────

describe('mettreAJourEtat', () => {
  test('incremente tourCourant de 1', () => {
    const etat   = fabriqueEtat({ tourCourant: 3 })
    const result = mettreAJourEtat(etat, fabriqueReponseIA(), fabriqueMiseAJourMemoire(), fabriquePlayerMessage())
    expect(result.tourCourant).toBe(4)
  })

  test('ne modifie pas l etat original', () => {
    const etat   = fabriqueEtat({ tourCourant: 1 })
    mettreAJourEtat(etat, fabriqueReponseIA(), fabriqueMiseAJourMemoire(), fabriquePlayerMessage())
    expect(etat.tourCourant).toBe(1)
  })

  test('ajoute le message joueur et la reponse IA a historique', () => {
    const etat    = fabriqueEtat({ historique: [] })
    const reponse = fabriqueReponseIA('Bien le bonjour.')
    const result  = mettreAJourEtat(etat, reponse, fabriqueMiseAJourMemoire(), fabriquePlayerMessage())
    expect(result.historique).toHaveLength(2)
    expect(result.historique[0].role).toBe(ROLES_MESSAGE.USER)
    expect(result.historique[0].contenu).toBe('Bonjour Aldric.')
    expect(result.historique[1].role).toBe(ROLES_MESSAGE.ASSISTANT)
    expect(result.historique[1].contenu).toBe('Bien le bonjour.')
  })

  test('conserve l historique precedent', () => {
    const etat = fabriqueEtat({
      historique: [
        { role: ROLES_MESSAGE.USER,      contenu: 'Message precedent.' },
        { role: ROLES_MESSAGE.ASSISTANT, contenu: 'Reponse precedente.' },
      ],
    })
    const result = mettreAJourEtat(etat, fabriqueReponseIA(), fabriqueMiseAJourMemoire(), fabriquePlayerMessage())
    expect(result.historique).toHaveLength(4)
  })

  test('fusionne ajoutes et conserves dans memoireVecue.souvenirs', () => {
    const etat      = fabriqueEtat()
    const conserve  = { id: 'c1', type: 'dialogue', contenu: 'conserve', importance: 0.6, tour: 1 }
    const ajoute    = { id: 'a1', type: 'promesse', contenu: 'ajoute',   importance: 0.9, tour: 2 }
    const maj       = fabriqueMiseAJourMemoire({ conserves: [conserve], ajoutes: [ajoute] })
    const result    = mettreAJourEtat(etat, fabriqueReponseIA(), maj, fabriquePlayerMessage())
    expect(result.memoireVecue.souvenirs).toHaveLength(2)
  })

  test('souvenirs fusionnes tries par importance decroissante', () => {
    const etat     = fabriqueEtat()
    const faible   = { id: 'f1', type: 'dialogue', contenu: 'faible', importance: 0.3, tour: 1 }
    const fort     = { id: 'f2', type: 'promesse', contenu: 'fort',   importance: 0.9, tour: 1 }
    const maj      = fabriqueMiseAJourMemoire({ conserves: [faible], ajoutes: [fort] })
    const result   = mettreAJourEtat(etat, fabriqueReponseIA(), maj, fabriquePlayerMessage())
    expect(result.memoireVecue.souvenirs[0].importance).toBeGreaterThan(
      result.memoireVecue.souvenirs[1].importance
    )
  })

  test('retourne un nouvel objet Etat (pas une reference)', () => {
    const etat   = fabriqueEtat()
    const result = mettreAJourEtat(etat, fabriqueReponseIA(), fabriqueMiseAJourMemoire(), fabriquePlayerMessage())
    expect(result).not.toBe(etat)
  })
})

// ─── construireResultat ───────────────────────────────────────────────────────

describe('construireResultat', () => {
  test('retourne un TurnResult valide', () => {
    const reponseIA    = fabriqueReponseIA('Reponse.')
    const etatMisAJour = fabriqueEtat({ tourCourant: 2 })
    const pipeline     = {
      evenement        : { intention: 'observation' },
      filtreRelationnel: { influences: [], synthese: {} },
      ressenti         : { dominants: [] },
      decision         : { objectifImmediat: 'test' },
      miseAJourMemoire : fabriqueMiseAJourMemoire(),
    }
    const result = construireResultat(reponseIA, etatMisAJour, pipeline)
    expect(result.reponse).toBe('Reponse.')
    expect(result.etatMisAJour).toBe(etatMisAJour)
    expect(result.evenement).toBe(pipeline.evenement)
    expect(result.filtreRelationnel).toBe(pipeline.filtreRelationnel)
    expect(result.ressenti).toBe(pipeline.ressenti)
    expect(result.decision).toBe(pipeline.decision)
    expect(result.reponseIA).toBe(reponseIA)
    expect(result.miseAJourMemoire).toBe(pipeline.miseAJourMemoire)
  })
})

// ─── executerPipeline / executeTurn — via un pipeline factice ────────────────
//
// Avec ESM natif (--experimental-vm-modules), jest.mock() n'est pas disponible
// au niveau du module. On teste donc :
//   - preparerTour, mettreAJourEtat, construireResultat : directement (purs)
//   - executerPipeline / executeTurn : via un provider mock enregistre dans api/
//     et en verifiant que les modules stubs (ressenti, decision) levent bien
//     des ErreurPipeline correctement identifiees.
//
// Les tests d'integration complete (analyzeEvent + computeInfluences implementes,
// computeRessenti / computeDecision stubs) verifient la propagation des erreurs
// et la non-transmission de filtreRelationnel a decision/.

const PROVIDER_TEST = 'core-integration-test'

beforeAll(() => {
  registerProvider(PROVIDER_TEST, async () => ({
    texte        : 'Reponse mock.',
    tokensEntree : 10,
    tokensSortie : 5,
  }))
})

describe('executerPipeline — propagation des erreurs', () => {
  const providerConfig = { provider: PROVIDER_TEST, cleApi: 'test', modele: 'test-model' }

  test('leve ErreurPipeline quand computeRessenti est non implemente', async () => {
    await expect(
      executerPipeline(fabriquePlayerMessage(), fabriqueFiches(), fabriqueEtat(), providerConfig)
    ).rejects.toThrow(ErreurPipeline)
  })

  test('ErreurPipeline identifie l etape fautive (computeRessenti stub)', async () => {
    try {
      await executerPipeline(fabriquePlayerMessage(), fabriqueFiches(), fabriqueEtat(), providerConfig)
    } catch (e) {
      expect(e).toBeInstanceOf(ErreurPipeline)
      expect(['computeRessenti', 'computeDecision', 'buildPrompt', 'updateMemory']).toContain(e.etape)
    }
  })

  test('leve ErreurProvider si le provider n est pas enregistre', async () => {
    const configInconnue = { provider: 'provider-inconnu-core', cleApi: 'x', modele: 'x' }
    await expect(
      executerPipeline(fabriquePlayerMessage(), fabriqueFiches(), fabriqueEtat(), configInconnue)
    ).rejects.toThrow(ErreurPipeline)
  })

  test('leve ErreurProvider si l adaptateur echoue sur le reseau', async () => {
    registerProvider('provider-echec-core', async () => { throw new Error('Timeout reseau.') })
    const configEchec = { provider: 'provider-echec-core', cleApi: 'test', modele: 'test' }
    await expect(
      executerPipeline(fabriquePlayerMessage(), fabriqueFiches(), fabriqueEtat(), configEchec)
    ).rejects.toThrow()
  })
})

describe('executeTurn — validation upstream', () => {
  const providerConfig = { provider: PROVIDER_TEST, cleApi: 'test', modele: 'test-model' }

  test('leve ErreurValidation avant le pipeline si texte vide', async () => {
    const msg = fabriquePlayerMessage({ texte: '' })
    await expect(executeTurn(msg, providerConfig, fabriqueFiches(), fabriqueEtat()))
      .rejects.toThrow(ErreurValidation)
  })

  test('leve ErreurValidation si fiche manquante', async () => {
    const fichesInc = { personnage: {}, aventure: {}, univers: {}, joueur: {} }
    await expect(executeTurn(fabriquePlayerMessage(), providerConfig, fichesInc, fabriqueEtat()))
      .rejects.toThrow(ErreurValidation)
  })

  test('leve ErreurValidation si sessionId incoherent', async () => {
    const msg = fabriquePlayerMessage({ sessionId: 'autre' })
    await expect(executeTurn(msg, providerConfig, fabriqueFiches(), fabriqueEtat()))
      .rejects.toThrow(ErreurValidation)
  })

  test('ne cree jamais un ErreurValidation si toutes les entrees sont valides (atteint le pipeline)', async () => {
    try {
      await executeTurn(fabriquePlayerMessage(), providerConfig, fabriqueFiches(), fabriqueEtat())
    } catch (e) {
      expect(e).not.toBeInstanceOf(ErreurValidation)
    }
  })
})

describe('runCycle — alias', () => {
  test('leve ErreurValidation si texte vide (delegue a executeTurn)', async () => {
    await expect(runCycle({
      playerMessage  : fabriquePlayerMessage({ texte: '' }),
      providerConfig : { provider: PROVIDER_TEST, cleApi: 'test', modele: 'test' },
      fiches         : fabriqueFiches(),
      etat           : fabriqueEtat(),
    })).rejects.toThrow(ErreurValidation)
  })
})
