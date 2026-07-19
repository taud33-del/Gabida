import { registerProvider } from '../../api/index.js'
import { construirePlayerMessage } from '../interaction/adaptateur.js'
import { traiterInteraction } from '../interaction/index.js'
import { STATUTS_INTENTION_METIER } from '../../constants/StatutsIntentionMetier.js'
import { TYPES_INTENTION_METIER } from '../../constants/TypesIntentionMetier.js'
import {
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  REPONSE_PROVIDER,
  fabriqueEtatInteractionMulti,
  fabriqueGenerateurId,
  fabriqueSollicitation,
} from '../interaction/fixtures.js'

const PROVIDER = 'rfc-011-provider'
let appelsProvider

beforeAll(() => {
  registerProvider(PROVIDER, async messages => {
    appelsProvider.push(messages)
    return { ...REPONSE_PROVIDER }
  })
})

beforeEach(() => { appelsProvider = [] })

function dependances(producteurIntentionsMetier) {
  return {
    providerConfig: { provider: PROVIDER, cleApi: 'test', modele: 'test' },
    genererId: fabriqueGenerateurId().genererId,
    ...(producteurIntentionsMetier ? { producteurIntentionsMetier } : {}),
  }
}

function intention(id, participantId, type, priorite, ordreCreation, extra = {}) {
  return {
    id, participantId, type, priorite, ordreCreation,
    cibleId: null, contenu: null,
    statut: STATUTS_INTENTION_METIER.PROPOSEE,
    metadata: {}, ...extra,
  }
}

function sollicitationMulti() {
  return fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] })
}

describe('RFC-011 - execution des intentions metier', () => {
  test('PAROLE prioritaire sur ACTION determine l unique resultat execute', async () => {
    const resultat = await traiterInteraction(sollicitationMulti(), fabriqueEtatInteractionMulti(), dependances(() => [
      intention('action-basse', PARTICIPANT_ID, TYPES_INTENTION_METIER.ACTION, 100, 0),
      intention('parole-haute', PARTICIPANT_ID, TYPES_INTENTION_METIER.PAROLE, 200, 1),
    ]))
    expect(resultat.intentionsRetenues.map(item => item.id)).toEqual(['parole-haute'])
    expect(resultat.intentionsEcartees.map(item => item.id)).toEqual(['action-basse'])
    expect(resultat.actions).toEqual([expect.objectContaining({
      participantId: PARTICIPANT_ID,
      type: 'parole',
      metadata: { intentionId: 'parole-haute' },
    })])
    expect(resultat.planificationsExecution).toEqual([{
      participantId: PARTICIPANT_ID,
      intentionId: 'parole-haute',
      ordreExecution: 0,
      mode: 'intention_metier',
    }])
    expect(appelsProvider).toHaveLength(1)
  })

  test('INTERRUPTION prioritaire est retenue et reliee au resultat', async () => {
    const resultat = await traiterInteraction(sollicitationMulti(), fabriqueEtatInteractionMulti(), dependances(() => [
      intention('parole', PARTICIPANT_ID, 'parole', 200, 0),
      intention('interruption', PARTICIPANT_ID, 'interruption', 300, 1),
    ]))
    expect(resultat.intentionsRetenues[0].type).toBe('interruption')
    expect(resultat.actions[0]).toMatchObject({ type: 'parole', metadata: { intentionId: 'interruption' } })
    expect(resultat.evenementsProduits[0].metadata).toEqual({ intentionId: 'interruption' })
  })

  test('RENONCEMENT retenu ne lance aucun pipeline', async () => {
    const resultat = await traiterInteraction(sollicitationMulti(), fabriqueEtatInteractionMulti(), dependances(() => [
      intention('renonce', PARTICIPANT_ID, 'renoncement', 300, 0),
    ]))
    expect(resultat.intentionsRetenues).toEqual([expect.objectContaining({ id: 'renonce' })])
    expect(resultat.actions).toEqual([])
    expect(resultat.evenementsProduits).toEqual([])
    expect(appelsProvider).toHaveLength(0)
  })

  test('une intention ecartee ne produit aucun resultat distinct', async () => {
    const resultat = await traiterInteraction(sollicitationMulti(), fabriqueEtatInteractionMulti(), dependances(() => [
      intention('ecartee', PARTICIPANT_ID, 'parole', 100, 0),
      intention('retenue', PARTICIPANT_ID, 'action', 200, 1),
    ]))
    expect(resultat.intentionsEcartees[0].id).toBe('ecartee')
    expect(resultat.actions).toHaveLength(1)
    expect(resultat.actions[0].metadata.intentionId).toBe('retenue')
    expect(JSON.stringify(resultat.actions)).not.toContain('ecartee')
    expect(appelsProvider).toHaveLength(1)
  })

  test('cible et contenu sont transmis au contexte et influencent le resultat', async () => {
    const intentionMetier = intention('agir-vers-b', PARTICIPANT_ID, 'action', 200, 0, {
      cibleId: PARTICIPANT_ID_B,
      contenu: { geste: 'ouvrir_la_porte' },
    })
    const contexte = construirePlayerMessage(
      fabriqueSollicitation().evenement,
      { tourCourant: 1, sessionId: 'session' },
      intentionMetier
    )
    expect(contexte.intentionMetier).toEqual({
      id: 'agir-vers-b', type: 'action', cibleId: PARTICIPANT_ID_B,
      contenu: { geste: 'ouvrir_la_porte' },
    })

    const resultat = await traiterInteraction(sollicitationMulti(), fabriqueEtatInteractionMulti(), dependances(() => [intentionMetier]))
    expect(resultat.actions[0]).toMatchObject({
      type: 'action', destinataireIds: [PARTICIPANT_ID_B], metadata: { intentionId: 'agir-vers-b' },
    })
  })

  test('l arbitrage porte sur les volontes et non sur l ordre initial des participants', async () => {
    const resultat = await traiterInteraction(sollicitationMulti(), fabriqueEtatInteractionMulti(), dependances(() => [
      intention('a-action', PARTICIPANT_ID, 'action', 100, 0),
      intention('b-parole', PARTICIPANT_ID_B, 'parole', 300, 1),
    ]))
    expect(resultat.intentionsRetenues.map(item => item.id)).toEqual(['b-parole', 'a-action'])
    expect(resultat.actions.map(item => item.participantId)).toEqual([PARTICIPANT_ID_B, PARTICIPANT_ID])
  })

  test('sans intentions metier, le resultat RFC-010 reste strictement compatible', async () => {
    const resultat = await traiterInteraction(sollicitationMulti(), fabriqueEtatInteractionMulti(), dependances())
    expect(resultat).not.toHaveProperty('intentionsRetenues')
    expect(resultat).not.toHaveProperty('intentionsEcartees')
    expect(resultat).not.toHaveProperty('planificationsExecution')
    expect(resultat.actions.map(item => item.participantId)).toEqual([PARTICIPANT_ID, PARTICIPANT_ID_B])
    expect(resultat.actions.every(item => JSON.stringify(item.metadata) === '{}')).toBe(true)
    expect(resultat.evenementsProduits.every(item => JSON.stringify(item.metadata) === '{}')).toBe(true)
    expect(appelsProvider).toHaveLength(2)
  })
})
