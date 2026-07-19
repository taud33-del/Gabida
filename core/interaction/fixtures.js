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
export const EMETTEUR_ID   = 'participant-joueur'
export const DATE_ISO      = '2024-01-01T00:00:00.000Z'
export const PROVIDER_TEST = 'interaction-provider-deterministe'

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

export function fabriqueFiches() {
  return {
    personnage : { nom: 'Aldric', criteres: { communication: 0.6 }, capaciteMemoire: 20 },
    aventure   : { dureeEstimee: 20 },
    univers    : { nom: 'Hadelas' },
    joueur     : { nom: 'Joueur' },
    memoire    : {},
  }
}

export function fabriqueProfilPersonnage(overrides = {}) {
  return {
    type    : TYPES_PROFIL_PARTICIPANT.PERSONNAGE,
    donnees : { fiches: fabriqueFiches() },
    ...overrides,
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
