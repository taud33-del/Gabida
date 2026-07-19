import { jest } from '@jest/globals'
import { registerProvider } from '../../api/index.js'
import { traiterInteraction } from '../interaction/index.js'
import { construireEtatV1, construirePlayerMessage } from '../interaction/adaptateur.js'
import {
  DATE_ISO, PARTICIPANT_ID, PARTICIPANT_ID_B,
  fabriqueEtatInteractionMulti, fabriqueEvenement, fabriqueGenerateurId,
  fabriqueParticipantB, fabriqueSollicitation,
} from '../interaction/fixtures.js'
import { ErreurTransmission, CODES_ERREUR_TRANSMISSION } from './index.js'

const PARTICIPANT_C = 'participant-c'
const PROVIDER = 'transmissions-provider-test'
let appelsProvider

beforeAll(() => {
  registerProvider(PROVIDER, async messages => {
    appelsProvider.push(messages)
    return { action: 'agit', dialogue: 'parle', tokensEntree: 1, tokensSortie: 1 }
  })
})

beforeEach(() => { appelsProvider = [] })

function deps() {
  const ids = fabriqueGenerateurId()
  let transmission = 0
  let fait = 0
  return {
    providerConfig: { provider: PROVIDER, cleApi: 'test', modele: 'test' },
    genererId: ids.genererId,
    genererIdTransmission: () => `transmission-${transmission++}`,
    genererIdEpistemique: () => `fait-${fait++}`,
    date: DATE_ISO,
  }
}

function info(extra = {}) {
  return {
    id: 'transmission-explicite', emetteurId: PARTICIPANT_ID,
    destinataireIds: [PARTICIPANT_ID_B], proposition: { id: 'info-partagee', valeur: 'X' },
    ...extra,
  }
}

function evenementTransmission(informations, extraMetadata = {}, extra = {}) {
  return fabriqueEvenement({
    emetteurId: PARTICIPANT_ID,
    destinataireIds: [PARTICIPANT_ID_B],
    metadata: { ...extraMetadata, transmissions: { informations } },
    ...extra,
  })
}

function etatTrois() {
  const initial = fabriqueEtatInteractionMulti()
  return {
    ...initial,
    participants: { ...initial.participants, [PARTICIPANT_C]: fabriqueParticipantB({ id: PARTICIPANT_C }) },
    etatsPrives: { ...initial.etatsPrives, [PARTICIPANT_C]: { tourCourant: 2, historique: [] } },
    memoires: { ...initial.memoires, [PARTICIPANT_C]: { souvenirs: [] } },
  }
}

