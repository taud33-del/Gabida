import { ErreurValidation } from '../index.js'

export const CODES_ERREUR_RESOLUTION_CONFLIT = Object.freeze({
  CONFIGURATION_INVALIDE: 'configuration_resolution_conflits_invalide',
  CONTRAINTE_INVALIDE: 'contrainte_conflit_invalide',
  RESSOURCE_INVALIDE: 'ressource_resolution_invalide',
  PLANIFICATION_INVALIDE: 'planification_resolution_invalide',
  REFERENCE_INTENTION_INCONNUE: 'reference_intention_inconnue',
  CYCLE_DEPENDANCES: 'cycle_dependances_intentions',
  CYCLE_ORDRE: 'cycle_ordre_intentions',
})

export class ErreurResolutionConflit extends ErreurValidation {
  constructor(code, message, intentionId = null) {
    super(message)
    this.name = 'ErreurResolutionConflit'
    this.code = code
    this.intentionId = intentionId
  }
}
