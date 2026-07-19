import { jest } from '@jest/globals'
import { MODES_PLANIFICATION_EXECUTION } from '../../constants/ModesPlanificationExecution.js'
import { PRIORITES_INTENTION_METIER } from '../../constants/PrioritesIntentionMetier.js'
import { STATUTS_INTENTION_METIER } from '../../constants/StatutsIntentionMetier.js'
import { TYPES_INTENTION_METIER } from '../../constants/TypesIntentionMetier.js'
import {
  CODES_ERREUR_INTENTION_METIER,
  ErreurIntentionMetier,
  validerIntentionsMetier,
} from '../intentions/index.js'
import {
  arbitrerIntentionsMetier,
  comparerIntentionsMetier,
  planifierExecutionCompatibiliteRfc010,
  preparerPlanificationsExecution,
} from './index.js'

function intention(id, participantId, type, priorite, ordreCreation, extra = {}) {
  return {
    id, participantId, type, priorite, ordreCreation,
    cibleId: null, contenu: null,
    statut: STATUTS_INTENTION_METIER.PROPOSEE,
    metadata: {}, ...extra,
  }
}

const cibles = ['b', 'a'].map(id => ({ participant: { id }, fiches: { id } }))

describe('RFC-011 - intentions metier et arbitrage', () => {
  test('accepte explicitement PAROLE, ACTION, INTERRUPTION et RENONCEMENT', () => {
    const intentions = Object.values(TYPES_INTENTION_METIER).map((type, index) =>
      intention(`i-${index}`, `p-${index}`, type, 100, index)
    )
    expect(() => validerIntentionsMetier(intentions)).not.toThrow()
  })

  test('ordonne par priorite, FIFO, participantId puis id', () => {
    const intentions = [
      intention('z', 'b', 'action', 100, 1),
      intention('z-a', 'a', 'parole', 100, 1),
      intention('a', 'b', 'parole', 100, 1),
      intention('fifo', 'c', 'interruption', 100, 0),
      intention('critique', 'd', 'action', 300, 4),
    ]
    expect([...intentions].sort(comparerIntentionsMetier).map(item => item.id))
      .toEqual(['critique', 'fifo', 'z-a', 'a', 'z'])
  })

  test('retient la premiere volonte et ecarte les autres du meme participant', () => {
    const resultat = arbitrerIntentionsMetier([
      intention('action', 'a', 'action', 100, 0),
      intention('parole', 'a', 'parole', 200, 1),
    ])
    expect(resultat.intentionsRetenues).toEqual([expect.objectContaining({ id: 'parole', statut: 'retenue' })])
    expect(resultat.intentionsEcartees).toEqual([expect.objectContaining({ id: 'action', statut: 'ecartee' })])
  })

  test('RENONCEMENT reste retenu mais ne cree aucune planification d execution', () => {
    const resultat = preparerPlanificationsExecution({
      participantsSelectionnes: cibles,
      evenement: { id: 'evt' },
      producteurIntentionsMetier: () => [intention('renonce', 'a', 'renoncement', 300, 0)],
    })
    expect(resultat.intentionsRetenues[0]).toMatchObject({ id: 'renonce', type: 'renoncement' })
    expect(resultat.executionsPlanifiees).toEqual([])
  })

  test('le chemin RFC-010 produit des planifications, pas des intentions metier', () => {
    const resultat = preparerPlanificationsExecution({ participantsSelectionnes: cibles, evenement: { id: 'evt' } })
    expect(resultat.cheminCompatibiliteRfc010).toBe(true)
    expect(resultat.intentionsRetenues).toBeUndefined()
    expect(resultat.executionsPlanifiees.map(item => item.planification)).toEqual([
      { participantId: 'b', intentionId: null, ordreExecution: 0, mode: MODES_PLANIFICATION_EXECUTION.COMPATIBILITE_RFC010 },
      { participantId: 'a', intentionId: null, ordreExecution: 1, mode: MODES_PLANIFICATION_EXECUTION.COMPATIBILITE_RFC010 },
    ])
  })

  test('la planification de compatibilite conserve strictement l ordre recu', () => {
    expect(planifierExecutionCompatibiliteRfc010(cibles).map(item => item.cible.participant.id)).toEqual(['b', 'a'])
  })

  test('ne mute pas les intentions et produit le meme resultat a chaque execution', () => {
    const entree = [intention('b', 'b', 'action', 100, 1), intention('a', 'a', 'parole', 200, 0)]
    const avant = structuredClone(entree)
    expect(arbitrerIntentionsMetier(entree)).toEqual(arbitrerIntentionsMetier(entree))
    expect(entree).toEqual(avant)
  })

  test('ne consulte ni l horloge ni le hasard', () => {
    const now = jest.spyOn(Date, 'now').mockImplementation(() => { throw new Error('temps interdit') })
    const random = jest.spyOn(Math, 'random').mockImplementation(() => { throw new Error('hasard interdit') })
    expect(() => arbitrerIntentionsMetier([intention('a', 'a', 'parole', 100, 0)])).not.toThrow()
    now.mockRestore(); random.mockRestore()
  })

  test('rejette les ids dupliques avec une erreur stable', () => {
    expect(() => validerIntentionsMetier([
      intention('x', 'a', 'parole', 100, 0),
      intention('x', 'b', 'action', 100, 1),
    ])).toThrow(expect.objectContaining({ code: CODES_ERREUR_INTENTION_METIER.INTENTION_ID_DUPLIQUE }))
  })

  test('rejette un participant non planifiable avant toute execution', () => {
    expect(() => preparerPlanificationsExecution({
      participantsSelectionnes: cibles,
      evenement: { id: 'evt' },
      producteurIntentionsMetier: () => [intention('x', 'absent', 'parole', 100, 0)],
    })).toThrow(ErreurIntentionMetier)
  })
})
