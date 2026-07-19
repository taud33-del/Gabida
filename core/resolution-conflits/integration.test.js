import { registerProvider } from '../../api/index.js'
import { traiterInteraction } from '../interaction/index.js'
import {
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  REPONSE_PROVIDER,
  fabriqueEtatInteractionMulti,
  fabriqueGenerateurId,
  fabriqueParticipant,
  fabriqueSollicitation,
} from '../interaction/fixtures.js'

const PROVIDER = 'rfc-012-provider'
const PARTICIPANT_ID_C = 'participant-agent-c'
let appelsProvider

beforeAll(() => {
  registerProvider(PROVIDER, async messages => {
    appelsProvider.push(messages)
    return { ...REPONSE_PROVIDER }
  })
})

beforeEach(() => { appelsProvider = [] })

function intention(id, participantId, priorite, ordreCreation, conflit = undefined, type = 'action') {
  return {
    id, participantId, type, priorite, ordreCreation,
    cibleId: null, contenu: { id }, statut: 'proposee',
    metadata: conflit === undefined ? {} : { conflit },
  }
}

function deps(producteurIntentionsMetier, resolutionConflits = { active: true }, extra = {}) {
  return {
    providerConfig: { provider: PROVIDER, cleApi: 'test', modele: 'test' },
    genererId: fabriqueGenerateurId().genererId,
    producteurIntentionsMetier,
    ...(resolutionConflits ? { resolutionConflits } : {}),
    ...extra,
  }
}

function sollicitation(ids = [PARTICIPANT_ID, PARTICIPANT_ID_B]) {
  return fabriqueSollicitation({ participantIdsCibles: ids })
}

function etatTroisParticipants() {
  const base = fabriqueEtatInteractionMulti()
  return {
    ...base,
    participants: {
      ...base.participants,
      [PARTICIPANT_ID_C]: fabriqueParticipant({ id: PARTICIPANT_ID_C }),
    },
    etatsPrives: {
      ...base.etatsPrives,
      [PARTICIPANT_ID_C]: { tourCourant: 1, historique: [] },
    },
    memoires: {
      ...base.memoires,
      [PARTICIPANT_ID_C]: { souvenirs: [] },
    },
  }
}

