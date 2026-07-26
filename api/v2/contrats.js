/**
 * Point de validation des contrats de frontiere V2.
 *
 * Les typedefs restent documentes dans `types/`. Cette facade expose uniquement
 * les validations dont une application a besoin avant l'execution.
 */
export {
  validerEtatInteraction as validerEtatInteractionV2,
  validerSollicitation as validerSollicitationV2,
} from '../../core/interaction/index.js'
export { validerIntentionsMetier } from '../../core/intentions/index.js'
export { validerEtatScenes } from '../../core/scenes/index.js'
