/**
 * sauvegarde/sauvegarde.test.js
 *
 * Tests unitaires du module sauvegarde/.
 *
 * Couverture :
 *   - registerStorageAdapter : enregistrement, validation
 *   - serialiserEtat / deserialiserEtat : fonctions pures
 *   - saveState    : pipeline complet avec adaptateur mock
 *   - loadState    : pipeline complet avec adaptateur mock
 *   - deleteState  : pipeline complet avec adaptateur mock
 *   - listSessions : pipeline complet avec adaptateur mock
 *   - Erreurs      : tous les types d'erreurs documentes
 *   - Versionnage  : format invalide, inconnu, compatible
 *
 * Strategie : les I/O sont completement isolees via un adaptateur en memoire.
 * Aucun acces disque dans ce fichier de tests.
 */

import {
  registerStorageAdapter,
  getAdapters,
  saveState,
  loadState,
  deleteState,
  listSessions,
  serialiserEtat,
  deserialiserEtat,
  FORMAT_VERSION,
  ENGINE_VERSION,
  ErreurSauvegarde,
  ErreurAdaptateurAbsent,
  ErreurSessionAbsente,
  ErreurLecture,
  ErreurEcriture,
  ErreurCorruption,
  ErreurFormatIncompatible,
  ErreurValidationSauvegarde,
} from './index.js'

// ─── Adaptateur memoire (stub sans I/O) ──────────────────────────────────────

