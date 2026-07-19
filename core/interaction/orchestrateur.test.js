import {
  agregerResultats,
  orchestrerTour,
  ordonnerParticipants,
  selectionnerParticipants,
} from './orchestrateur.js'

const evenement = Object.freeze({ id: 'evt-1', type: 'test' })
const sollicitation = Object.freeze({ id: 'sol-1', evenement })

function etatInitial() {
  return {
    participants: {},
    etatPartage: {},
    etatsPrives: { horsTour: { valeur: 1 } },
    memoires: { horsTour: { souvenirs: [] } },
    relations: {},
    historique: [{ id: 'evt-passe' }],
    metadata: {},
  }
}

function cibles(ids = ['b', 'a', 'c']) {
  return ids.map(id => ({ participant: { id }, fiches: { id } }))
}

function fragment(participantId) {
  return {
    participantId,
    action: { id: `action-${participantId}`, participantId },
    evenementProduit: { id: `evt-${participantId}`, emetteurId: participantId },
    traces: [{ id: `trace-${participantId}`, participantId }],
    etatPrive: { participantId },
    memoire: { souvenirs: [{ id: `memoire-${participantId}` }] },
  }
}

describe('RFC-004 — selection et ordre', () => {
  test('reutilise la regle fournie et conserve participantIdsCibles sans tri', () => {
    const entree = cibles()
    const selection = selectionnerParticipants(
      entree,
      evenement,
      participant => participant.id !== 'a'
    )

    expect(selection.map(({ participant }) => participant.id)).toEqual(['b', 'c'])
    expect(ordonnerParticipants(selection)).toEqual(selection)
    expect(selection).not.toBe(entree)
  })
})

describe('RFC-004 — orchestration deterministe', () => {
  test('execute exactement une fois chaque participant, dans un ordre stable', async () => {
    const appels = []
    const etat = etatInitial()

    const resultat = await orchestrerTour({
      participantsSelectionnes: cibles(),
      sollicitation,
      etatInitial: etat,
      executerParticipant: async ({ participant }, etatRecu) => {
        appels.push({ participantId: participant.id, etatRecu })
        return fragment(participant.id)
      },
    })

    expect(appels.map(({ participantId }) => participantId)).toEqual(['b', 'a', 'c'])
    expect(new Set(appels.map(({ participantId }) => participantId)).size).toBe(3)
    expect(appels.every(({ etatRecu }) => etatRecu === etat)).toBe(true)
    expect(resultat.actions.map(({ participantId }) => participantId)).toEqual(['b', 'a', 'c'])
  })

  test('deux executions identiques produisent exactement le meme resultat', async () => {
    const executerParticipant = async ({ participant }) => fragment(participant.id)
    const entree = {
      participantsSelectionnes: cibles(),
      sollicitation,
      etatInitial: etatInitial(),
      executerParticipant,
    }

    expect(await orchestrerTour(entree)).toEqual(await orchestrerTour(entree))
  })

  test('conserve l atomicite : aucune agregation et aucune mutation en cas d echec', async () => {
    const etat = etatInitial()
    const avant = structuredClone(etat)
    const appels = []

    await expect(orchestrerTour({
      participantsSelectionnes: cibles(['a', 'b', 'c']),
      sollicitation,
      etatInitial: etat,
      executerParticipant: async ({ participant }) => {
        appels.push(participant.id)
        if (participant.id === 'b') throw new Error('echec b')
        return fragment(participant.id)
      },
    })).rejects.toThrow('echec b')

    expect(appels).toEqual(['a', 'b'])
    expect(etat).toEqual(avant)
  })
})

describe('RFC-004 — agregation isolee', () => {
  test('assemble actions, evenements, memoires, etats prives et traces dans l ordre', () => {
    const etat = etatInitial()
    const resultatsParticipants = [fragment('b'), fragment('a')]

    const resultat = agregerResultats({ sollicitation, etatInitial: etat, resultatsParticipants })

    expect(resultat.actions.map(({ participantId }) => participantId)).toEqual(['b', 'a'])
    expect(resultat.evenementsProduits.map(({ emetteurId }) => emetteurId)).toEqual(['b', 'a'])
    expect(resultat.traces.map(({ participantId }) => participantId)).toEqual(['b', 'a'])
    expect(resultat.etat.etatsPrives).toEqual({
      ...etat.etatsPrives,
      b: { participantId: 'b' },
      a: { participantId: 'a' },
    })
    expect(resultat.etat.memoires.b).toEqual(fragment('b').memoire)
    expect(resultat.etat.memoires.a).toEqual(fragment('a').memoire)
    expect(resultat.etat.historique).toEqual([
      ...etat.historique,
      evenement,
      ...resultat.evenementsProduits,
    ])
    expect(etat).toEqual(etatInitial())
  })
})
