import { jest } from '@jest/globals'
import { ErreurValidation } from '../index.js'
import { STATUTS_PARTICIPANT } from '../../constants/StatutsParticipant.js'
import { VISIBILITES_EVENEMENT } from '../../constants/VisibilitesEvenement.js'
import {
  CANAUX_PERCEPTION,
  CODES_ERREUR_PERCEPTION,
  ErreurPerception,
  PRECISIONS_PERCEPTION,
  calculerPerception,
  construireEvenementPercu,
} from './index.js'
import {
  DATE_ISO,
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  enregistrerProviderDeterministe,
  fabriqueEtatInteraction,
  fabriqueEtatInteractionMulti,
  fabriqueEvenement,
  fabriqueGenerateurId,
  fabriqueParticipant,
  fabriqueParticipantB,
  fabriqueSollicitation,
} from '../interaction/fixtures.js'
import { traiterInteraction } from '../interaction/index.js'

const calcul = (participant = fabriqueParticipant(), evenement = fabriqueEvenement(), contexte) =>
  calculerPerception({
    participant,
    evenement,
    etatInteraction: fabriqueEtatInteraction(),
    contexte,
  })

describe('RFC-006 - calcul pur et priorites', () => {
  test('sans metadata reproduit les visibilites RFC-005', () => {
    expect(calcul().perceptible).toBe(true)
    expect(calcul(fabriqueParticipantB(), fabriqueEvenement({
      visibilite: VISIBILITES_EVENEMENT.PRIVEE,
      destinataireIds: [PARTICIPANT_ID],
    })).perceptible).toBe(false)
    expect(calcul(fabriqueParticipantB(), fabriqueEvenement({
      visibilite: VISIBILITES_EVENEMENT.RESTREINTE,
      destinataireIds: [PARTICIPANT_ID_B],
    })).perceptible).toBe(true)
    expect(calcul(fabriqueParticipant(), fabriqueEvenement({
      visibilite: VISIBILITES_EVENEMENT.SYSTEME,
    })).perceptible).toBe(false)
  })

  test('capacite absente et statut inactif refusent sans erreur', () => {
    expect(calcul(fabriqueParticipant({ capacites: {} })).raisons).toEqual(['capacite_absente'])
    expect(calcul(fabriqueParticipant({ statut: STATUTS_PARTICIPANT.INACTIF })).raisons)
      .toEqual(['participant_inactif'])
  })

  test('exclusion explicite prevaut sur une autorisation ordinaire', () => {
    const perception = calcul(undefined, undefined, {
      participantsPouvantPercevoir: [PARTICIPANT_ID],
      participantsExclus: [PARTICIPANT_ID],
    })
    expect(perception.perceptible).toBe(false)
    expect(perception.raisons).toEqual(['participant_exclu'])
  })

  test('liste explicite limite un evenement public', () => {
    expect(calcul(undefined, undefined, {
      participantsPouvantPercevoir: [PARTICIPANT_ID_B],
    }).perceptible).toBe(false)
  })

  test('SYSTEME exige une autorisation explicite', () => {
    const evenement = fabriqueEvenement({ visibilite: VISIBILITES_EVENEMENT.SYSTEME })
    expect(calcul(undefined, evenement).perceptible).toBe(false)
    expect(calcul(undefined, evenement, {
      participantsPouvantPercevoir: [PARTICIPANT_ID],
      canaux: [CANAUX_PERCEPTION.SYSTEME],
    }).perceptible).toBe(true)
  })

  test('contenu individuel puis defaut puis canonique', () => {
    const evenement = fabriqueEvenement({ contenu: { texte: 'canonique' } })
    expect(calcul(undefined, evenement, {
      contenuParParticipant: { [PARTICIPANT_ID]: { texte: 'individuel' } },
      contenuParDefaut: { texte: 'defaut' },
    })).toMatchObject({ contenuPercu: { texte: 'individuel' }, precision: PRECISIONS_PERCEPTION.PARTIELLE })
    expect(calcul(undefined, evenement, { contenuParDefaut: { texte: 'defaut' } }).contenuPercu)
      .toEqual({ texte: 'defaut' })
    expect(calcul(undefined, evenement).contenuPercu).toEqual({ texte: 'canonique' })
    expect(calcul(undefined, evenement).precision).toBe(PRECISIONS_PERCEPTION.COMPLETE)
  })

  test('deux participants peuvent recevoir des contenus differents', () => {
    const contexte = {
      contenuParParticipant: {
        [PARTICIPANT_ID]: 'A',
        [PARTICIPANT_ID_B]: 'B',
      },
    }
    expect(calcul(fabriqueParticipant(), undefined, contexte).contenuPercu).toBe('A')
    expect(calcul(fabriqueParticipantB(), undefined, contexte).contenuPercu).toBe('B')
  })

  test('evenement canonique jamais mute et identifiant tracable', () => {
    const evenement = fabriqueEvenement()
    const avant = structuredClone(evenement)
    const perception = calcul(undefined, evenement, { contenuParDefaut: 'partiel' })
    const percu = construireEvenementPercu(evenement, perception)
    expect(evenement).toEqual(avant)
    expect(percu).not.toBe(evenement)
    expect(percu.metadata.perception.evenementCanoniqueId).toBe(evenement.id)
  })

  test('meme entree donne exactement la meme perception', () => {
    const participant = fabriqueParticipant()
    const evenement = fabriqueEvenement()
    expect(calcul(participant, evenement)).toEqual(calcul(participant, evenement))
  })
})