function creerAdaptateurMemoire(stockInitial = {}) {
  const stock = { ...stockInitial }
  return {
    async save(sessionId, donnees) { stock[sessionId] = donnees },
    async load(sessionId)         { return stock[sessionId] ?? null },
    async delete(sessionId)       { delete stock[sessionId] },
    async list() {
      return Object.values(stock).map(d => {
        const p = JSON.parse(d)
        return {
          sessionId     : p.meta.sessionId,
          tourCourant   : p.etat.tourCourant,
          savedAt       : p.meta.savedAt,
          formatVersion : p.meta.formatVersion,
          engineVersion : p.meta.engineVersion,
        }
      })
    },
    _stock: stock,
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function fabriqueEtat(overrides = {}) {
  return {
    sessionId    : 'session-test-001',
    tourCourant  : 5,
    memoireVecue : { souvenirs: [] },
    historique   : [
      { role: 'user',      contenu: 'Bonjour.' },
      { role: 'assistant', contenu: 'Hmm.' },
    ],
    meta : { langue: 'fr', debutTimestamp: 1719990000000 },
    ...overrides,
  }
}

const ADAPTER_NOM = 'memoire-test'
let   adaptateurTest

beforeEach(() => {
  adaptateurTest = creerAdaptateurMemoire()
  registerStorageAdapter(ADAPTER_NOM, adaptateurTest)
})

// ─── registerStorageAdapter ───────────────────────────────────────────────────

describe('registerStorageAdapter', () => {
  test('enregistre un adaptateur valide', () => {
    const nom = 'test-register-' + Date.now()
    registerStorageAdapter(nom, creerAdaptateurMemoire())
    expect(getAdapters()).toContain(nom)
  })

  test('leve ErreurValidationSauvegarde si name invalide', () => {
    expect(() => registerStorageAdapter('', creerAdaptateurMemoire()))
      .toThrow(ErreurValidationSauvegarde)
  })

  test('leve ErreurValidationSauvegarde si adapter sans methode save', () => {
    expect(() => registerStorageAdapter('x', { load: async () => null }))
      .toThrow(ErreurValidationSauvegarde)
  })

  test('leve ErreurValidationSauvegarde si adapter sans methode load', () => {
    expect(() => registerStorageAdapter('x', { save: async () => {} }))
      .toThrow(ErreurValidationSauvegarde)
  })

  test('ecrase silencieusement un adaptateur deja enregistre', () => {
    const nom  = 'test-ecrase-' + Date.now()
    const ada1 = creerAdaptateurMemoire()
    const ada2 = creerAdaptateurMemoire()
    registerStorageAdapter(nom, ada1)
    registerStorageAdapter(nom, ada2)
    expect(getAdapters()).toContain(nom)
  })
})

// ─── serialiserEtat ───────────────────────────────────────────────────────────

describe('serialiserEtat', () => {
  test('retourne une chaine JSON valide', () => {
    const json = serialiserEtat(fabriqueEtat(), Date.now())
    expect(() => JSON.parse(json)).not.toThrow()
  })

  test('inclut meta.formatVersion = FORMAT_VERSION', () => {
    const parsed = JSON.parse(serialiserEtat(fabriqueEtat(), Date.now()))
    expect(parsed.meta.formatVersion).toBe(FORMAT_VERSION)
  })

  test('inclut meta.engineVersion = ENGINE_VERSION', () => {
    const parsed = JSON.parse(serialiserEtat(fabriqueEtat(), Date.now()))
    expect(parsed.meta.engineVersion).toBe(ENGINE_VERSION)
  })

  test('inclut meta.sessionId = etat.sessionId', () => {
    const etat   = fabriqueEtat({ sessionId: 'session-xyz' })
    const parsed = JSON.parse(serialiserEtat(etat, Date.now()))
    expect(parsed.meta.sessionId).toBe('session-xyz')
  })

  test('inclut meta.savedAt fourni', () => {
    const ts     = 1720000000000
    const parsed = JSON.parse(serialiserEtat(fabriqueEtat(), ts))
    expect(parsed.meta.savedAt).toBe(ts)
  })

  test('etat dans l enveloppe est identique a l etat source', () => {
    const etat   = fabriqueEtat()
    const parsed = JSON.parse(serialiserEtat(etat, Date.now()))
    expect(parsed.etat.sessionId).toBe(etat.sessionId)
    expect(parsed.etat.tourCourant).toBe(etat.tourCourant)
  })

  test('ne modifie pas l etat source', () => {
    const etat  = fabriqueEtat()
    const avant = JSON.stringify(etat)
    serialiserEtat(etat, Date.now())
    expect(JSON.stringify(etat)).toBe(avant)
  })
})

// ─── deserialiserEtat ─────────────────────────────────────────────────────────

describe('deserialiserEtat', () => {
  test('retourne EtatSauvegarde valide depuis JSON correct', () => {
    const etat    = fabriqueEtat()
    const json    = serialiserEtat(etat, Date.now())
    const result  = deserialiserEtat(json, etat.sessionId)
    expect(result.etat.sessionId).toBe(etat.sessionId)
    expect(result.meta.formatVersion).toBe(FORMAT_VERSION)
  })

  test('leve ErreurCorruption si JSON invalide', () => {
    expect(() => deserialiserEtat('{invalide json', 'session-x'))
      .toThrow(ErreurCorruption)
  })

  test('leve ErreurCorruption si meta absent', () => {
    const json = JSON.stringify({ etat: fabriqueEtat() })
    expect(() => deserialiserEtat(json, 'session-x'))
      .toThrow(ErreurCorruption)
  })

  test('leve ErreurCorruption si etat absent', () => {
    const json = JSON.stringify({ meta: { formatVersion: FORMAT_VERSION } })
    expect(() => deserialiserEtat(json, 'session-x'))
      .toThrow(ErreurCorruption)
  })

  test('leve ErreurFormatIncompatible si formatVersion inconnue', () => {
    const json = JSON.stringify({
      meta : { formatVersion: '99.0', sessionId: 'x', savedAt: 1, engineVersion: '1.0.0' },
      etat : fabriqueEtat(),
    })
    expect(() => deserialiserEtat(json, 'session-x'))
      .toThrow(ErreurFormatIncompatible)
  })

  test('ErreurFormatIncompatible contient la version fautive', () => {
    const json = JSON.stringify({
      meta : { formatVersion: '0.1', sessionId: 'x', savedAt: 1, engineVersion: '1.0.0' },
      etat : fabriqueEtat(),
    })
    try {
      deserialiserEtat(json, 'session-x')
    } catch (e) {
      expect(e.version).toBe('0.1')
    }
  })
})

// ─── saveState ────────────────────────────────────────────────────────────────

describe('saveState', () => {
  test('retourne ResultatSauvegarde valide', async () => {
    const result = await saveState(fabriqueEtat(), ADAPTER_NOM)
    expect(result.success).toBe(true)
    expect(result.sessionId).toBe('session-test-001')
    expect(typeof result.savedAt).toBe('number')
    expect(result.formatVersion).toBe(FORMAT_VERSION)
  })

  test('ecrit les donnees dans l adaptateur', async () => {
    const etat = fabriqueEtat({ sessionId: 'session-write-test' })
    await saveState(etat, ADAPTER_NOM)
    const donnees = adaptateurTest._stock['session-write-test']
    expect(donnees).toBeDefined()
    expect(JSON.parse(donnees).meta.sessionId).toBe('session-write-test')
  })

  test('ne modifie pas l etat recu', async () => {
    const etat  = fabriqueEtat()
    const avant = JSON.stringify(etat)
    await saveState(etat, ADAPTER_NOM)
    expect(JSON.stringify(etat)).toBe(avant)
  })

  test('leve ErreurAdaptateurAbsent si adaptateur inconnu', async () => {
    await expect(saveState(fabriqueEtat(), 'adaptateur-inconnu-xyz'))
      .rejects.toThrow(ErreurAdaptateurAbsent)
  })

  test('leve ErreurValidationSauvegarde si etat.sessionId vide', async () => {
    await expect(saveState(fabriqueEtat({ sessionId: '' }), ADAPTER_NOM))
      .rejects.toThrow(ErreurValidationSauvegarde)
  })

  test('leve ErreurValidationSauvegarde si etat.tourCourant invalide', async () => {
    await expect(saveState(fabriqueEtat({ tourCourant: 0 }), ADAPTER_NOM))
      .rejects.toThrow(ErreurValidationSauvegarde)
  })

  test('leve ErreurValidationSauvegarde si historique absent', async () => {
    const etat = fabriqueEtat()
    delete etat.historique
    await expect(saveState(etat, ADAPTER_NOM))
      .rejects.toThrow(ErreurValidationSauvegarde)
  })

  test('leve ErreurEcriture si l adaptateur echoue', async () => {
    const adaptateurEchec = {
      save  : async () => { throw new Error('Disque plein.') },
      load  : async () => null,
      delete: async () => {},
      list  : async () => [],
    }
    registerStorageAdapter('echec-ecriture', adaptateurEchec)
    await expect(saveState(fabriqueEtat(), 'echec-ecriture'))
      .rejects.toThrow(ErreurEcriture)
  })
})

// ─── loadState ────────────────────────────────────────────────────────────────

describe('loadState', () => {
  test('retourne ResultatChargement valide apres saveState', async () => {
    const etat = fabriqueEtat()
    await saveState(etat, ADAPTER_NOM)
    const result = await loadState('session-test-001', ADAPTER_NOM)
    expect(result.success).toBe(true)
    expect(result.sessionId).toBe('session-test-001')
    expect(result.etat.sessionId).toBe('session-test-001')
    expect(result.etat.tourCourant).toBe(5)
    expect(result.meta.formatVersion).toBe(FORMAT_VERSION)
  })

  test('restaure fidelement l historique', async () => {
    const etat = fabriqueEtat()
    await saveState(etat, ADAPTER_NOM)
    const result = await loadState('session-test-001', ADAPTER_NOM)
    expect(result.etat.historique).toHaveLength(2)
    expect(result.etat.historique[0].contenu).toBe('Bonjour.')
  })

  test('restaure fidelement la memoireVecue', async () => {
    const souvenir = { id: 'uuid-1', type: 'promesse', contenu: 'Test.', importance: 0.8, tour: 3 }
    const etat     = fabriqueEtat({ memoireVecue: { souvenirs: [souvenir] } })
    await saveState(etat, ADAPTER_NOM)
    const result = await loadState('session-test-001', ADAPTER_NOM)
    expect(result.etat.memoireVecue.souvenirs).toHaveLength(1)
    expect(result.etat.memoireVecue.souvenirs[0].id).toBe('uuid-1')
  })

  test('leve ErreurSessionAbsente si sessionId inconnu', async () => {
    await expect(loadState('session-inconnue-zzz', ADAPTER_NOM))
      .rejects.toThrow(ErreurSessionAbsente)
  })

  test('ErreurSessionAbsente contient le sessionId fautif', async () => {
    try {
      await loadState('session-manquante', ADAPTER_NOM)
    } catch (e) {
      expect(e.sessionId).toBe('session-manquante')
    }
  })

  test('leve ErreurAdaptateurAbsent si adaptateur inconnu', async () => {
    await expect(loadState('session-test-001', 'inconnu-xyz'))
      .rejects.toThrow(ErreurAdaptateurAbsent)
  })

  test('leve ErreurValidationSauvegarde si sessionId vide', async () => {
    await expect(loadState('', ADAPTER_NOM))
      .rejects.toThrow(ErreurValidationSauvegarde)
  })

  test('leve ErreurCorruption si donnees corrompues', async () => {
    adaptateurTest._stock['session-corrompue'] = '{json invalide !'
    await expect(loadState('session-corrompue', ADAPTER_NOM))
      .rejects.toThrow(ErreurCorruption)
  })

  test('leve ErreurFormatIncompatible si formatVersion inconnue en stock', async () => {
    adaptateurTest._stock['session-vieille'] = JSON.stringify({
      meta : { formatVersion: '0.0', sessionId: 'session-vieille', savedAt: 1, engineVersion: '0.0.0' },
      etat : fabriqueEtat({ sessionId: 'session-vieille' }),
    })
    await expect(loadState('session-vieille', ADAPTER_NOM))
      .rejects.toThrow(ErreurFormatIncompatible)
  })

  test('leve ErreurLecture si l adaptateur echoue', async () => {
    const adaptateurEchec = {
      save  : async () => {},
      load  : async () => { throw new Error('Timeout I/O.') },
      delete: async () => {},
      list  : async () => [],
    }
    registerStorageAdapter('echec-lecture', adaptateurEchec)
    await expect(loadState('session-x', 'echec-lecture'))
      .rejects.toThrow(ErreurLecture)
  })
})

// ─── deleteState ──────────────────────────────────────────────────────────────

describe('deleteState', () => {
  test('retourne ResultatSuppression valide', async () => {
    const etat = fabriqueEtat({ sessionId: 'session-del-001' })
    await saveState(etat, ADAPTER_NOM)
    const result = await deleteState('session-del-001', ADAPTER_NOM)
    expect(result.success).toBe(true)
    expect(result.sessionId).toBe('session-del-001')
    expect(typeof result.timestamp).toBe('number')
  })

  test('la session est absente apres deleteState', async () => {
    const etat = fabriqueEtat({ sessionId: 'session-del-002' })
    await saveState(etat, ADAPTER_NOM)
    await deleteState('session-del-002', ADAPTER_NOM)
    await expect(loadState('session-del-002', ADAPTER_NOM))
      .rejects.toThrow(ErreurSessionAbsente)
  })

  test('ne leve pas d erreur si session deja absente', async () => {
    await expect(deleteState('session-jamais-sauvee', ADAPTER_NOM))
      .resolves.toBeDefined()
  })

  test('leve ErreurAdaptateurAbsent si adaptateur inconnu', async () => {
    await expect(deleteState('session-x', 'inconnu-abc'))
      .rejects.toThrow(ErreurAdaptateurAbsent)
  })

  test('leve ErreurValidationSauvegarde si sessionId vide', async () => {
    await expect(deleteState('', ADAPTER_NOM))
      .rejects.toThrow(ErreurValidationSauvegarde)
  })
})

// ─── listSessions ─────────────────────────────────────────────────────────────

describe('listSessions', () => {
  test('retourne tableau vide si aucune session', async () => {
    const nom = 'memoire-liste-vide-' + Date.now()
    registerStorageAdapter(nom, creerAdaptateurMemoire())
    const result = await listSessions(nom)
    expect(result).toHaveLength(0)
  })

  test('retourne les resumes des sessions sauvegardees', async () => {
    const etat1 = fabriqueEtat({ sessionId: 'session-list-a', tourCourant: 3 })
    const etat2 = fabriqueEtat({ sessionId: 'session-list-b', tourCourant: 7 })
    const nom   = 'memoire-liste-' + Date.now()
    registerStorageAdapter(nom, creerAdaptateurMemoire())
    await saveState(etat1, nom)
    await saveState(etat2, nom)
    const result = await listSessions(nom)
    expect(result).toHaveLength(2)
    const ids = result.map(r => r.sessionId)
    expect(ids).toContain('session-list-a')
    expect(ids).toContain('session-list-b')
  })

  test('chaque resume contient les champs obligatoires', async () => {
    const etat = fabriqueEtat({ sessionId: 'session-list-champs', tourCourant: 4 })
    const nom  = 'memoire-champs-' + Date.now()
    registerStorageAdapter(nom, creerAdaptateurMemoire())
    await saveState(etat, nom)
    const result = await listSessions(nom)
    const resume = result[0]
    expect(resume.sessionId).toBeDefined()
    expect(typeof resume.tourCourant).toBe('number')
    expect(typeof resume.savedAt).toBe('number')
    expect(resume.formatVersion).toBe(FORMAT_VERSION)
    expect(resume.engineVersion).toBe(ENGINE_VERSION)
  })

  test('leve ErreurAdaptateurAbsent si adaptateur inconnu', async () => {
    await expect(listSessions('inconnu-list-xyz'))
      .rejects.toThrow(ErreurAdaptateurAbsent)
  })
})

// ─── Cycle complet save → load → delete ──────────────────────────────────────

describe('cycle complet save → load → delete', () => {
  test('etat restaure est identique a l etat sauvegarde', async () => {
    const etat = fabriqueEtat({
      sessionId    : 'session-cycle-001',
      tourCourant  : 12,
      memoireVecue : { souvenirs: [{ id: 'u1', type: 'promesse', contenu: 'Test.', importance: 0.9, tour: 5 }] },
    })
    await saveState(etat, ADAPTER_NOM)
    const { etat: restaure } = (await loadState('session-cycle-001', ADAPTER_NOM))
    expect(restaure.sessionId).toBe(etat.sessionId)
    expect(restaure.tourCourant).toBe(etat.tourCourant)
    expect(restaure.memoireVecue.souvenirs[0].id).toBe('u1')
    await deleteState('session-cycle-001', ADAPTER_NOM)
    await expect(loadState('session-cycle-001', ADAPTER_NOM)).rejects.toThrow(ErreurSessionAbsente)
  })
})
