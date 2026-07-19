import { PRIORITES_INTENTION } from '../../constants/PrioritesIntention.js'
import { jest } from '@jest/globals'
import { STATUTS_INTENTION } from '../../constants/StatutsIntention.js'
import { TYPES_INTENTION } from '../../constants/TypesIntention.js'
import {
  CODES_ERREUR_INTENTION,
  ErreurIntention,
  produireIntentionsExecution,
  validerIntentions,
} from '../intentions/index.js'
import {
  arbitrerIntentions,
  comparerIntentions,
  preparerOrchestrationIntentions,
} from './index.js'

function intention(id, participantId, priorite, ordreCreation, extra = {}) {
  return {
    id,
    participantId,
    type: TYPES_INTENTION.EXECUTION_PARTICIPANT,
    priorite,
    ordreCreation,
    cibleId: null,
    contenu: null,
    statut: STATUTS_INTENTION.PROPOSEE,
    metadata: {},
    ...extra,
  }
}

describe('RFC-011 - production des intentions', () => {
  test('produit une seule intention deterministe', () => {
    const cible = { participant: { id: 'a' } }
    expect(produireIntentionsExecution({ participantsSelectionnes: [cible], evenement: { id: 'evt' } }))
      .toEqual([intention('intention:evt:a:0', 'a', PRIORITES_INTENTION.NORMALE, 0, {
        contenu: { evenementId: 'evt' },
      })])
  })

  test('produit plusieurs intentions dans l ordre FIFO des participants', () => {
    const participantsSelectionnes = ['b', 'a', 'c'].map(id => ({ participant: { id } }))
    const resultat = produireIntentionsExecution({ participantsSelectionnes, evenement: { id: 'evt', emetteurId: 'joueur' } })
    expect(resultat.map(item => [item.participantId, item.ordreCreation, item.cibleId]))
      .toEqual([['b', 0, 'joueur'], ['a', 1, 'joueur'], ['c', 2, 'joueur']])
  })

  test('ne depend ni du temps ni du hasard', () => {
    const now = jest.spyOn(Date, 'now').mockImplementation(() => { throw new Error('temps interdit') })
    const random = jest.spyOn(Math, 'random').mockImplementation(() => { throw new Error('hasard interdit') })
    const cible = { participant: { id: 'a' } }
    expect(() => produireIntentionsExecution({ participantsSelectionnes: [cible], evenement: { id: 'evt' } })).not.toThrow()
    now.mockRestore()
    random.mockRestore()
  })
})

describe('RFC-011 - arbitrage deterministe', () => {
  test('retient une intention unique', () => {
    const resultat = arbitrerIntentions([intention('i1', 'a', 100, 0)])
    expect(resultat.intentionsRetenues).toEqual([expect.objectContaining({ id: 'i1', statut: 'retenue' })])
    expect(resultat.intentionsEcartees).toEqual([])
  })

  test('ordonne plusieurs participants par priorite decroissante', () => {
    const resultat = arbitrerIntentions([
      intention('basse', 'a', PRIORITES_INTENTION.BASSE, 0),
      intention('critique', 'b', PRIORITES_INTENTION.CRITIQUE, 1),
      intention('haute', 'c', PRIORITES_INTENTION.HAUTE, 2),
    ])
    expect(resultat.intentionsRetenues.map(item => item.id)).toEqual(['critique', 'haute', 'basse'])
  })

  test('a priorite egale applique FIFO puis participantId puis id', () => {
    const entree = [
      intention('z', 'b', 100, 1),
      intention('z-a', 'a', 100, 1),
      intention('a', 'b', 100, 1),
      intention('fifo', 'c', 100, 0),
    ]
    const ordonnee = [...entree].sort(comparerIntentions)
    expect(ordonnee.map(item => item.id)).toEqual(['fifo', 'z-a', 'a', 'z'])
  })

  test('retient la premiere intention arbitree et ecarte les suivantes du meme participant', () => {
    const resultat = arbitrerIntentions([
      intention('normale', 'a', 100, 0),
      intention('haute', 'a', 200, 1),
      intention('autre', 'b', 100, 2),
    ])
    expect(resultat.intentionsRetenues.map(item => item.id)).toEqual(['haute', 'autre'])
    expect(resultat.intentionsEcartees).toEqual([expect.objectContaining({ id: 'normale', statut: 'ecartee' })])
  })

  test('ne mute ni la liste ni les intentions recues', () => {
    const entree = [intention('b', 'b', 100, 1), intention('a', 'a', 100, 0)]
    const avant = structuredClone(entree)
    arbitrerIntentions(entree)
    expect(entree).toEqual(avant)
  })

  test('deux arbitrages identiques donnent exactement le meme resultat', () => {
    const entree = [intention('b', 'b', 100, 1), intention('a', 'a', 100, 0)]
    expect(arbitrerIntentions(entree)).toEqual(arbitrerIntentions(entree))
  })

  test('rejette deterministement les ids dupliques', () => {
    expect(() => validerIntentions([intention('x', 'a', 100, 0), intention('x', 'b', 100, 1)]))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_INTENTION.INTENTION_ID_DUPLIQUE }))
  })

  test('ErreurIntention expose une erreur dediee', () => {
    expect(() => arbitrerIntentions(null)).toThrow(ErreurIntention)
  })

  test('remappe la liste deja arbitree vers l orchestrateur', () => {
    const cibles = ['b', 'a'].map(id => ({ participant: { id }, fiches: { id } }))
    const resultat = preparerOrchestrationIntentions({ participantsSelectionnes: cibles, evenement: { id: 'evt' } })
    expect(resultat.participantsArbitres.map(cible => cible.participant.id)).toEqual(['b', 'a'])
    expect(resultat.participantsArbitres.every(cible => cible.intention.statut === 'retenue')).toBe(true)
  })
})
