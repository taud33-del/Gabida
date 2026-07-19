import { STATUTS_INTENTION } from '../../constants/StatutsIntention.js'
import {
  CODES_ERREUR_INTENTION,
  ErreurIntention,
  produireIntentionsExecution as producteurParDefaut,
  validerIntentions,
} from '../intentions/index.js'

function comparerTexte(a, b) {
  if (a === b) return 0
  return a < b ? -1 : 1
}

/** Comparateur total : priorite, FIFO, participantId, id. */
export function comparerIntentions(a, b) {
  if (a.priorite !== b.priorite) return b.priorite - a.priorite
  if (a.ordreCreation !== b.ordreCreation) return a.ordreCreation - b.ordreCreation
  const participant = comparerTexte(a.participantId, b.participantId)
  return participant !== 0 ? participant : comparerTexte(a.id, b.id)
}

/**
 * Trie sans muter l entree et retient au plus une intention par participant.
 * La premiere intention du participant dans l ordre total est retenue.
 */
export function arbitrerIntentions(intentions) {
  validerIntentions(intentions)
  const ordonnees = [...intentions].sort(comparerIntentions)
  const participantsRetenus = new Set()
  const intentionsRetenues = []
  const intentionsEcartees = []

  for (const intention of ordonnees) {
    const retenue = !participantsRetenus.has(intention.participantId)
    const resultat = {
      ...intention,
      metadata: { ...intention.metadata },
      statut: retenue ? STATUTS_INTENTION.RETENUE : STATUTS_INTENTION.ECARTEE,
    }
    if (retenue) {
      participantsRetenus.add(intention.participantId)
      intentionsRetenues.push(resultat)
    } else {
      intentionsEcartees.push(resultat)
    }
  }
  return { intentionsRetenues, intentionsEcartees }
}

/** Produit, arbitre et remappe les intentions vers les cibles de l orchestrateur. */
export function preparerOrchestrationIntentions({ participantsSelectionnes, evenement, producteur }) {
  return preparerAvecProducteur({ participantsSelectionnes, evenement, producteur })
}

function preparerAvecProducteur({ participantsSelectionnes, evenement, producteur }) {
  const produire = producteur ?? producteurParDefaut
  const intentions = produire({ participantsSelectionnes, evenement })
  const resultatArbitrage = arbitrerIntentions(intentions)
  const ciblesParParticipant = new Map(
    participantsSelectionnes.map(cible => [cible.participant.id, cible])
  )
  const participantsArbitres = resultatArbitrage.intentionsRetenues.map(intention => {
    const cible = ciblesParParticipant.get(intention.participantId)
    if (!cible) {
      throw new ErreurIntention(
        CODES_ERREUR_INTENTION.PARTICIPANT_INTENTION_INTROUVABLE,
        `arbitrage : participant "${intention.participantId}" introuvable.`,
        intention.id
      )
    }
    return { ...cible, intention }
  })
  return { ...resultatArbitrage, participantsArbitres }
}
