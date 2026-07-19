import { jest } from '@jest/globals'
import { TYPES_ACTION_PARTICIPANT } from '../../constants/TypesActionParticipant.js'
import { ErreurValidation } from '../index.js'
import { traiterInteraction } from './index.js'
import {
  CODES_ERREUR_PROPAGATION,
  ErreurPropagation,
  ETAPES_TRACE_PROPAGATION,
  estEvenementPropagable,
  normaliserOptionsPropagation,
  propagerInteraction,
} from './propagation.js'
import {
  DATE_ISO,
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  enregistrerProviderDeterministe,
  fabriqueEtatInteractionMulti,
  fabriqueEvenement,
  fabriqueGenerateurId,
  fabriqueSollicitation,
} from './fixtures.js'

const participant = id => ({ participant: { id }, fiches: {} })
const etatMinimal = () => ({
  participants: {},
  etatsPrives: {},
  memoires: {},
  historique: [],
  metadata: {},
})
const evenement = (id, emetteurId = 'joueur') => ({
  id,
  emetteurId,
  type: 'test',
  contenu: { texte: id },
  destinataireIds: [],
  visibilite: 'publique',
  date: DATE_ISO,
  metadata: {},
})

function fabriqueExecution(scenario, appels = []) {
  return async ({ participant: cible }, etatEtape, sollicitationEtape) => {
    appels.push({
      participantId: cible.id,
      evenementId: sollicitationEtape.evenement.id,
      etat: etatEtape,
    })
    const definition = scenario(sollicitationEtape.evenement, cible.id, etatEtape)
    const action = {
      id: `action-${sollicitationEtape.evenement.id}-${cible.id}`,
      participantId: cible.id,
      type: definition.type,
      contenu: {},
      destinataireIds: [],
      visibilite: 'publique',
      metadata: {},
    }
    return {
      participantId: cible.id,
      action,
      evenementProduit: evenement(definition.evenementId, cible.id),
      traces: [{
        id: `pipeline-${sollicitationEtape.evenement.id}-${cible.id}`,
        participantId: cible.id,
        etape: 'pipeline',
        donnees: {},
        date: DATE_ISO,
      }],
      etatPrive: { valeur: definition.valeur ?? sollicitationEtape.evenement.id },
    }
  }
}

function entreePropagation(overrides = {}) {
  const generateur = fabriqueGenerateurId()
  return {
    sollicitation: fabriqueSollicitation({
      evenement: evenement('initial'),
      participantIdsCibles: ['a', 'b'],
    }),
    etatInitial: etatMinimal(),
    ciblesResolues: [participant('a'), participant('b')],
    options: { active: true, nombreMaximumEvenements: 20, profondeurMaximum: 5 },
    peutPercevoir: () => true,
    executerParticipant: fabriqueExecution(() => ({
      type: TYPES_ACTION_PARTICIPANT.SILENCE,
      evenementId: 'silence',
    })),
    genererId: generateur.genererId,
    date: DATE_ISO,
    ...overrides,
  }
}

describe('RFC-005 — configuration et classification', () => {
  test('les valeurs par defaut desactivent strictement la propagation', () => {
    expect(normaliserOptionsPropagation()).toEqual({
      active: false,
      nombreMaximumEvenements: 20,
      profondeurMaximum: 5,
    })
  })

  test.each([
    [null, CODES_ERREUR_PROPAGATION.CONFIGURATION_INVALIDE],
    [{ active: 'oui' }, CODES_ERREUR_PROPAGATION.CONFIGURATION_INVALIDE],
    [{ nombreMaximumEvenements: 0 }, CODES_ERREUR_PROPAGATION.NOMBRE_MAXIMAL_EVENEMENTS_INVALIDE],
    [{ profondeurMaximum: -1 }, CODES_ERREUR_PROPAGATION.PROFONDEUR_MAXIMALE_INVALIDE],
  ])('rejette une configuration invalide %#', (configuration, code) => {
    try {
      normaliserOptionsPropagation(configuration)
      throw new Error('erreur attendue')
    } catch (error) {
      expect(error).toBeInstanceOf(ErreurPropagation)
      expect(error).toBeInstanceOf(ErreurValidation)
      expect(error.code).toBe(code)
    }
  })

  test.each([
    [TYPES_ACTION_PARTICIPANT.PAROLE, true],
    [TYPES_ACTION_PARTICIPANT.ACTION, true],
    [TYPES_ACTION_PARTICIPANT.SILENCE, false],
    [TYPES_ACTION_PARTICIPANT.REACTION_INTERNE, false],
  ])('classe %s sans reinterpretation narrative', (type, attendu) => {
    expect(estEvenementPropagable({ type }, evenement('e'))).toBe(attendu)
  })
})

