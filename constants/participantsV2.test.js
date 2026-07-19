/**
 * constants/participantsV2.test.js
 *
 * Vérifie uniquement le contrat des constantes du modèle multi-participants
 * (Gabida V2 — Phase 1) : existence, immuabilité et valeurs exactes.
 *
 * Aucun test métier : aucune logique multi-participants n'est implémentée à ce
 * stade.
 */

import {
  TYPES_PARTICIPANT,
  STATUTS_PARTICIPANT,
  TYPES_PROFIL_PARTICIPANT,
  VISIBILITES_EVENEMENT,
  TYPES_ACTION_PARTICIPANT,
} from './index.js'

describe('constants V2 — modèle multi-participants', () => {
  const cas = [
    [
      'TYPES_PARTICIPANT',
      TYPES_PARTICIPANT,
      {
        AGENT_AUTONOME: 'agent_autonome',
        EMETTEUR_EXTERNE: 'emetteur_externe',
        NARRATEUR: 'narrateur',
        SYSTEME: 'systeme',
      },
    ],
    [
      'STATUTS_PARTICIPANT',
      STATUTS_PARTICIPANT,
      {
        ACTIF: 'actif',
        PASSIF: 'passif',
        INACTIF: 'inactif',
      },
    ],
    [
      'TYPES_PROFIL_PARTICIPANT',
      TYPES_PROFIL_PARTICIPANT,
      {
        PERSONNAGE: 'personnage',
        UTILISATEUR: 'utilisateur',
        NARRATEUR: 'narrateur',
        SYSTEME: 'systeme',
        PERSONNALISE: 'personnalise',
      },
    ],
    [
      'VISIBILITES_EVENEMENT',
      VISIBILITES_EVENEMENT,
      {
        PUBLIQUE: 'publique',
        PRIVEE: 'privee',
        RESTREINTE: 'restreinte',
        SYSTEME: 'systeme',
      },
    ],
    [
      'TYPES_ACTION_PARTICIPANT',
      TYPES_ACTION_PARTICIPANT,
      {
        PAROLE: 'parole',
        ACTION: 'action',
        REACTION_INTERNE: 'reaction_interne',
        OBSERVATION: 'observation',
        SILENCE: 'silence',
      },
    ],
  ]

  test.each(cas)('%s existe et est un objet non nul', (_nom, constante) => {
    expect(constante).toBeDefined()
    expect(typeof constante).toBe('object')
    expect(constante).not.toBeNull()
  })

  test.each(cas)('%s est gelée (immuable, comme les constantes V1)', (_nom, constante) => {
    expect(Object.isFrozen(constante)).toBe(true)
  })

  test.each(cas)('%s expose exactement les valeurs attendues', (_nom, constante, attendu) => {
    expect({ ...constante }).toEqual(attendu)
  })
})
