/**
 * core/interaction/multi.test.js
 *
 * Tests de la Phase 3 : traiterInteraction traite plusieurs participants
 * autonomes ciblés dans une même sollicitation.
 *
 * Couvre : plusieurs actions attribuées et ordonnées, isolation stricte des
 * mémoires et états privés, absence de réaction croisée, perception minimale,
 * historique enrichi une seule fois, immutabilité, atomicité en cas d'échec du
 * pipeline d'un participant, et rejet des identifiants dupliqués.
 *
 * Hors ligne : provider déterministe enregistré, identifiants injectés.
 */

import {
  traiterInteraction,
  ErreurInteraction,
  ErreurTraitementParticipant,
  CODES_ERREUR_INTERACTION,
} from './index.js'

import { VISIBILITES_EVENEMENT } from '../../constants/VisibilitesEvenement.js'

import {
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  NOM_B,
  enregistrerProviderDeterministe,
  enregistrerProviderEchecPour,
  fabriqueEvenement,
  fabriqueSollicitation,
  fabriqueEtatInteraction,
  fabriqueEtatInteractionMulti,
  fabriqueGenerateurId,
} from './fixtures.js'

let providerConfig
let gen

beforeAll(() => {
  providerConfig = enregistrerProviderDeterministe()
})

beforeEach(() => {
  gen = fabriqueGenerateurId()
})

function dependances(overrides = {}) {
  return { providerConfig, genererId: gen.genererId, ...overrides }
}

// ─── Plusieurs participants : actions attribuées et ordonnées ──────────────────

describe('traiterInteraction — plusieurs participants autonomes', () => {
  test('produit une action par participant, dans l ordre de participantIdsCibles', async () => {
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    const resultat = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())

    expect(resultat.actions).toHaveLength(2)
    expect(resultat.actions[0].participantId).toBe(PARTICIPANT_ID)
    expect(resultat.actions[1].participantId).toBe(PARTICIPANT_ID_B)
  })

  test('respecte l ordre inverse quand participantIdsCibles est inversé', async () => {
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID_B, PARTICIPANT_ID],
    })
    const resultat = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())

    expect(resultat.actions.map(a => a.participantId)).toEqual([PARTICIPANT_ID_B, PARTICIPANT_ID])
    expect(resultat.evenementsProduits.map(e => e.emetteurId)).toEqual([PARTICIPANT_ID_B, PARTICIPANT_ID])
  })

  test('chaque participant conserve son propre id sur son action et son événement', async () => {
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    const resultat = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())

    for (const action of resultat.actions) {
      expect(typeof action.id).toBe('string')
      expect(action.id).not.toBe('')
    }
    expect(new Set(resultat.actions.map(a => a.id)).size).toBe(2)
  })
})

// ─── Isolation mémoire / état privé ─────────────────────────────────────────────

describe('traiterInteraction — isolation cognitive entre participants', () => {
  test('met à jour chaque mémoire à partir de sa propre mémoire initiale, sans fuite', async () => {
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    const etatInteraction = fabriqueEtatInteractionMulti()
    const resultat = await traiterInteraction(sollicitation, etatInteraction, dependances())

    const memoireA = JSON.stringify(resultat.etat.memoires[PARTICIPANT_ID])
    const memoireB = JSON.stringify(resultat.etat.memoires[PARTICIPANT_ID_B])

    // Chaque mémoire dérive de la sienne (souvenir initial préservé)…
    expect(memoireA).toContain('memoire initiale A')
    expect(memoireB).toContain('memoire initiale B')
    // …et ne contient jamais le souvenir de l'autre participant.
    expect(memoireA).not.toContain('memoire initiale B')
    expect(memoireB).not.toContain('memoire initiale A')
  })

  test('la mise à jour de A ne modifie pas la mémoire initiale de B (et inversement)', async () => {
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    const etatInteraction = fabriqueEtatInteractionMulti()
    const memoireBAvant = structuredClone(etatInteraction.memoires[PARTICIPANT_ID_B])
    const memoireAAvant = structuredClone(etatInteraction.memoires[PARTICIPANT_ID])

    await traiterInteraction(sollicitation, etatInteraction, dependances())

    expect(etatInteraction.memoires[PARTICIPANT_ID_B]).toEqual(memoireBAvant)
    expect(etatInteraction.memoires[PARTICIPANT_ID]).toEqual(memoireAAvant)
  })

  test('les états privés sont isolés (chaque tourCourant dérive du sien)', async () => {
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    const resultat = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())

    // tourCourant initial : A = 3, B = 7 → chacun +1, sans contamination.
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID].tourCourant).toBe(4)
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].tourCourant).toBe(8)
  })

  test('un participant ne reçoit pas l action produite par le participant précédent', async () => {
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    const resultat = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())

    // L'historique privé de B (construit à partir de l'état INITIAL) ne contient
    // que son propre échange (2 messages), jamais l'événement/action de A.
    const historiquePriveB = resultat.etat.etatsPrives[PARTICIPANT_ID_B].historique
    expect(historiquePriveB).toHaveLength(2)
    expect(JSON.stringify(historiquePriveB)).not.toContain(PARTICIPANT_ID)
  })
})

