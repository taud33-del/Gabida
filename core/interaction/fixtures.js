/**
 * core/interaction/fixtures.js
 *
 * Fabriques de fixtures partagées par les tests de core/interaction.
 * Ce module ne contient aucune logique métier : uniquement des constructeurs de
 * données déterministes pour les tests (hors ligne).
 *
 * Nommé `fixtures.js` (et non `*.test.js`) afin de rester importable sans être
 * exécuté comme suite de tests par Jest.
 *
 * @module core/interaction/fixtures
 */

import { registerProvider }        from '../../api/index.js'
import { TYPES_PARTICIPANT }        from '../../constants/TypesParticipant.js'
import { STATUTS_PARTICIPANT }      from '../../constants/StatutsParticipant.js'
import { TYPES_PROFIL_PARTICIPANT } from '../../constants/TypesProfilParticipant.js'
import { VISIBILITES_EVENEMENT }    from '../../constants/VisibilitesEvenement.js'

export const SESSION_ID    = 'session-interaction-test'
export const PARTICIPANT_ID = 'participant-agent'
export const PARTICIPANT_ID_B = 'participant-agent-b'
export const EMETTEUR_ID   = 'participant-joueur'
export const DATE_ISO      = '2024-01-01T00:00:00.000Z'
export const PROVIDER_TEST = 'interaction-provider-deterministe'
export const PROVIDER_ECHEC = 'interaction-provider-echec'
export const NOM_A = 'Aldric'
export const NOM_B = 'Belgarath'

/**
 * Réponse déterministe du provider (mêmes valeurs à chaque appel).
 */
export const REPONSE_PROVIDER = Object.freeze({
  action       : 'Aldric releve les yeux vers le joueur.',
  dialogue     : 'Bonjour a toi, voyageur.',
  tokensEntree : 12,
  tokensSortie : 7,
})

/**
 * Enregistre un provider déterministe hors ligne et retourne sa configuration.
 * @returns {{ provider: string, cleApi: string, modele: string }}
 */
export function enregistrerProviderDeterministe() {
  registerProvider(PROVIDER_TEST, async () => ({ ...REPONSE_PROVIDER }))
  return { provider: PROVIDER_TEST, cleApi: 'test', modele: 'test-model' }
}

/**
 * Enregistre un provider qui échoue UNIQUEMENT lorsque le prompt contient
 * `marqueur` (typiquement le nom d'un personnage), et répond de façon
 * déterministe sinon. Sert à tester l'atomicité (échec du pipeline d'un
 * participant précis). Hors ligne.
 * @param {string} marqueur
 */
export function enregistrerProviderEchecPour(marqueur) {
  registerProvider(PROVIDER_ECHEC, async messages => {
    if (JSON.stringify(messages).includes(marqueur)) {
      throw new Error(`provider echec (marqueur "${marqueur}")`)
    }
    return { ...REPONSE_PROVIDER }
  })
  return { provider: PROVIDER_ECHEC, cleApi: 'test', modele: 'test-model' }
}

export function fabriqueFiches(nom = NOM_A) {
  return {
    personnage : { nom, criteres: { communication: 0.6 }, capaciteMemoire: 20 },
    aventure   : { dureeEstimee: 20 },
    univers    : { nom: 'Hadelas' },
    joueur     : { nom: 'Joueur' },
    memoire    : {},
  }
}

export function fabriqueProfilPersonnage(overrides = {}) {
  const { nom, ...reste } = overrides
  return {
    type    : TYPES_PROFIL_PARTICIPANT.PERSONNAGE,
    donnees : { fiches: fabriqueFiches(nom ?? NOM_A) },
    ...reste,
  }
}

export function fabriqueCapacites(overrides = {}) {
  return {
    peutPercevoir      : true,
    peutAnalyser       : true,
    peutRessentir      : true,
    peutDecider        : true,
    peutProduireAction : true,
    peutMemoriser      : true,
    ...overrides,
  }
}

export function fabriqueParticipant(overrides = {}) {
  return {
    id        : PARTICIPANT_ID,
    type      : TYPES_PARTICIPANT.AGENT_AUTONOME,
    profil    : fabriqueProfilPersonnage(),
    capacites : fabriqueCapacites(),
    statut    : STATUTS_PARTICIPANT.ACTIF,
    metadata  : {},
    ...overrides,
  }
}

/**
 * Second participant autonome distinct (id + personnage différents) pour les
 * tests multi-participants.
 */
export function fabriqueParticipantB(overrides = {}) {
  return {
    id        : PARTICIPANT_ID_B,
    type      : TYPES_PARTICIPANT.AGENT_AUTONOME,
    profil    : fabriqueProfilPersonnage({ nom: NOM_B }),
    capacites : fabriqueCapacites(),
    statut    : STATUTS_PARTICIPANT.ACTIF,
    metadata  : {},
    ...overrides,
  }
}

export function fabriqueEvenement(overrides = {}) {
  return {
    id             : 'evenement-entree',
    type           : 'message_joueur',
    emetteurId     : EMETTEUR_ID,
    destinataireIds: [PARTICIPANT_ID],
    contenu        : { texte: 'Bonjour Aldric.' },
    visibilite     : VISIBILITES_EVENEMENT.PUBLIQUE,
    date           : DATE_ISO,
    metadata       : {},
    ...overrides,
  }
}

export function fabriqueSollicitation(overrides = {}) {
  const { evenement, ...reste } = overrides
  return {
    id                  : 'sollicitation-1',
    evenement           : evenement ?? fabriqueEvenement(),
    participantIdsCibles: [PARTICIPANT_ID],
    options             : {},
    date                : DATE_ISO,
    ...reste,
  }
}

export function fabriqueEtatInteraction(overrides = {}) {
  const { participants, ...reste } = overrides
  return {
    participants: participants ?? { [PARTICIPANT_ID]: fabriqueParticipant() },
    etatPartage : { meta: { langue: 'fr', debutTimestamp: 0 } },
    etatsPrives : {},
    memoires    : {},
    relations   : {},
    historique  : [],
    metadata    : { sessionId: SESSION_ID },
    ...reste,
  }
}

/**
 * État d'interaction avec DEUX participants autonomes (A puis B) et des mémoires
 * privées initiales distinctes et isolées, pour les tests multi-participants.
 */
export function fabriqueEtatInteractionMulti(overrides = {}) {
  return fabriqueEtatInteraction({
    participants: {
      [PARTICIPANT_ID]  : fabriqueParticipant(),
      [PARTICIPANT_ID_B]: fabriqueParticipantB(),
    },
    memoires: {
      [PARTICIPANT_ID]  : { souvenirs: [{ id: 'souvenir-a', type: 'dialogue', contenu: 'memoire initiale A', importance: 0.9, tour: 1 }] },
      [PARTICIPANT_ID_B]: { souvenirs: [{ id: 'souvenir-b', type: 'dialogue', contenu: 'memoire initiale B', importance: 0.9, tour: 1 }] },
    },
    etatsPrives: {
      [PARTICIPANT_ID]  : { tourCourant: 3, historique: [] },
      [PARTICIPANT_ID_B]: { tourCourant: 7, historique: [] },
    },
    ...overrides,
  })
}

/**
 * Générateur d'identifiants déterministe et resettable pour les tests.
 * @returns {{ genererId: (role?: string) => string, reset: () => void }}
 */
export function fabriqueGenerateurId() {
  let compteur = 0
  return {
    genererId: (role = 'id') => `${role}-${compteur++}`,
    reset    : () => { compteur = 0 },
  }
}