describe('RFC-006 - validations', () => {
  test.each([
    [{ canaux: ['telepathie'] }, CODES_ERREUR_PERCEPTION.CANAL_INVALIDE],
    [{ participantsExclus: 'a' }, CODES_ERREUR_PERCEPTION.CONTEXTE_INVALIDE],
    [{ precision: 'floue' }, CODES_ERREUR_PERCEPTION.PRECISION_INVALIDE],
  ])('rejette un contexte structurel invalide %#', (contexte, code) => {
    expect(() => calcul(undefined, undefined, contexte)).toThrow(ErreurPerception)
    try {
      calcul(undefined, undefined, contexte)
    } catch (error) {
      expect(error).toBeInstanceOf(ErreurValidation)
      expect(error.code).toBe(code)
    }
  })
})

describe('RFC-006 - integration interaction', () => {
  let providerConfig

  beforeAll(() => {
    providerConfig = enregistrerProviderDeterministe()
  })

  const dependances = () => {
    const ids = fabriqueGenerateurId()
    return {
      providerConfig,
      genererId: ids.genererId,
      date: DATE_ISO,
    }
  }

  test('pipeline seulement pour les perceptibles et historique canonique unique', async () => {
    const evenement = fabriqueEvenement({
      metadata: { perception: { participantsPouvantPercevoir: [PARTICIPANT_ID] } },
    })
    const resultat = await traiterInteraction(fabriqueSollicitation({
      evenement,
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    }), fabriqueEtatInteractionMulti(), dependances())
    expect(resultat.actions.map(action => action.participantId)).toEqual([PARTICIPANT_ID])
    expect(resultat.etat.historique.filter(item => item.id === evenement.id)).toEqual([evenement])
  })

  test('perceptions privees isolees et ajoutees immuablement', async () => {
    const etat = fabriqueEtatInteractionMulti()
    const avant = structuredClone(etat)
    const resultat = await traiterInteraction(fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
      evenement: fabriqueEvenement({
        metadata: { perception: { contenuParParticipant: {
          [PARTICIPANT_ID]: 'secret A',
          [PARTICIPANT_ID_B]: 'secret B',
        } } },
      }),
    }), etat, dependances())
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID].perceptions[0].contenuPercu).toBe('secret A')
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].perceptions[0].contenuPercu).toBe('secret B')
    expect(etat).toEqual(avant)
  })

  test('erreur de perception preserve atomicite totale', async () => {
    const etat = fabriqueEtatInteractionMulti()
    const avant = structuredClone(etat)
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
      evenement: fabriqueEvenement({ metadata: { perception: { canaux: ['invalide'] } } }),
    })
    await expect(traiterInteraction(sollicitation, etat, dependances())).rejects.toBeInstanceOf(ErreurPerception)
    expect(etat).toEqual(avant)
  })

  test('traces attribuees sans contenu sensible', async () => {
    const resultat = await traiterInteraction(fabriqueSollicitation(), fabriqueEtatInteraction(), dependances())
    const traces = resultat.traces.filter(trace => trace.etape.startsWith('perception_'))
    expect(traces.every(trace => trace.participantId === PARTICIPANT_ID)).toBe(true)
    expect(traces.every(trace => !Object.hasOwn(trace.donnees, 'contenuPercu'))).toBe(true)
  })

  test('RFC-005 percoit le canonique depile puis exclut seulement la reaction de l emetteur', async () => {
    const evenement = fabriqueEvenement({
      emetteurId: PARTICIPANT_ID,
      metadata: { perception: { contenuParParticipant: {
        [PARTICIPANT_ID]: 'action propre percue',
        [PARTICIPANT_ID_B]: 'action observee',
      } } },
    })
    const resultat = await traiterInteraction(fabriqueSollicitation({
      evenement,
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    }), fabriqueEtatInteractionMulti(), {
      ...dependances(),
      propagation: { active: true, profondeurMaximum: 0 },
    })

    expect(resultat.actions.map(action => action.participantId)).toEqual([PARTICIPANT_ID_B])
    expect(resultat.traces.some(trace =>
      trace.participantId === PARTICIPANT_ID && trace.etape === 'perception_acceptee'
    )).toBe(true)
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].perceptions[0].contenuPercu)
      .toBe('action observee')
    expect(resultat.etat.historique.filter(item => item.id === evenement.id)).toEqual([evenement])
  })
})