describe('RFC-012 - integration avant orchestrateur', () => {
  test('deux participants sur une cible exclusive produisent un seul appel provider', async () => {
    const resultat = await traiterInteraction(sollicitation(), fabriqueEtatInteractionMulti(), deps(() => [
      intention('a', PARTICIPANT_ID, 200, 0, { cleExclusivite: 'objet:epee' }),
      intention('b', PARTICIPANT_ID_B, 100, 1, { cleExclusivite: 'objet:epee' }),
    ]))
    expect(appelsProvider).toHaveLength(1)
    expect(resultat.actions.map(item => item.metadata.intentionId)).toEqual(['a'])
    expect(resultat.intentionsEcarteesParConflit).toEqual([expect.objectContaining({ id: 'b' })])
  })

  test('deux actions sans conflit conservent l ordre RFC-011 et deux appels', async () => {
    const resultat = await traiterInteraction(sollicitation(), fabriqueEtatInteractionMulti(), deps(() => [
      intention('b', PARTICIPANT_ID_B, 100, 1), intention('a', PARTICIPANT_ID, 200, 0),
    ]))
    expect(appelsProvider).toHaveLength(2)
    expect(resultat.ordreExecutionFinal).toEqual(['a', 'b'])
    expect(resultat.actions.map(item => item.metadata.intentionId)).toEqual(['a', 'b'])
  })

  test('une dependance impose l ordre final avant execution', async () => {
    const resultat = await traiterInteraction(sollicitation(), fabriqueEtatInteractionMulti(), deps(() => [
      intention('b', PARTICIPANT_ID_B, 300, 0, { idsIntentionsRequises: ['a'] }),
      intention('a', PARTICIPANT_ID, 100, 1),
    ]))
    expect(resultat.ordreExecutionFinal).toEqual(['a', 'b'])
    expect(resultat.actions.map(item => item.metadata.intentionId)).toEqual(['a', 'b'])
  })

  test('une dependance dont la requise est ecartee ne lance pas son pipeline', async () => {
    const resultat = await traiterInteraction(sollicitation([PARTICIPANT_ID, PARTICIPANT_ID_B, PARTICIPANT_ID_C]),
      etatTroisParticipants(), deps(() => [
        intention('gagnante', PARTICIPANT_ID, 300, 0, { cleExclusivite: 'x' }),
        intention('requise', PARTICIPANT_ID_B, 200, 1, { cleExclusivite: 'x' }),
        intention('dependante', PARTICIPANT_ID_C, 100, 2, { idsIntentionsRequises: ['requise'] }),
      ]))
    expect(appelsProvider).toHaveLength(1)
    expect(resultat.actions.map(item => item.metadata.intentionId)).toEqual(['gagnante'])
    expect(resultat.intentionsEcarteesParConflit.map(item => item.id)).toEqual(['requise', 'dependante'])
  })

  test('une capacite 2 ne laisse passer que les deux premieres demandes', async () => {
    const consommation = { ressourcesConsommees: [{ ressourceId: 'passage', quantite: 1 }] }
    const resultat = await traiterInteraction(sollicitation([PARTICIPANT_ID, PARTICIPANT_ID_B, PARTICIPANT_ID_C]),
      etatTroisParticipants(), deps(() => [
        intention('a', PARTICIPANT_ID, 300, 0, consommation),
        intention('b', PARTICIPANT_ID_B, 200, 1, consommation),
        intention('c', PARTICIPANT_ID_C, 100, 2, consommation),
      ], { active: true, ressourcesDisponibles: { passage: 2 } }))
    expect(appelsProvider).toHaveLength(2)
    expect(resultat.ordreExecutionFinal).toEqual(['a', 'b'])
    expect(resultat.intentionsEcarteesParConflit[0].id).toBe('c')
  })

  test('une intention ecartee ne produit action, evenement ni propagation', async () => {
    const resultat = await traiterInteraction(sollicitation(), fabriqueEtatInteractionMulti(), deps(() => [
      intention('a', PARTICIPANT_ID, 200, 0, { cleExclusivite: 'x' }),
      intention('b', PARTICIPANT_ID_B, 100, 1, { cleExclusivite: 'x' }),
    ], { active: true }, { propagation: { active: true, profondeurMaximum: 0 } }))
    expect(resultat.actions).toHaveLength(1)
    expect(resultat.evenementsProduits).toHaveLength(1)
    expect(JSON.stringify(resultat.actions)).not.toContain('"b"')
    expect(JSON.stringify(resultat.evenementsProduits)).not.toContain('"b"')
  })

  test('sans activation RFC-012 le resultat RFC-011 reste structurellement identique', async () => {
    const produire = () => [
      intention('a', PARTICIPANT_ID, 200, 0, { cleExclusivite: 'x' }),
      intention('b', PARTICIPANT_ID_B, 100, 1, { cleExclusivite: 'x' }),
    ]
    const resultat = await traiterInteraction(sollicitation(), fabriqueEtatInteractionMulti(), deps(produire, null))
    expect(resultat).not.toHaveProperty('intentionsExecutables')
    expect(resultat).not.toHaveProperty('intentionsEcarteesParConflit')
    expect(resultat).not.toHaveProperty('conflitsDetectes')
    expect(resultat).not.toHaveProperty('planificationsFinales')
    expect(resultat).not.toHaveProperty('ordreExecutionFinal')
    expect(appelsProvider).toHaveLength(2)
  })

  test('RENONCEMENT reste observable mais absent de la resolution', async () => {
    const resultat = await traiterInteraction(sollicitation(), fabriqueEtatInteractionMulti(), deps(() => [
      intention('renonce', PARTICIPANT_ID, 300, 0, { cleExclusivite: 'x' }, 'renoncement'),
      intention('agit', PARTICIPANT_ID_B, 100, 1, { cleExclusivite: 'x' }),
    ]))
    expect(resultat.intentionsRetenues.map(item => item.id)).toEqual(['renonce', 'agit'])
    expect(resultat.ordreExecutionFinal).toEqual(['agit'])
    expect(resultat.conflitsDetectes).toEqual([])
    expect(appelsProvider).toHaveLength(1)
  })

  test('une erreur de contrat survient avant tout appel provider', async () => {
    await expect(traiterInteraction(sollicitation(), fabriqueEtatInteractionMulti(), deps(() => [
      intention('a', PARTICIPANT_ID, 200, 0, { idsIntentionsRequises: ['inconnue'] }),
      intention('b', PARTICIPANT_ID_B, 100, 1),
    ]))).rejects.toMatchObject({ code: 'reference_intention_inconnue' })
    expect(appelsProvider).toHaveLength(0)
  })
})