describe('RFC-010 - integration traiterInteraction', () => {
  test('sans metadata.transmissions conserve RFC-009 sans nouveau champ', async () => {
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(), deps()
    )
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID]).not.toHaveProperty('transmissions')
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B]).not.toHaveProperty('transmissions')
  })

  test('sans transmission ne change ni le message narratif ni le contexte V1', () => {
    const initial = fabriqueEtatInteractionMulti()
    const evenement = fabriqueEvenement({ contenu: { dialogue: 'hors contrat', action: 'hors contrat' } })
    const etatV1 = construireEtatV1(PARTICIPANT_ID_B, initial)
    expect(construirePlayerMessage(evenement, etatV1).texte).toBeUndefined()
    expect(etatV1).not.toHaveProperty('transmissions')
  })

  test('cree le fait chez le destinataire et les historiques prives', async () => {
    const evenement = evenementTransmission([info()])
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(), deps()
    )
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].epistemique.croyances[0]).toMatchObject({ id: 'info-partagee', confiance: 0.5 })
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID].transmissions.emises).toHaveLength(1)
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].transmissions.recues).toHaveLength(1)
    expect(appelsProvider).toHaveLength(1)
  })

  test('les historiques de transmission ne sont jamais exposes au pipeline V1', () => {
    const initial = fabriqueEtatInteractionMulti()
    initial.etatsPrives[PARTICIPANT_ID_B].transmissions = {
      emises: [], recues: [{ transmissionId: 'privee', destinataireId: PARTICIPANT_ID_B }],
    }
    expect(construireEtatV1(PARTICIPANT_ID_B, initial)).not.toHaveProperty('transmissions')
    expect(construireEtatV1(PARTICIPANT_ID, initial)).not.toHaveProperty('transmissions')
  })

  test('plusieurs destinataires recoivent meme hors cibles du pipeline', async () => {
    const evenement = evenementTransmission([info({ destinataireIds: [PARTICIPANT_ID_B, PARTICIPANT_C] })])
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }), etatTrois(), deps()
    )
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].epistemique.croyances[0].id).toBe('info-partagee')
    expect(resultat.etat.etatsPrives[PARTICIPANT_C].epistemique.croyances[0].id).toBe('info-partagee')
    expect(appelsProvider).toHaveLength(1)
  })

  test('un destinataire non percevant ne recoit aucun fait mais conserve un resultat ignore', async () => {
    const evenement = evenementTransmission(
      [info({ destinataireIds: [PARTICIPANT_C] })], {},
      { visibilite: 'privee', destinataireIds: [PARTICIPANT_ID_B] }
    )
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }), etatTrois(), deps()
    )
    expect(resultat.etat.etatsPrives[PARTICIPANT_C].epistemique).toBeUndefined()
    expect(resultat.etat.etatsPrives[PARTICIPANT_C].transmissions.recues[0]).toMatchObject({ appliquee: false, raison: 'non_percue' })
  })

  test('participantsConcernes filtre sans erreur', async () => {
    const evenement = evenementTransmission([info({ destinataireIds: [PARTICIPANT_ID_B, PARTICIPANT_C], participantsConcernes: [PARTICIPANT_C] })])
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }), etatTrois(), deps()
    )
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].epistemique).toBeUndefined()
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].transmissions.recues[0].raison).toBe('participant_non_concerne')
    expect(resultat.etat.etatsPrives[PARTICIPANT_C].epistemique.croyances).toHaveLength(1)
  })

  test('applique une seule fois propositions directes puis transmises', async () => {
    const evenement = evenementTransmission([info()], {
      epistemique: { propositions: [{ id: 'directe', proposition: 'D', participantsInformes: [PARTICIPANT_ID_B] }] },
    })
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(), deps()
    )
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].epistemique.croyances.map(fait => fait.id)).toEqual(['directe', 'info-partagee'])
  })

  test('ne modifie pas les relations et n utilise pas leur confiance', async () => {
    const initial = fabriqueEtatInteractionMulti()
    initial.etatsPrives[PARTICIPANT_ID_B].relations = { parParticipantId: {
      [PARTICIPANT_ID]: {
        id: 'relation-ba', participantId: PARTICIPANT_ID_B, cibleParticipantId: PARTICIPANT_ID,
        dimensions: { confiance: -1 }, statut: 'active', provenance: [], evenementSourceIds: [],
        dateCreation: DATE_ISO, dateMiseAJour: DATE_ISO, metadata: {},
      },
    } }
    const avant = structuredClone(initial.etatsPrives[PARTICIPANT_ID_B].relations)
    const evenement = evenementTransmission([info()])
    const resultat = await traiterInteraction(fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }), initial, deps())
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].epistemique.croyances[0].confiance).toBe(0.5)
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].relations).toEqual(avant)
  })

  test('ne place aucune transmission dans etatPartage ou comme entree canonique distincte', async () => {
    const evenement = evenementTransmission([info()])
    const resultat = await traiterInteraction(fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }), fabriqueEtatInteractionMulti(), deps())
    expect(resultat.etat.etatPartage).toEqual({ meta: { langue: 'fr', debutTimestamp: 0 } })
    expect(resultat.etat.historique.filter(item => item.id === evenement.id)).toHaveLength(1)
    expect(resultat.etat.historique.every(item => Object.hasOwn(item, 'visibilite'))).toBe(true)
  })

  test('la propagation conserve uniquement des evenements canoniques et l etat transmis', async () => {
    const evenement = evenementTransmission([info()])
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }), fabriqueEtatInteractionMulti(),
      { ...deps(), propagation: { active: true, profondeurMaximum: 0, nombreMaximumEvenements: 2 } }
    )
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].epistemique.croyances[0].id).toBe('info-partagee')
    expect(resultat.etat.historique.every(item => typeof item.id === 'string' && Object.hasOwn(item, 'contenu'))).toBe(true)
  })

  test('une transmission invalide annule epistemique, relations, historique et provider', async () => {
    const initial = fabriqueEtatInteractionMulti()
    const avant = structuredClone(initial)
    const evenement = evenementTransmission(
      [info(), info({ id: 'invalide', destinataireIds: ['absent'] })],
      {
        epistemique: { propositions: [{ id: 'directe', proposition: 'D' }] },
        relations: { misesAJour: [{ participantId: PARTICIPANT_ID_B, cibleParticipantId: PARTICIPANT_ID, dimensions: { confiance: 0.9 }, id: 'relation' }] },
      }
    )
    await expect(traiterInteraction(
      fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }), initial, deps()
    )).rejects.toMatchObject({ code: CODES_ERREUR_TRANSMISSION.DESTINATAIRE_TRANSMISSION_INTROUVABLE })
    expect(initial).toEqual(avant)
    expect(appelsProvider).toHaveLength(0)
  })

  test('une erreur de transmission est exposee comme ErreurTransmission', async () => {
    const evenement = evenementTransmission([info({ confiance: 2 })])
    await expect(traiterInteraction(
      fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] }), fabriqueEtatInteractionMulti(), deps()
    )).rejects.toBeInstanceOf(ErreurTransmission)
  })

  test('memes entrees et dependances deterministes donnent les memes sorties', async () => {
    const uuid = jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('souvenir-deterministe')
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000)
    const evenement = evenementTransmission([info()])
    const sollicitation = fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID_B] })
    const a = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), deps())
    appelsProvider = []
    const b = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), deps())
    expect(b).toEqual(a)
    uuid.mockRestore(); now.mockRestore()
  })
})