describe('RFC-005 — compatibilite RFC-004', () => {
  test('option absente et active:false produisent exactement le meme resultat', async () => {
    const dateNow = jest.spyOn(Date, 'now').mockReturnValue(1000)
    const randomUUID = jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid-deterministe')
    const providerConfig = enregistrerProviderDeterministe()
    const sollicitation = fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] })
    const etat = fabriqueEtatInteractionMulti()
    const idsA = fabriqueGenerateurId()
    const idsB = fabriqueGenerateurId()

    const sansOption = await traiterInteraction(sollicitation, etat, {
      providerConfig,
      genererId: idsA.genererId,
      date: DATE_ISO,
    })
    const inactive = await traiterInteraction(sollicitation, etat, {
      providerConfig,
      genererId: idsB.genererId,
      date: DATE_ISO,
      propagation: { active: false },
    })
    expect(inactive).toEqual(sansOption)
    dateNow.mockRestore()
    randomUUID.mockRestore()
  })
})

describe('RFC-005 — file FIFO, selection et etat', () => {
  test('traite toujours l evenement initial en premier', async () => {
    const appels = []
    await propagerInteraction(entreePropagation({
      executerParticipant: fabriqueExecution(() => ({
        type: TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: 'fin',
      }), appels),
    }))
    expect(appels.map(appel => appel.evenementId)).toEqual(['initial', 'initial'])
  })

  test('une parole de A devient ensuite un evenement percu par B sans A', async () => {
    const appels = []
    const resultat = await propagerInteraction(entreePropagation({
      executerParticipant: fabriqueExecution((evt, id) => ({
        type: evt.id === 'initial' && id === 'a'
          ? TYPES_ACTION_PARTICIPANT.PAROLE
          : TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: evt.id === 'initial' && id === 'a' ? 'parole-a' : `fin-${evt.id}-${id}`,
      }), appels),
    }))
    expect(appels.map(({ evenementId, participantId }) => `${evenementId}:${participantId}`))
      .toEqual(['initial:a', 'initial:b', 'parole-a:b'])
    expect(resultat.evenementsProduits.some(evt => evt.id === 'parole-a')).toBe(true)
  })

  test('l etat agrege d une etape devient l etat initial de la suivante', async () => {
    const appels = []
    await propagerInteraction(entreePropagation({
      executerParticipant: fabriqueExecution((evt, id) => ({
        type: evt.id === 'initial' && id === 'a' ? TYPES_ACTION_PARTICIPANT.PAROLE : TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: evt.id === 'initial' && id === 'a' ? 'suite' : `fin-${id}`,
        valeur: `${evt.id}-${id}`,
      }), appels),
    }))
    const appelSuite = appels.find(appel => appel.evenementId === 'suite')
    expect(appelSuite.etat.etatsPrives).toEqual({
      a: { valeur: 'initial-a' },
      b: { valeur: 'initial-b' },
    })
  })

  test('les participants d une meme etape recoivent la meme reference d etat', async () => {
    const appels = []
    await propagerInteraction(entreePropagation({
      executerParticipant: fabriqueExecution(() => ({
        type: TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: `fin-${appels.length}`,
      }), appels),
    }))
    expect(appels[0].etat).toBe(appels[1].etat)
  })

  test('conserve l ordre du perimetre initial a chaque etape', async () => {
    const appels = []
    await propagerInteraction(entreePropagation({
      ciblesResolues: [participant('b'), participant('a')],
      executerParticipant: fabriqueExecution(() => ({
        type: TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: `fin-${appels.length}`,
      }), appels),
    }))
    expect(appels.map(appel => appel.participantId)).toEqual(['b', 'a'])
  })

  test('respecte l ordre FIFO des evenements produits puis l ordre des participants', async () => {
    const appels = []
    await propagerInteraction(entreePropagation({
      executerParticipant: fabriqueExecution((evt, id) => ({
        type: evt.id === 'initial' ? TYPES_ACTION_PARTICIPANT.PAROLE : TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: evt.id === 'initial' ? `suite-${id}` : `fin-${evt.id}-${id}`,
      }), appels),
    }))
    expect(appels.map(({ evenementId, participantId }) => `${evenementId}:${participantId}`))
      .toEqual(['initial:a', 'initial:b', 'suite-a:b', 'suite-b:a'])
  })

  test('applique la perception minimale avant l exclusion de l emetteur', async () => {
    const appels = []
    await propagerInteraction(entreePropagation({
      peutPercevoir: (cible, evt) => evt.id === 'initial' ? cible.id === 'b' : true,
      executerParticipant: fabriqueExecution(() => ({
        type: TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: 'fin',
      }), appels),
    }))
    expect(appels.map(appel => appel.participantId)).toEqual(['b'])
  })
})

