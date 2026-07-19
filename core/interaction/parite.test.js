/**
 * core/interaction/parite.test.js
 *
 * Test de PARITÉ V1 / V2 (Phase 2).
 *
 * Objectif : démontrer que faire passer un participant autonome unique par
 * traiterInteraction (V2) produit exactement le même résultat cognitif que le
 * pipeline V1 (executeTurn), avec des entrées identiques.
 *
 * Les entrées V1 sont construites via l'adaptateur lui-même (mêmes fiches,
 * même message, même état) : c'est précisément ce que traiterInteraction fournit
 * en interne au pipeline. La seule source d'impureté du pipeline
 * (crypto.randomUUID dans memoire/) est neutralisée par une séquence
 * déterministe réinitialisée avant chaque exécution, afin que les identifiants
 * de souvenirs soient comparables. Les identifiants propres à la V2
 * (actions/événements/traces) sont injectés et n'utilisent donc pas crypto.
 */

import { executeTurn } from '../index.js'
import { traiterInteraction } from './index.js'
import {
  construireEtatV1,
  construirePlayerMessage,
  extraireFiches,
} from './adaptateur.js'

import {
  PARTICIPANT_ID,
  enregistrerProviderDeterministe,
  fabriqueParticipant,
  fabriqueSollicitation,
  fabriqueEtatInteraction,
  fabriqueGenerateurId,
} from './fixtures.js'

let providerConfig
const realRandomUUID = crypto.randomUUID
let compteurUuid = 0

function reinitialiserUuid() {
  compteurUuid = 0
}

beforeAll(() => {
  providerConfig = enregistrerProviderDeterministe()
  // Rend crypto.randomUUID déterministe pour les DEUX chemins (V1 et V2).
  crypto.randomUUID = () => `souvenir-${compteurUuid++}`
})

afterAll(() => {
  crypto.randomUUID = realRandomUUID
})

describe('parité V1 / V2', () => {
  test('même dialogue, même action, même mémoire, mêmes étapes cognitives', async () => {
    const participant     = fabriqueParticipant()
    const sollicitation   = fabriqueSollicitation()
    const etatInteraction = fabriqueEtatInteraction({ participants: { [PARTICIPANT_ID]: participant } })

    // ── Chemin V1 : entrées reconstruites par l'adaptateur, pipeline direct ──
    const fichesV1        = extraireFiches(participant.profil)
    const etatV1          = construireEtatV1(PARTICIPANT_ID, etatInteraction)
    const playerMessageV1 = construirePlayerMessage(sollicitation.evenement, etatV1)

    reinitialiserUuid()
    const v1 = await executeTurn(playerMessageV1, providerConfig, fichesV1, etatV1)

    // ── Chemin V2 : traiterInteraction (identifiants V2 injectés) ──
    const gen = fabriqueGenerateurId()
    reinitialiserUuid()
    const v2 = await traiterInteraction(sollicitation, etatInteraction, {
      providerConfig,
      genererId: gen.genererId,
    })

    // ── Parité de la réponse ──
    expect(v2.actions[0].contenu.dialogue).toBe(v1.dialogue)
    expect(v2.actions[0].contenu.action).toBe(v1.action)
    expect(v2.actions[0].participantId).toBe(PARTICIPANT_ID)

    // ── Parité cognitive (analyse, influences, ressenti, décision, réponse, mémoire) ──
    const parEtape = Object.fromEntries(v2.traces.map(t => [t.etape, t.donnees]))
    expect(parEtape.analyse).toEqual(v1.evenement)
    expect(parEtape.influences).toEqual(v1.filtreRelationnel)
    expect(parEtape.ressenti).toEqual(v1.ressenti)
    expect(parEtape.decision).toEqual(v1.decision)
    expect(parEtape.reponse).toEqual(v1.reponseIA)
    expect(parEtape.memoire).toEqual(v1.miseAJourMemoire)

    // ── Parité mémoire et historique conversationnel du participant ──
    expect(v2.etat.memoires[PARTICIPANT_ID]).toEqual(v1.etatMisAJour.memoireVecue)
    expect(v2.etat.etatsPrives[PARTICIPANT_ID].historique).toEqual(v1.etatMisAJour.historique)
    expect(v2.etat.etatsPrives[PARTICIPANT_ID].tourCourant).toBe(v1.etatMisAJour.tourCourant)
  })
})
