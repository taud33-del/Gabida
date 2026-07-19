import { ErreurValidation } from '../index.js'

export const CODES_ERREUR_INTENTION = Object.freeze({
  LISTE_INTENTIONS_INVALIDE: 'liste_intentions_invalide',
  INTENTION_INVALIDE: 'intention_invalide',
  INTENTION_ID_DUPLIQUE: 'intention_id_duplique',
  PARTICIPANT_INTENTION_INTROUVABLE: 'participant_intention_introuvable',
})

export class ErreurIntention extends ErreurValidation {
  constructor(code, message, intentionId = null) {
    super(message)
    this.name = 'ErreurIntention'
    this.code = code
    this.intentionId = intentionId
  }
}
