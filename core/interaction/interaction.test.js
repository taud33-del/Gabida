/**
 * core/interaction/interaction.test.js
 *
 * Tests de l'interface publique V2 (Phase 2) : traiterInteraction.
 * Couvre le succès (participant autonome unique), l'isolation mémoire/état,
 * l'immutabilité, l'enrichissement de l'historique et tous les cas d'erreur
 * documentés (CODES_ERREUR_INTERACTION).
 *
 * Hors ligne : provider déterministe enregistré, identifiants injectés.
 */

import {
  traiterInteraction,
  resoudreCiblesAutonomes,
  ErreurInteraction,
  ErreurValidation,
  CODES_ERREUR_INTERACTION,
  TYPE_EVENEMENT_ACTION,
} from './index.js'

import { TYPES_ACTION_PARTICIPANT } from '../../constants/TypesActionParticipant.js'
import { TYPES_PARTICIPANT }        from '../../constants/TypesParticipant.js'
import { STATUTS_PARTICIPANT }      from '../../constants/StatutsParticipant.js'
import { TYPES_PROFIL_PARTICIPANT } from '../../constants/TypesProfilParticipant.js'

import {
  PARTICIPANT_ID,
  EMETTEUR_ID,
  enregistrerProviderDeterministe,
  REPONSE_PROVIDER,
  fabriqueParticipant,
  fabriqueEvenement,
  fabriqueSollicitation,
  fabriqueEtatInteraction,
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

// ─── Importabilité ─────────────────────────────────────────────────────────────

describe('importabilité', () => {
  test('l interface V2 est importable', () => {
    expect(typeof traiterInteraction).toBe('function')
    expect(typeof CODES_ERREUR_INTERACTION).toBe('object')
    expect(TYPE_EVENEMENT_ACTION).toBe('action_participant')
  })
})

// ─── Succès ────────────────────────────────────────────────────────────────────

describe('traiterInteraction — succès (participant autonome unique)', () => {
  test('retourne un ResultatInteraction complet', async () => {
    const sollicitation   = fabriqueSollicitation()
    const etatInteraction = fabriqueEtatInteraction()
    const resultat        = await traiterInteraction(sollicitation, etatInteraction, dependances())

    expect(resultat.sollicitationId).toBe(sollicitation.id)
    expect(Array.isArray(resultat.actions)).toBe(true)
    expect(resultat.actions).toHaveLength(1)
    expect(Array.isArray(resultat.evenementsProduits)).toBe(true)
    expect(resultat.etat).toBeDefined()
    expect(Array.isArray(resultat.traces)).toBe(true)
  })

  test('attribue l action au participant ciblé', async () => {
    const resultat = await traiterInteraction(fabriqueSollicitation(), fabriqueEtatInteraction(), dependances())
    expect(resultat.actions[0].participantId).toBe(PARTICIPANT_ID)
  })

  test('l action est de type PAROLE et porte le dialogue', async () => {
    const resultat = await traiterInteraction(fabriqueSollicitation(), fabriqueEtatInteraction(), dependances())
    expect(resultat.actions[0].type).toBe(TYPES_ACTION_PARTICIPANT.PAROLE)
    expect(resultat.actions[0].contenu.dialogue).toBe(REPONSE_PROVIDER.dialogue)
    expect(resultat.actions[0].contenu.action).toBe(REPONSE_PROVIDER.action)
  })

  test('les destinataires dérivent de l émetteur de l événement', async () => {
    const resultat = await traiterInteraction(fabriqueSollicitation(), fabriqueEtatInteraction(), dependances())
    expect(resultat.actions[0].destinataireIds).toEqual([EMETTEUR_ID])
  })

  test('un événement produit représente l action du participant', async () => {
    const resultat = await traiterInteraction(fabriqueSollicitation(), fabriqueEtatInteraction(), dependances())
    expect(resultat.evenementsProduits).toHaveLength(1)
    expect(resultat.evenementsProduits[0].type).toBe(TYPE_EVENEMENT_ACTION)
    expect(resultat.evenementsProduits[0].emetteurId).toBe(PARTICIPANT_ID)
  })

  test('produit des traces pour les étapes cognitives', async () => {
    const resultat = await traiterInteraction(fabriqueSollicitation(), fabriqueEtatInteraction(), dependances())
    const etapes = resultat.traces.map(t => t.etape)
    expect(etapes).toEqual([
      'perception_evaluee', 'perception_acceptee', 'perception_complete',
      'analyse', 'influences', 'ressenti', 'decision', 'reponse', 'memoire',
    ])
    expect(resultat.traces.every(t => t.participantId === PARTICIPANT_ID)).toBe(true)
  })
})

// ─── Isolation mémoire / état privé ─────────────────────────────────────────────

describe('traiterInteraction — isolation par participantId', () => {
  test('met à jour la mémoire uniquement pour le participant ciblé', async () => {
    const autre = fabriqueParticipant({ id: 'autre-agent' })
    const etatInteraction = fabriqueEtatInteraction({
      participants: { [PARTICIPANT_ID]: fabriqueParticipant(), 'autre-agent': autre },
      memoires    : { 'autre-agent': { souvenirs: [{ id: 'x', importance: 1 }] } },
    })
    const resultat = await traiterInteraction(fabriqueSollicitation(), etatInteraction, dependances())

    expect(resultat.etat.memoires['autre-agent']).toBe(etatInteraction.memoires['autre-agent'])
    expect(resultat.etat.memoires[PARTICIPANT_ID]).toBeDefined()
  })

  test('met à jour l état privé uniquement pour le participant ciblé', async () => {
    const etatInteraction = fabriqueEtatInteraction({
      etatsPrives: { 'autre-agent': { tourCourant: 9, historique: [] } },
    })
    const resultat = await traiterInteraction(fabriqueSollicitation(), etatInteraction, dependances())

    expect(resultat.etat.etatsPrives['autre-agent']).toBe(etatInteraction.etatsPrives['autre-agent'])
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID]).toBeDefined()
  })

  test('ne persiste pas la mémoire si peutMemoriser est false', async () => {
    const participant = fabriqueParticipant({
      capacites: { peutPercevoir: true, peutAnalyser: true, peutRessentir: true, peutDecider: true, peutProduireAction: true, peutMemoriser: false },
    })
    const etatInteraction = fabriqueEtatInteraction({ participants: { [PARTICIPANT_ID]: participant } })
    const resultat = await traiterInteraction(fabriqueSollicitation(), etatInteraction, dependances())

    expect(resultat.etat.memoires).toBe(etatInteraction.memoires)
    expect(resultat.etat.memoires[PARTICIPANT_ID]).toBeUndefined()
  })
})