describe('RFC-005 — historique, dedoublonnage et ordre final', () => {
  test('n ajoute l evenement initial et chaque evenement produit qu une fois', async () => {
    const resultat = await propagerInteraction(entreePropagation({
      executerParticipant: fabriqueExecution((evt, id) => ({
        type: evt.id === 'initial' && id === 'a' ? TYPES_ACTION_PARTICIPANT.PAROLE : TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: evt.id === 'initial' && id === 'a' ? 'suite' : `fin-${evt.id}-${id}`,
      })),
    }))
    const ids = resultat.etat.historique.map(evt => evt.id)
    expect(ids[0]).toBe('initial')
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('ignore un id deja traite sans pipeline supplementaire et le trace', async () => {
    const appels = []
    const resultat = await propagerInteraction(entreePropagation({
      executerParticipant: fabriqueExecution((evt, id) => ({
        type: evt.id === 'initial' ? TYPES_ACTION_PARTICIPANT.PAROLE : TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: evt.id === 'initial' ? 'duplique' : (id === 'a' ? 'duplique' : `fin-${id}`),
      }), appels),
    }))
    expect(appels.filter(appel => appel.evenementId === 'duplique')).toHaveLength(1)
    expect(resultat.traces.some(trace => trace.etape === ETAPES_TRACE_PROPAGATION.EVENEMENT_IGNORE)).toBe(true)
  })

  test('actions evenements et traces suivent l ordre reel de propagation', async () => {
    const resultat = await propagerInteraction(entreePropagation({
      executerParticipant: fabriqueExecution((evt, id) => ({
        type: evt.id === 'initial' && id === 'a' ? TYPES_ACTION_PARTICIPANT.PAROLE : TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: evt.id === 'initial' && id === 'a' ? 'suite' : `fin-${evt.id}-${id}`,
      })),
    }))
    expect(resultat.actions.map(action => action.participantId)).toEqual(['a', 'b', 'b'])
    expect(resultat.evenementsProduits.map(evt => evt.id)).toEqual(['suite', 'fin-initial-b', 'fin-suite-b'])
    expect(resultat.traces[0].etape).toBe(ETAPES_TRACE_PROPAGATION.EVENEMENT_DEPILE)
  })

  test('rejette avant pipeline un evenement initial sans id', async () => {
    const appels = []
    await expect(propagerInteraction(entreePropagation({
      sollicitation: fabriqueSollicitation({ evenement: { type: 'sans-id' } }),
      executerParticipant: fabriqueExecution(() => ({
        type: TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: 'fin',
      }), appels),
    }))).rejects.toMatchObject({ code: CODES_ERREUR_PROPAGATION.EVENEMENT_SANS_IDENTIFIANT })
    expect(appels).toHaveLength(0)
  })

  test('rejette une association action/evenement incoherente', async () => {
    const execution = async ({ participant: cible }) => ({
      participantId: cible.id,
      action: { participantId: cible.id, type: TYPES_ACTION_PARTICIPANT.PAROLE },
      evenementProduit: evenement('incoherent', 'autre'),
      traces: [],
      etatPrive: {},
    })
    await expect(propagerInteraction(entreePropagation({ executerParticipant: execution })))
      .rejects.toMatchObject({ code: CODES_ERREUR_PROPAGATION.EVENEMENT_PROPAGE_INCOHERENT })
  })
})

describe('RFC-005 — limites, atomicite et determinisme', () => {
  test('la profondeur maximale arrete proprement l ajout sans erreur', async () => {
    const resultat = await propagerInteraction(entreePropagation({
      options: { active: true, nombreMaximumEvenements: 20, profondeurMaximum: 0 },
      executerParticipant: fabriqueExecution((evt, id) => ({
        type: TYPES_ACTION_PARTICIPANT.PAROLE,
        evenementId: `suite-${evt.id}-${id}`,
      })),
    }))
    expect(resultat.actions).toHaveLength(2)
    expect(resultat.traces.filter(trace => trace.etape === ETAPES_TRACE_PROPAGATION.PROFONDEUR_MAXIMALE)).toHaveLength(2)
  })

  test('le nombre maximal arrete avant l evenement suivant et conserve les resultats valides', async () => {
    const resultat = await propagerInteraction(entreePropagation({
      options: { active: true, nombreMaximumEvenements: 1, profondeurMaximum: 5 },
      executerParticipant: fabriqueExecution((evt, id) => ({
        type: TYPES_ACTION_PARTICIPANT.PAROLE,
        evenementId: `suite-${evt.id}-${id}`,
      })),
    }))
    expect(resultat.actions).toHaveLength(2)
    expect(resultat.traces.some(trace => trace.etape === ETAPES_TRACE_PROPAGATION.NOMBRE_MAXIMAL)).toBe(true)
  })

  test('une erreur de pipeline invalide toute l interaction et preserve sa cause', async () => {
    const cause = new Error('pipeline casse')
    const execution = jest.fn(async () => { throw cause })
    await expect(propagerInteraction(entreePropagation({ executerParticipant: execution }))).rejects.toBe(cause)
  })

  test('ne mute jamais l etat initial meme apres plusieurs etapes', async () => {
    const etat = etatMinimal()
    const copie = structuredClone(etat)
    await propagerInteraction(entreePropagation({
      etatInitial: etat,
      executerParticipant: fabriqueExecution((evt, id) => ({
        type: evt.id === 'initial' && id === 'a' ? TYPES_ACTION_PARTICIPANT.PAROLE : TYPES_ACTION_PARTICIPANT.SILENCE,
        evenementId: evt.id === 'initial' && id === 'a' ? 'suite' : `fin-${evt.id}-${id}`,
      })),
    }))
    expect(etat).toEqual(copie)
  })

  test('deux executions identiques produisent exactement le meme resultat', async () => {
    const scenario = (evt, id) => ({
      type: evt.id === 'initial' && id === 'a' ? TYPES_ACTION_PARTICIPANT.PAROLE : TYPES_ACTION_PARTICIPANT.SILENCE,
      evenementId: evt.id === 'initial' && id === 'a' ? 'suite' : `fin-${evt.id}-${id}`,
    })
    const a = await propagerInteraction(entreePropagation({ executerParticipant: fabriqueExecution(scenario) }))
    const b = await propagerInteraction(entreePropagation({ executerParticipant: fabriqueExecution(scenario) }))
    expect(a).toEqual(b)
  })
})
