/**
 * Orchestrateur deterministe d'un tour d'interaction (RFC-004).
 *
 * Aucune logique cognitive ou narrative : selection avec la regle fournie,
 * conservation de l'ordre recu, un traitement par participant, puis agregation.
 */

import { ErreurValidation } from '../index.js'

export const CODES_ERREUR_ORCHESTRATION = Object.freeze({
  PARTICIPANT_DUPLIQUE: 'participant_duplique',
})

export class ErreurOrchestration extends ErreurValidation {
  constructor(code, message, participantId) {
    super(message)
    this.name = 'ErreurOrchestration'
    this.code = code
    this.participantId = participantId
  }
}

/**
 * Verifie l'invariant local « un participant, une execution » avant tout appel.
 */
export function validerParticipantsUniques(participantsSelectionnes) {
  const idsVus = new Set()

  for (const { participant } of participantsSelectionnes) {
    if (idsVus.has(participant.id)) {
      throw new ErreurOrchestration(
        CODES_ERREUR_ORCHESTRATION.PARTICIPANT_DUPLIQUE,
        `orchestrerTour : participant duplique ("${participant.id}").`,
        participant.id
      )
    }
    idsVus.add(participant.id)
  }
}

export function selectionnerParticipants(ciblesResolues, evenement, peutPercevoir) {
  return ciblesResolues.filter(
    ({ participant }) => peutPercevoir(participant, evenement)
  )
}

export function ordonnerParticipants(participantsSelectionnes) {
  return [...participantsSelectionnes]
}

export function agregerResultats({ sollicitation, etatInitial, resultatsParticipants }) {
  const actions            = resultatsParticipants.map(resultat => resultat.action)
  const evenementsProduits = resultatsParticipants.map(resultat => resultat.evenementProduit)
  const traces             = resultatsParticipants.flatMap(resultat => resultat.traces)

  const etatsPrives = { ...etatInitial.etatsPrives }
  for (const resultat of resultatsParticipants) {
    etatsPrives[resultat.participantId] = resultat.etatPrive
  }

  const misesAJourMemoire = resultatsParticipants.filter(
    resultat => resultat.memoire !== undefined
  )
  let memoires = etatInitial.memoires
  if (misesAJourMemoire.length > 0) {
    memoires = { ...etatInitial.memoires }
    for (const resultat of misesAJourMemoire) {
      memoires[resultat.participantId] = resultat.memoire
    }
  }

  return {
    sollicitationId: sollicitation.id,
    actions,
    evenementsProduits,
    etat: {
      ...etatInitial,
      etatsPrives,
      memoires,
      historique: [
        ...etatInitial.historique,
        sollicitation.evenement,
        ...evenementsProduits,
      ],
    },
    traces,
  }
}

export async function orchestrerTour({
  participantsSelectionnes,
  sollicitation,
  etatInitial,
  executerParticipant,
}) {
  validerParticipantsUniques(participantsSelectionnes)
  const participantsOrdonnes = ordonnerParticipants(participantsSelectionnes)
  const resultatsParticipants = []

  for (const cible of participantsOrdonnes) {
    resultatsParticipants.push(await executerParticipant(cible, etatInitial))
  }

  return agregerResultats({ sollicitation, etatInitial, resultatsParticipants })
}