// ─── Immutabilité & historique ──────────────────────────────────────────────────

describe('traiterInteraction — immutabilité et historique', () => {
  test('ne mute pas l état d interaction initial', async () => {
    const etatInteraction = fabriqueEtatInteraction()
    const avant = structuredClone(etatInteraction)
    await traiterInteraction(fabriqueSollicitation(), etatInteraction, dependances())
    expect(etatInteraction).toEqual(avant)
  })

  test('enrichit l historique sans perdre les événements précédents', async () => {
    const evenementPasse = fabriqueEvenement({ id: 'passe', contenu: { texte: 'ancien' } })
    const etatInteraction = fabriqueEtatInteraction({ historique: [evenementPasse] })
    const sollicitation   = fabriqueSollicitation()
    const resultat        = await traiterInteraction(sollicitation, etatInteraction, dependances())

    expect(resultat.etat.historique[0]).toBe(evenementPasse)
    expect(resultat.etat.historique[1]).toBe(sollicitation.evenement)
    expect(resultat.etat.historique).toHaveLength(1 + 1 + resultat.evenementsProduits.length)
  })
})

// ─── resoudreCiblesAutonomes ────────────────────────────────────────────────────

describe('resoudreCiblesAutonomes', () => {
  test('résout les cibles dans l ordre de participantIdsCibles', () => {
    const etatInteraction = fabriqueEtatInteraction()
    const resolues = resoudreCiblesAutonomes(fabriqueSollicitation(), etatInteraction)
    expect(resolues).toHaveLength(1)
    expect(resolues[0].participant.id).toBe(PARTICIPANT_ID)
    expect(resolues[0].fiches).toBeDefined()
  })
})

// ─── Cas d'erreur ────────────────────────────────────────────────────────────────

