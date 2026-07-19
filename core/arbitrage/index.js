import { MODES_PLANIFICATION_EXECUTION } from '../../constants/ModesPlanificationExecution.js'
import { STATUTS_INTENTION_METIER } from '../../constants/StatutsIntentionMetier.js'
import { TYPES_INTENTION_METIER } from '../../constants/TypesIntentionMetier.js'
import {
  CODES_ERREUR_INTENTION_METIER,
  ErreurIntentionMetier,
  validerIntentionsMetier,
} from '../intentions/index.js'

function comparerTexte(a, b) {
  if (a === b) return 0
  return a < b ? -1 : 1
}

export function comparerIntentionsMetier(a, b) {
  if (a.priorite !== b.priorite) return b.priorite - a.priorite
  if (a.ordreCreation !== b.ordreCreation) return a.ordreCreation - b.ordreCreation
  const participant = comparerTexte(a.participantId, b.participantId)
  return participant !== 0 ? participant : comparerTexte(a.id, b.id)
}

export function arbitrerIntentionsMetier(intentions) {
  validerIntentionsMetier(intentions)
  const ordonnees = [...intentions].sort(comparerIntentionsMetier)
  const participantsArbitres = new Set()
  const intentionsRetenues = []
  const intentionsEcartees = []

  for (const intention of ordonnees) {
    const retenue = !participantsArbitres.has(intention.participantId)
    const resultat = {
      ...intention,
      cibleId: intention.cibleId ?? null,
      metadata: { ...intention.metadata },
      statut: retenue ? STATUTS_INTENTION_METIER.RETENUE : STATUTS_INTENTION_METIER.ECARTEE,
    }
    if (retenue) {
      participantsArbitres.add(intention.participantId)
      intentionsRetenues.push(resultat)
    } else {
      intentionsEcartees.push(resultat)
    }
  }
  return { intentionsRetenues, intentionsEcartees }
}

export function planifierExecutionCompatibiliteRfc010(participantsSelectionnes) {
  return participantsSelectionnes.map((cible, ordreExecution) => ({
    cible,
    planification: {
      participantId: cible.participant.id,
      intentionId: null,
      ordreExecution,
      mode: MODES_PLANIFICATION_EXECUTION.COMPATIBILITE_RFC010,
    },
  }))
}

export function preparerPlanificationsExecution({
  participantsSelectionnes,
  evenement,
  producteurIntentionsMetier,
}) {
  if (typeof producteurIntentionsMetier !== 'function') {
    return {
      cheminCompatibiliteRfc010: true,
      executionsPlanifiees: planifierExecutionCompatibiliteRfc010(participantsSelectionnes),
    }
  }

  const intentions = producteurIntentionsMetier({ participantsSelectionnes, evenement })
  const arbitrage = arbitrerIntentionsMetier(intentions)
  const cibles = new Map(participantsSelectionnes.map(cible => [cible.participant.id, cible]))
  const executionsPlanifiees = []

  for (const intention of arbitrage.intentionsRetenues) {
    const cible = cibles.get(intention.participantId)
    if (!cible) {
      throw new ErreurIntentionMetier(
        CODES_ERREUR_INTENTION_METIER.PARTICIPANT_INTENTION_INTROUVABLE,
        `arbitrage : participant "${intention.participantId}" introuvable.`,
        intention.id
      )
    }
    if (intention.type === TYPES_INTENTION_METIER.RENONCEMENT) continue
    executionsPlanifiees.push({
      cible: { ...cible, intentionMetier: intention },
      planification: {
        participantId: intention.participantId,
        intentionId: intention.id,
        ordreExecution: executionsPlanifiees.length,
        mode: MODES_PLANIFICATION_EXECUTION.INTENTION_METIER,
      },
    })
  }

  return {
    cheminCompatibiliteRfc010: false,
    executionsPlanifiees,
    intentionsRetenues: arbitrage.intentionsRetenues,
    intentionsEcartees: arbitrage.intentionsEcartees,
  }
}
