/**
 * API publique stable Gabida V2.
 *
 * Cette facade ne contient aucune logique metier : elle nomme et reexporte une
 * surface volontairement limitee, independante de l'organisation de `core/`.
 */
export { VERSION_API_GABIDA_V2 } from './version.js'
export * from './constantes.js'
export * from './erreurs.js'
export * from './contrats.js'

export { traiterInteraction as traiterInteractionV2 } from '../../core/interaction/index.js'
export { registerProvider } from '../index.js'

export {
  ajouterMembresGroupeScene,
  associerGroupeScene,
  creerGroupeParticipants,
  creerSceneInteraction,
  deplacerVersSousScene,
  entrerDansScene,
  quitterScene,
  rejoindreSceneParente,
  transitionnerScene,
} from '../../core/scenes/index.js'

export {
  arbitrerIntentionsMetier,
} from '../../core/arbitrage/index.js'
export {
  normaliserConfigurationResolutionConflits,
  resoudreConflitsActions,
} from '../../core/resolution-conflits/index.js'
