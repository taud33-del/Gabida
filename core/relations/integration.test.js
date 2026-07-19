import { jest } from '@jest/globals'
import { registerProvider } from '../../api/index.js'
import { construireEtatV1, construirePlayerMessage } from '../interaction/adaptateur.js'
import { traiterInteraction } from '../interaction/index.js'
import {
  DATE_ISO,
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  fabriqueEtatInteraction,
  fabriqueEtatInteractionMulti,
  fabriqueEvenement,
  fabriqueGenerateurId,
  fabriqueSollicitation,
} from '../interaction/fixtures.js'
import { ErreurRelation, CODES_ERREUR_RELATION } from './index.js'

const PROVIDER = 'relations-provider-test'
let appels

beforeAll(() => {
  registerProvider(PROVIDER, async messages => {
    appels.push(messages)
    return { action: 'agit', dialogue: 'parle', tokensEntree: 1, tokensSortie: 1 }
  })
})

beforeEach(() => { appels = [] })

function dependances() {
  const ids = fabriqueGenerateurId()
  let relation = 0
  return {
    providerConfig: { provider: PROVIDER, cleApi: 'test', modele: 'test' },
    genererId: ids.genererId,
    genererIdRelation: () => `relation-${relation++}`,
    date: DATE_ISO,
  }
}

function evenementRelation(misesAJour, metadata = {}) {
  return fabriqueEvenement({ metadata: { ...metadata, relations: { misesAJour } } })
}

const instruction = (extra = {}) => ({
  participantId: PARTICIPANT_ID,
  cibleParticipantId: PARTICIPANT_ID_B,
  dimensions: { confiance: 0.5 },
  ...extra,
})

describe('RFC-009 - integration au tour', () => {
  test('met a jour la relation apres perception et avant le pipeline', async () => {
    const evenement = evenementRelation([instruction()])
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ evenement }), fabriqueEtatInteractionMulti(), dependances()
    )
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID].relations.parParticipantId[PARTICIPANT_ID_B].dimensions.confiance).toBe(0.5)
    expect(appels).toHaveLength(1)
  })

  test('isole les relations directionnelles des deux participants', async () => {
    const evenement = evenementRelation([
      instruction(),
      instruction({ participantId: PARTICIPANT_ID_B, cibleParticipantId: PARTICIPANT_ID, dimensions: { hostilite: 0.7 } }),
    ])
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(), dependances()
    )
    expect(Object.keys(resultat.etat.etatsPrives[PARTICIPANT_ID].relations.parParticipantId)).toEqual([PARTICIPANT_ID_B])
    expect(Object.keys(resultat.etat.etatsPrives[PARTICIPANT_ID_B].relations.parParticipantId)).toEqual([PARTICIPANT_ID])
  })

  test('la vue V1 ne contient que les relations actives du participant courant', () => {
    const active = {
      id: 'r1', participantId: PARTICIPANT_ID, cibleParticipantId: PARTICIPANT_ID_B,
      dimensions: { respect: 0.4 }, statut: 'active', provenance: [], evenementSourceIds: [],
      dateCreation: DATE_ISO, dateMiseAJour: DATE_ISO, metadata: { origine: 'test' },
    }
    const etat = fabriqueEtatInteractionMulti({
      etatsPrives: {
        [PARTICIPANT_ID]: { relations: { parParticipantId: { [PARTICIPANT_ID_B]: active } } },
        [PARTICIPANT_ID_B]: {},
      },
    })
    expect(construireEtatV1(PARTICIPANT_ID, etat).relations).toEqual({
      [PARTICIPANT_ID_B]: { dimensions: { respect: 0.4 }, statut: 'active', metadata: { origine: 'test' } },
    })
    expect(construireEtatV1(PARTICIPANT_ID_B, etat).relations).toBeUndefined()
  })

  test('une erreur relationnelle empeche tout appel fournisseur', async () => {
    const evenement = evenementRelation([instruction({ cibleParticipantId: 'absent' })])
    await expect(traiterInteraction(fabriqueSollicitation({ evenement }), fabriqueEtatInteractionMulti(), dependances()))
      .rejects.toMatchObject({ code: CODES_ERREUR_RELATION.CIBLE_RELATION_INTROUVABLE })
    expect(appels).toHaveLength(0)
  })

  test('une erreur relationnelle conserve totalement l etat initial', async () => {
    const etat = fabriqueEtatInteractionMulti()
    const avant = structuredClone(etat)
    const evenement = evenementRelation([instruction({ dimensions: { confiance: 2 } })])
    await expect(traiterInteraction(fabriqueSollicitation({ evenement }), etat, dependances())).rejects.toBeInstanceOf(ErreurRelation)
    expect(etat).toEqual(avant)
  })

  test('une erreur relationnelle n expose pas une proposition epistemique valide', async () => {
    const etat = fabriqueEtatInteractionMulti()
    const evenement = evenementRelation(
      [instruction({ mode: 'invalide' })],
      { epistemique: { propositions: [{ id: 'fait-temporaire', proposition: 'x' }] } }
    )
    await expect(traiterInteraction(fabriqueSollicitation({ evenement }), etat, dependances())).rejects.toBeInstanceOf(ErreurRelation)
    expect(etat.etatsPrives[PARTICIPANT_ID].epistemique).toBeUndefined()
    expect(appels).toHaveLength(0)
  })

  test('sans metadata.relations conserve strictement le message narratif', () => {
    const evenement = fabriqueEvenement({ contenu: { dialogue: 'hors contrat', action: 'hors contrat' } })
    const etatV1 = construireEtatV1(PARTICIPANT_ID, fabriqueEtatInteraction())
    expect(construirePlayerMessage(evenement, etatV1).texte).toBeUndefined()
    expect(etatV1.relations).toBeUndefined()
  })

  test('sans metadata.relations ne cree aucun champ relations dans le resultat', async () => {
    const resultat = await traiterInteraction(fabriqueSollicitation(), fabriqueEtatInteraction(), dependances())
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID]).not.toHaveProperty('relations')
  })

  test('la propagation applique les mises a jour explicites sans les placer dans la FIFO', async () => {
    const evenement = evenementRelation([instruction()])
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ evenement }), fabriqueEtatInteractionMulti(),
      { ...dependances(), propagation: { active: true, profondeurMaximum: 0, nombreMaximumEvenements: 2 } }
    )
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID].relations.parParticipantId[PARTICIPANT_ID_B]).toBeDefined()
    expect(resultat.etat.historique.every(item => item.type !== 'relation')).toBe(true)
  })

  test('deux tours identiques produisent exactement le meme resultat', async () => {
    const uuid = jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('souvenir-deterministe')
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000)
    const evenement = evenementRelation([instruction()])
    const a = await traiterInteraction(fabriqueSollicitation({ evenement }), fabriqueEtatInteractionMulti(), dependances())
    appels = []
    const b = await traiterInteraction(fabriqueSollicitation({ evenement }), fabriqueEtatInteractionMulti(), dependances())
    expect(b).toEqual(a)
    uuid.mockRestore()
    now.mockRestore()
  })
})
