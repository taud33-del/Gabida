import { PRIORITES_INTENTION } from '../../constants/PrioritesIntention.js'
import { STATUTS_INTENTION } from '../../constants/StatutsIntention.js'
import { TYPES_INTENTION } from '../../constants/TypesIntention.js'
import { CODES_ERREUR_INTENTION, ErreurIntention } from './erreurs.js'

const typesValides = new Set(Object.values(TYPES_INTENTION))
const statutsEntreeValides = new Set([STATUTS_INTENTION.PROPOSEE])

function erreur(code, message, intentionId) {
  throw new ErreurIntention(code, `intentions : ${message}`, intentionId)
}

export function validerIntentions(intentions) {
  if (!Array.isArray(intentions)) {
    erreur(CODES_ERREUR_INTENTION.LISTE_INTENTIONS_INVALIDE, 'la liste doit etre un tableau.')
  }
  const ids = new Set()
  for (const intention of intentions) {
    if (!intention || typeof intention !== 'object' || Array.isArray(intention)) {
      erreur(CODES_ERREUR_INTENTION.INTENTION_INVALIDE, 'intention absente ou invalide.')
    }
    if (typeof intention.id !== 'string' || intention.id === '' ||
        typeof intention.participantId !== 'string' || intention.participantId === '' ||
        !typesValides.has(intention.type) ||
        !Number.isFinite(intention.priorite) ||
        !Number.isInteger(intention.ordreCreation) || intention.ordreCreation < 0 ||
        !statutsEntreeValides.has(intention.statut) ||
        !intention.metadata || typeof intention.metadata !== 'object' || Array.isArray(intention.metadata)) {
      erreur(CODES_ERREUR_INTENTION.INTENTION_INVALIDE, 'contrat d intention invalide.', intention?.id)
    }
    if (ids.has(intention.id)) {
      erreur(CODES_ERREUR_INTENTION.INTENTION_ID_DUPLIQUE, `id duplique ("${intention.id}").`, intention.id)
    }
    ids.add(intention.id)
  }
}

/** Produit une intention d execution purement structurelle par cible selectionnee. */
export function produireIntentionsExecution({ participantsSelectionnes, evenement }) {
  if (!Array.isArray(participantsSelectionnes) || !evenement || typeof evenement.id !== 'string' || evenement.id === '') {
    erreur(CODES_ERREUR_INTENTION.LISTE_INTENTIONS_INVALIDE, 'entree de production invalide.')
  }
  return participantsSelectionnes.map(({ participant }, ordreCreation) => ({
    id: `intention:${evenement.id}:${participant.id}:${ordreCreation}`,
    participantId: participant.id,
    type: TYPES_INTENTION.EXECUTION_PARTICIPANT,
    priorite: PRIORITES_INTENTION.NORMALE,
    ordreCreation,
    cibleId: typeof evenement.emetteurId === 'string' ? evenement.emetteurId : null,
    contenu: { evenementId: evenement.id },
    statut: STATUTS_INTENTION.PROPOSEE,
    metadata: {},
  }))
}

export {
  CODES_ERREUR_INTENTION,
  ErreurIntention,
  PRIORITES_INTENTION,
  STATUTS_INTENTION,
  TYPES_INTENTION,
}