// ─── Immutabilité & historique ──────────────────────────────────────────────────

describe('traiterInteraction — immutabilité et historique (multi)', () => {
  test('ne mute pas l état d interaction initial', async () => {
    const etatInteraction = fabriqueEtatInteractionMulti()
    const avant = structuredClone(etatInteraction)
    await traiterInteraction(
      fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }),
      etatInteraction,
      dependances()
    )
    expect(etatInteraction).toEqual(avant)
  })

  test('ajoute l événement d entrée une seule fois puis les événements produits en ordre', async () => {
    const evenementPasse = fabriqueEvenement({ id: 'passe', contenu: { texte: 'ancien' } })
    const etatInteraction = fabriqueEtatInteractionMulti({ historique: [evenementPasse] })
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    const resultat = await traiterInteraction(sollicitation, etatInteraction, dependances())

    const h = resultat.etat.historique
    expect(h[0]).toBe(evenementPasse)
    expect(h[1]).toBe(sollicitation.evenement)
    expect(h.filter(e => e === sollicitation.evenement)).toHaveLength(1)
    expect(h.slice(2)).toEqual(resultat.evenementsProduits)
    expect(h).toHaveLength(1 + 1 + 2)
  })

  test('agrège les traces des deux participants', async () => {
    const resultat = await traiterInteraction(
      fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(),
      dependances()
    )
    // 6 étapes par participant.
    expect(resultat.traces).toHaveLength(12)
    expect(resultat.traces.filter(t => t.participantId === PARTICIPANT_ID)).toHaveLength(6)
    expect(resultat.traces.filter(t => t.participantId === PARTICIPANT_ID_B)).toHaveLength(6)
  })
})

// ─── Perception minimale ────────────────────────────────────────────────────────

describe('traiterInteraction — perception minimale', () => {
  test('événement PUBLIQUE : un participant non destinataire peut le percevoir', async () => {
    const evenement = fabriqueEvenement({
      visibilite: VISIBILITES_EVENEMENT.PUBLIQUE,
      destinataireIds: [PARTICIPANT_ID], // B n'est pas destinataire
    })
    const sollicitation = fabriqueSollicitation({
      evenement,
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    const resultat = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())

    expect(resultat.actions.map(a => a.participantId)).toEqual([PARTICIPANT_ID, PARTICIPANT_ID_B])
  })

  test('événement PRIVEE : seul le destinataire est traité', async () => {
    const evenement = fabriqueEvenement({
      visibilite: VISIBILITES_EVENEMENT.PRIVEE,
      destinataireIds: [PARTICIPANT_ID],
    })
    const sollicitation = fabriqueSollicitation({
      evenement,
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    const resultat = await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())

    expect(resultat.actions).toHaveLength(1)
    expect(resultat.actions[0].participantId).toBe(PARTICIPANT_ID)
    // B non traité : état/mémoire inchangés.
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].tourCourant).toBe(7)
  })

  test('événement non perceptible par aucune cible : erreur documentée', async () => {
    const evenement = fabriqueEvenement({
      visibilite: VISIBILITES_EVENEMENT.PRIVEE,
      destinataireIds: ['quelqu-un-d-autre'],
    })
    const sollicitation = fabriqueSollicitation({
      evenement,
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })
    expect.assertions(2)
    try {
      await traiterInteraction(sollicitation, fabriqueEtatInteractionMulti(), dependances())
    } catch (e) {
      expect(e).toBeInstanceOf(ErreurInteraction)
      expect(e.code).toBe(CODES_ERREUR_INTERACTION.EVENEMENT_NON_PERCEPTIBLE)
    }
  })
})

// ─── Atomicité ──────────────────────────────────────────────────────────────────

describe('traiterInteraction — atomicité', () => {
  test('si le pipeline d un participant échoue, aucun résultat partiel n est retourné', async () => {
    const providerEchec = enregistrerProviderEchecPour(NOM_B) // échoue pour B
    const etatInteraction = fabriqueEtatInteractionMulti()
    const avant = structuredClone(etatInteraction)
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
    })

    expect.assertions(4)
    try {
      await traiterInteraction(sollicitation, etatInteraction, dependances({ providerConfig: providerEchec }))
    } catch (e) {
      expect(e).toBeInstanceOf(ErreurTraitementParticipant)
      expect(e.participantId).toBe(PARTICIPANT_ID_B)
      expect(e.cause).toBeInstanceOf(Error)
    }
    // L'état initial n'a pas été muté (aucun état partiel n'a fuité).
    expect(etatInteraction).toEqual(avant)
  })
})

// ─── Parité Phase 2 ─────────────────────────────────────────────────────────────

describe('traiterInteraction — parité Phase 2 (une seule cible)', () => {
  test('une seule cible produit exactement une action attribuée', async () => {
    const resultat = await traiterInteraction(
      fabriqueSollicitation(),
      fabriqueEtatInteraction(),
      dependances()
    )
    expect(resultat.actions).toHaveLength(1)
    expect(resultat.actions[0].participantId).toBe(PARTICIPANT_ID)
    expect(resultat.evenementsProduits).toHaveLength(1)
  })
})
