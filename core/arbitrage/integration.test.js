import { traiterInteraction } from '../interaction/index.js'
import { STATUTS_INTENTION } from '../../constants/StatutsIntention.js'
import { TYPES_INTENTION } from '../../constants/TypesIntention.js'
import {
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  enregistrerProviderDeterministe,
  fabriqueEtatInteractionMulti,
  fabriqueGenerateurId,
  fabriqueSollicitation,
} from '../interaction/fixtures.js'

let providerConfig

beforeAll(() => { providerConfig = enregistrerProviderDeterministe() })

function dependances(extra = {}) {
  return { providerConfig, genererId: fabriqueGenerateurId().genererId, ...extra }
}

function produireSelonPriorite({ participantsSelectionnes }) {
  return participantsSelectionnes.map(({ participant }, ordreCreation) => ({
    id: `intention-${participant.id}`,
    participantId: participant.id,
    type: TYPES_INTENTION.EXECUTION_PARTICIPANT,
    priorite: participant.id === PARTICIPANT_ID_B ? 200 : 100,
    ordreCreation,
    cibleId: null,
    contenu: null,
    statut: STATUTS_INTENTION.PROPOSEE,
    metadata: {},
  }))
}

describe('RFC-011 - integration interaction', () => {
  test('le pipeline expose les intentions retenues avant les actions', async () => {
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(),
      dependances()
    )
    expect(resultat.intentionsRetenues.map(item => item.participantId)).toEqual([PARTICIPANT_ID, PARTICIPANT_ID_B])
    expect(resultat.actions.map(item => item.participantId)).toEqual([PARTICIPANT_ID, PARTICIPANT_ID_B])
  })

  test('l orchestrateur recoit l ordre deja arbitre sans changer son comportement', async () => {
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(),
      dependances({ producteurIntentions: produireSelonPriorite })
    )
    expect(resultat.intentionsRetenues.map(item => item.participantId)).toEqual([PARTICIPANT_ID_B, PARTICIPANT_ID])
    expect(resultat.actions.map(item => item.participantId)).toEqual([PARTICIPANT_ID_B, PARTICIPANT_ID])
  })

  test('plusieurs executions identiques restent reproductibles', async () => {
    const sollicitation = fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] })
    const premier = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())
    const second = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())
    expect(second.intentionsRetenues).toEqual(premier.intentionsRetenues)
    expect(second.actions.map(item => item.participantId)).toEqual(
      premier.actions.map(item => item.participantId)
    )
  })

  test('le chemin de propagation RFC-005 conserve les intentions arbitrees', async () => {
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(),
      dependances({ propagation: { active: true, nombreMaximumEvenements: 1, profondeurMaximum: 0 } })
    )
    expect(resultat.intentionsRetenues.map(item => item.participantId)).toEqual([PARTICIPANT_ID, PARTICIPANT_ID_B])
    expect(resultat.actions).toHaveLength(2)
  })
})
