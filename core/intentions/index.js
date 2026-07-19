import { PRIORITES_INTENTION_METIER } from '../../constants/PrioritesIntentionMetier.js'
import { STATUTS_INTENTION_METIER } from '../../constants/StatutsIntentionMetier.js'
import { TYPES_INTENTION_METIER } from '../../constants/TypesIntentionMetier.js'
import { CODES_ERREUR_INTENTION_METIER, ErreurIntentionMetier } from './erreurs.js'

const typesValides = new Set(Object.values(TYPES_INTENTION_METIER))

function erreur(code, message, intentionId) {
  throw new ErreurIntentionMetier(code, `intentions metier : ${message}`, intentionId)
}

export function validerIntentionsMetier(intentions) {
  if (!Array.isArray(intentions)) {
    erreur(CODES_ERREUR_INTENTION_METIER.LISTE_INTENTIONS_INVALIDE, 'la liste doit etre un tableau.')
  }
  const ids = new Set()
  for (const intention of intentions) {
    if (!intention || typeof intention !== 'object' || Array.isArray(intention)) {
      erreur(CODES_ERREUR_INTENTION_METIER.INTENTION_INVALIDE, 'intention absente ou invalide.')
    }
    if (typeof intention.id !== 'string' || intention.id === '' ||
        typeof intention.participantId !== 'string' || intention.participantId === '' ||
        !typesValides.has(intention.type) ||
        !Number.isFinite(intention.priorite) ||
        !Number.isInteger(intention.ordreCreation) || intention.ordreCreation < 0 ||
        (intention.cibleId !== null && intention.cibleId !== undefined &&
          (typeof intention.cibleId !== 'string' || intention.cibleId === '')) ||
        intention.statut !== STATUTS_INTENTION_METIER.PROPOSEE ||
        !intention.metadata || typeof intention.metadata !== 'object' || Array.isArray(intention.metadata)) {
      erreur(CODES_ERREUR_INTENTION_METIER.INTENTION_INVALIDE, 'contrat d intention metier invalide.', intention?.id)
    }
    if (ids.has(intention.id)) {
      erreur(CODES_ERREUR_INTENTION_METIER.INTENTION_ID_DUPLIQUE, `id duplique ("${intention.id}").`, intention.id)
    }
    ids.add(intention.id)
  }
}

export {
  CODES_ERREUR_INTENTION_METIER,
  ErreurIntentionMetier,
  PRIORITES_INTENTION_METIER,
  STATUTS_INTENTION_METIER,
  TYPES_INTENTION_METIER,
}