describe('traiterInteraction — validations et erreurs', () => {
  async function attendreCode(sollicitation, etatInteraction, code, deps) {
    expect.assertions(2)
    try {
      await traiterInteraction(sollicitation, etatInteraction, deps ?? dependances())
    } catch (e) {
      expect(e).toBeInstanceOf(ErreurInteraction)
      expect(e.code).toBe(code)
    }
  }

  test('providerConfig absent', async () => {
    await expect(
      traiterInteraction(fabriqueSollicitation(), fabriqueEtatInteraction(), { genererId: gen.genererId })
    ).rejects.toThrow(ErreurInteraction)
  })

  test('sollicitation absente', () =>
    attendreCode(null, fabriqueEtatInteraction(), CODES_ERREUR_INTERACTION.SOLLICITATION_INVALIDE))

  test('état d interaction invalide', () =>
    attendreCode(fabriqueSollicitation(), {}, CODES_ERREUR_INTERACTION.ETAT_INTERACTION_INVALIDE))

  test('aucun participant cible', () =>
    attendreCode(
      fabriqueSollicitation({ participantIdsCibles: [] }),
      fabriqueEtatInteraction(),
      CODES_ERREUR_INTERACTION.CIBLES_ABSENTES
    ))

  test('participant cible introuvable', () =>
    attendreCode(
      fabriqueSollicitation({ participantIdsCibles: ['inexistant'] }),
      fabriqueEtatInteraction(),
      CODES_ERREUR_INTERACTION.PARTICIPANT_INTROUVABLE
    ))

  test('identifiant cible dupliqué', () => {
    const etatInteraction = fabriqueEtatInteraction()
    return attendreCode(
      fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID] }),
      etatInteraction,
      CODES_ERREUR_INTERACTION.CIBLES_DUPLIQUEES
    )
  })

  test('participant ciblé non autonome', () => {
    const externe = fabriqueParticipant({ id: 'ext', type: TYPES_PARTICIPANT.EMETTEUR_EXTERNE })
    const etatInteraction = fabriqueEtatInteraction({ participants: { ext: externe } })
    return attendreCode(
      fabriqueSollicitation({ participantIdsCibles: ['ext'] }),
      etatInteraction,
      CODES_ERREUR_INTERACTION.PARTICIPANT_NON_AUTONOME
    )
  })

  test('participant inactif ne lance aucun pipeline', async () => {
    const participant = fabriqueParticipant({ statut: STATUTS_PARTICIPANT.INACTIF })
    const etatInteraction = fabriqueEtatInteraction({ participants: { [PARTICIPANT_ID]: participant } })
    const resultat = await traiterInteraction(fabriqueSollicitation(), etatInteraction, dependances())
    expect(resultat.actions).toEqual([])
    expect(resultat.traces.map(trace => trace.etape)).toEqual([
      'perception_evaluee', 'perception_refusee',
    ])
  })

  test('capacité indispensable absente', () => {
    const participant = fabriqueParticipant({
      capacites: { peutPercevoir: true, peutAnalyser: true, peutRessentir: true, peutDecider: false, peutProduireAction: true, peutMemoriser: true },
    })
    const etatInteraction = fabriqueEtatInteraction({ participants: { [PARTICIPANT_ID]: participant } })
    return attendreCode(fabriqueSollicitation(), etatInteraction, CODES_ERREUR_INTERACTION.CAPACITE_INDISPENSABLE_ABSENTE)
  })

  test('profil non pris en charge', () => {
    const participant = fabriqueParticipant({ profil: { type: TYPES_PROFIL_PARTICIPANT.SYSTEME, donnees: {} } })
    const etatInteraction = fabriqueEtatInteraction({ participants: { [PARTICIPANT_ID]: participant } })
    return attendreCode(fabriqueSollicitation(), etatInteraction, CODES_ERREUR_INTERACTION.PROFIL_NON_SUPPORTE)
  })

  test('profil absent', () => {
    const participant = fabriqueParticipant({ profil: null })
    const etatInteraction = fabriqueEtatInteraction({ participants: { [PARTICIPANT_ID]: participant } })
    return attendreCode(fabriqueSollicitation(), etatInteraction, CODES_ERREUR_INTERACTION.PROFIL_ABSENT)
  })

  test('données de profil personnage incomplètes', () => {
    const participant = fabriqueParticipant({
      profil: { type: TYPES_PROFIL_PARTICIPANT.PERSONNAGE, donnees: { fiches: { personnage: {} } } },
    })
    const etatInteraction = fabriqueEtatInteraction({ participants: { [PARTICIPANT_ID]: participant } })
    return attendreCode(fabriqueSollicitation(), etatInteraction, CODES_ERREUR_INTERACTION.DONNEES_PROFIL_INCOMPLETES)
  })

  test('mémoire incohérente', () => {
    const etatInteraction = fabriqueEtatInteraction({ memoires: { [PARTICIPANT_ID]: { souvenirs: 'pas-un-tableau' } } })
    return attendreCode(fabriqueSollicitation(), etatInteraction, CODES_ERREUR_INTERACTION.ETAT_PRIVE_INCOHERENT)
  })

  test('ErreurInteraction est une ErreurValidation', () => {
    expect(new ErreurInteraction(CODES_ERREUR_INTERACTION.PROFIL_ABSENT, 'x')).toBeInstanceOf(ErreurValidation)
  })
})
