import { jest } from '@jest/globals'
import { ErreurValidation } from '../index.js'
import {
  CODES_ERREUR_RESOLUTION_CONFLIT,
  ErreurResolutionConflit,
  TYPES_CONFLIT_ACTION,
  normaliserConfigurationResolutionConflits,
  resoudreConflitsActions,
} from './index.js'

function intention(id, participantId, priorite = 100, ordreCreation = 0, conflit = undefined) {
  return {
    id, participantId, type: 'action', priorite, ordreCreation,
    cibleId: null, contenu: null, statut: 'retenue',
    metadata: conflit === undefined ? {} : { conflit },
  }
}

function entrees(intentions, ressourcesDisponibles = {}) {
  return {
    intentionsRetenues: intentions,
    planificationsExecution: intentions.map((item, ordreExecution) => ({
      participantId: item.participantId,
      intentionId: item.id,
      ordreExecution,
      mode: 'intention_metier',
    })),
    ressourcesDisponibles,
  }
}

describe('RFC-012 - resolution deterministe des conflits', () => {
  test('accepte aucune intention et une intention unique', () => {
    expect(resoudreConflitsActions(entrees([])).ordreExecutionFinal).toEqual([])
    expect(resoudreConflitsActions(entrees([intention('a', 'p')])).ordreExecutionFinal).toEqual(['a'])
  })

  test('conserve plusieurs intentions sans conflit dans l ordre RFC-011', () => {
    const resultat = resoudreConflitsActions(entrees([
      intention('b', 'b', 100, 1), intention('a', 'a', 200, 2),
    ]))
    expect(resultat.ordreExecutionFinal).toEqual(['a', 'b'])
    expect(resultat.conflitsDetectes).toEqual([])
  })

  test('resout une cible exclusive par priorite', () => {
    const resultat = resoudreConflitsActions(entrees([
      intention('faible', 'a', 100, 0, { cleExclusivite: 'objet:epee' }),
      intention('forte', 'b', 200, 1, { cleExclusivite: 'objet:epee' }),
    ]))
    expect(resultat.ordreExecutionFinal).toEqual(['forte'])
    expect(resultat.intentionsEcarteesParConflit[0]).toMatchObject({
      id: 'faible', typeConflit: TYPES_CONFLIT_ACTION.CIBLE_EXCLUSIVE,
      intentionGagnanteId: 'forte',
    })
  })

  test('resout les incompatibilites explicites sans inference textuelle', () => {
    const resultat = resoudreConflitsActions(entrees([
      intention('a', 'a', 200, 0, { idsIntentionsIncompatibles: ['b'] }),
      intention('b', 'b', 100, 1),
    ]))
    expect(resultat.conflitsDetectes[0].type).toBe(TYPES_CONFLIT_ACTION.MUTUELLEMENT_EXCLUSIVES)
    expect(resultat.ordreExecutionFinal).toEqual(['a'])
  })

  test('departage par FIFO puis participantId puis id', () => {
    const conflit = { cleExclusivite: 'unique' }
    expect(resoudreConflitsActions(entrees([
      intention('tard', 'a', 100, 2, conflit), intention('tot', 'z', 100, 1, conflit),
    ])).ordreExecutionFinal).toEqual(['tot'])
    expect(resoudreConflitsActions(entrees([
      intention('z', 'b', 100, 1, conflit), intention('z-a', 'a', 100, 1, conflit),
    ])).ordreExecutionFinal).toEqual(['z-a'])
    expect(resoudreConflitsActions(entrees([
      intention('z', 'a', 100, 1, conflit), intention('a', 'a2', 100, 1, conflit),
    ])).ordreExecutionFinal).toEqual(['z'])
  })

  test('alloue une ressource suffisamment capacitaire', () => {
    const demandes = [
      intention('a', 'a', 200, 0, { ressourcesConsommees: [{ ressourceId: 'r', quantite: 1 }] }),
      intention('b', 'b', 100, 1, { ressourcesConsommees: [{ ressourceId: 'r', quantite: 1 }] }),
    ]
    expect(resoudreConflitsActions(entrees(demandes, { r: 2 })).ordreExecutionFinal).toEqual(['a', 'b'])
  })

  test('ecarte atomiquement une consommation insuffisante', () => {
    const demandes = [
      intention('trop', 'a', 200, 0, { ressourcesConsommees: [
        { ressourceId: 'a', quantite: 1 }, { ressourceId: 'b', quantite: 2 },
      ] }),
      intention('apres', 'b', 100, 1, { ressourcesConsommees: [{ ressourceId: 'a', quantite: 1 }] }),
    ]
    const resultat = resoudreConflitsActions(entrees(demandes, { a: 1, b: 1 }))
    expect(resultat.ordreExecutionFinal).toEqual(['apres'])
    expect(resultat.intentionsEcarteesParConflit[0].typeConflit)
      .toBe(TYPES_CONFLIT_ACTION.RESSOURCE_INSUFFISANTE)
  })

  test('respecte une dependance satisfaite et son ordre', () => {
    const resultat = resoudreConflitsActions(entrees([
      intention('b', 'b', 300, 0, { idsIntentionsRequises: ['a'] }),
      intention('a', 'a', 100, 1),
    ]))
    expect(resultat.ordreExecutionFinal).toEqual(['a', 'b'])
  })

  test('propage une dependance non satisfaite', () => {
    const resultat = resoudreConflitsActions(entrees([
      intention('gagnante', 'g', 300, 0, { cleExclusivite: 'x' }),
      intention('requise', 'r', 200, 1, { cleExclusivite: 'x' }),
      intention('dependante', 'd', 100, 2, { idsIntentionsRequises: ['requise'] }),
    ]))
    expect(resultat.ordreExecutionFinal).toEqual(['gagnante'])
    expect(resultat.intentionsEcarteesParConflit.map(item => item.id)).toEqual(['requise', 'dependante'])
  })

  test('realloue une ressource apres invalidation de la gagnante par dependance', () => {
    const resultat = resoudreConflitsActions(entrees([
      intention('x', 'x', 300, 0, { cleExclusivite: 'x' }),
      intention('a', 'a', 200, 1, {
        idsIntentionsRequises: ['x'],
        ressourcesConsommees: [{ ressourceId: 'r', quantite: 1 }],
      }),
      intention('b', 'b', 100, 2, {
        ressourcesConsommees: [{ ressourceId: 'r', quantite: 1 }],
      }),
      intention('bloque-x', 'z', 400, 3, { cleExclusivite: 'x' }),
    ], { r: 1 }))
    expect(resultat.ordreExecutionFinal).toEqual(['bloque-x', 'b'])
    expect(resultat.intentionsEcarteesParConflit.map(item => item.id)).toEqual(['x', 'a'])
  })

  test('realloue une cle exclusive apres invalidation de la gagnante par dependance', () => {
    const resultat = resoudreConflitsActions(entrees([
      intention('x', 'x', 300, 0, { cleExclusivite: 'condition' }),
      intention('a', 'a', 200, 1, {
        idsIntentionsRequises: ['x'], cleExclusivite: 'action-exclusive',
      }),
      intention('b', 'b', 100, 2, { cleExclusivite: 'action-exclusive' }),
      intention('bloque-x', 'z', 400, 3, { cleExclusivite: 'condition' }),
    ]))
    expect(resultat.ordreExecutionFinal).toEqual(['bloque-x', 'b'])
    expect(resultat.intentionsEcarteesParConflit.map(item => item.id)).toEqual(['x', 'a'])
  })

  test('libere les ressources apres une cascade de dependances', () => {
    const resultat = resoudreConflitsActions(entrees([
      intention('c', 'c', 300, 0, { cleExclusivite: 'condition' }),
      intention('b', 'b', 250, 1, {
        idsIntentionsRequises: ['c'],
        ressourcesConsommees: [{ ressourceId: 'r', quantite: 1 }],
      }),
      intention('a', 'a', 200, 2, {
        idsIntentionsRequises: ['b'],
        ressourcesConsommees: [{ ressourceId: 's', quantite: 1 }],
      }),
      intention('apres-r', 'd', 100, 3, {
        ressourcesConsommees: [{ ressourceId: 'r', quantite: 1 }],
      }),
      intention('apres-s', 'e', 90, 4, {
        ressourcesConsommees: [{ ressourceId: 's', quantite: 1 }],
      }),
      intention('bloque-c', 'z', 400, 5, { cleExclusivite: 'condition' }),
    ], { r: 1, s: 1 }))
    expect(resultat.ordreExecutionFinal).toEqual(['bloque-c', 'apres-r', 'apres-s'])
    expect(resultat.intentionsEcarteesParConflit.map(item => item.id)).toEqual(['c', 'b', 'a'])
  })

  test('reproduit exactement le point fixe de resolution', () => {
    const entree = entrees([
      intention('x', 'x', 300, 0, { cleExclusivite: 'condition' }),
      intention('a', 'a', 200, 1, {
        idsIntentionsRequises: ['x'],
        ressourcesConsommees: [{ ressourceId: 'r', quantite: 1 }],
      }),
      intention('b', 'b', 100, 2, {
        ressourcesConsommees: [{ ressourceId: 'r', quantite: 1 }],
      }),
      intention('bloque-x', 'z', 400, 3, { cleExclusivite: 'condition' }),
    ], { r: 1 })
    expect(resoudreConflitsActions(entree)).toEqual(resoudreConflitsActions(entree))
  })

  test('rejette une dependance inconnue avant resolution', () => {
    expect(() => resoudreConflitsActions(entrees([
      intention('a', 'a', 100, 0, { idsIntentionsRequises: ['absente'] }),
    ]))).toThrow(expect.objectContaining({ code: CODES_ERREUR_RESOLUTION_CONFLIT.REFERENCE_INTENTION_INCONNUE }))
  })

  test('rejette les cycles de dependances', () => {
    expect(() => resoudreConflitsActions(entrees([
      intention('a', 'a', 100, 0, { idsIntentionsRequises: ['b'] }),
      intention('b', 'b', 100, 1, { idsIntentionsRequises: ['a'] }),
    ]))).toThrow(expect.objectContaining({ code: CODES_ERREUR_RESOLUTION_CONFLIT.CYCLE_DEPENDANCES }))
  })

  test('applique ordreAvant et ordreApres', () => {
    expect(resoudreConflitsActions(entrees([
      intention('a', 'a', 100, 0, { ordreApres: ['b'] }), intention('b', 'b', 100, 1),
    ])).ordreExecutionFinal).toEqual(['b', 'a'])
    expect(resoudreConflitsActions(entrees([
      intention('a', 'a', 100, 0, { ordreAvant: ['b'] }), intention('b', 'b', 200, 1),
    ])).ordreExecutionFinal).toEqual(['a', 'b'])
  })

  test('rejette un cycle d ordre', () => {
    expect(() => resoudreConflitsActions(entrees([
      intention('a', 'a', 100, 0, { ordreAvant: ['b'] }),
      intention('b', 'b', 100, 1, { ordreAvant: ['a'] }),
    ]))).toThrow(expect.objectContaining({ code: CODES_ERREUR_RESOLUTION_CONFLIT.CYCLE_ORDRE }))
  })

  test('produit des identifiants reproductibles et ne mute rien', () => {
    const entree = entrees([
      intention('b', 'b', 100, 1, { cleExclusivite: 'x' }),
      intention('a', 'a', 200, 0, { cleExclusivite: 'x' }),
    ])
    const copie = structuredClone(entree)
    const un = resoudreConflitsActions(entree)
    const deux = resoudreConflitsActions(entree)
    expect(un).toEqual(deux)
    expect(un.conflitsDetectes[0].id).toBe('conflit:cible_exclusive:a:b')
    expect(entree).toEqual(copie)
  })

  test('ne consulte ni Date.now ni Math.random', () => {
    const now = jest.spyOn(Date, 'now').mockImplementation(() => { throw new Error('temps interdit') })
    const random = jest.spyOn(Math, 'random').mockImplementation(() => { throw new Error('hasard interdit') })
    expect(() => resoudreConflitsActions(entrees([intention('a', 'a')]))).not.toThrow()
    now.mockRestore(); random.mockRestore()
  })

  test('valide configuration, ressources et planifications avec une erreur dediee', () => {
    expect(normaliserConfigurationResolutionConflits({ active: false })).toEqual({ active: false })
    expect(() => normaliserConfigurationResolutionConflits({ active: true, ressourcesDisponibles: { r: -1 } }))
      .toThrow(ErreurResolutionConflit)
    try { normaliserConfigurationResolutionConflits({ active: 'oui' }) } catch (error) {
      expect(error).toBeInstanceOf(ErreurResolutionConflit)
      expect(error).toBeInstanceOf(ErreurValidation)
    }
    expect(() => resoudreConflitsActions({
      intentionsRetenues: [intention('a', 'a')], planificationsExecution: [], ressourcesDisponibles: {},
    })).toThrow(expect.objectContaining({ code: CODES_ERREUR_RESOLUTION_CONFLIT.PLANIFICATION_INVALIDE }))
  })
})
