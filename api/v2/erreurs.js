// Classes et codes stables. Les messages humains ne font pas partie du contrat.
export {
  ErreurGabida,
  ErreurPipeline,
  ErreurProvider,
  ErreurValidation,
} from '../../core/index.js'
export {
  CODES_ERREUR_INTERACTION,
  ErreurInteraction,
  ErreurTraitementParticipant,
} from '../../core/interaction/index.js'
export {
  CODES_ERREUR_ORCHESTRATION,
  ErreurOrchestration,
} from '../../core/interaction/orchestrateur.js'
export {
  CODES_ERREUR_PROPAGATION,
  ErreurPropagation,
} from '../../core/interaction/propagation.js'
export {
  CODES_ERREUR_PERCEPTION,
  ErreurPerception,
} from '../../core/perception/index.js'
export {
  CODES_ERREUR_EPISTEMIQUE,
  ErreurEpistemique,
} from '../../core/epistemique/index.js'
export {
  CODES_ERREUR_RELATION,
  ErreurRelation,
} from '../../core/relations/index.js'
export {
  CODES_ERREUR_TRANSMISSION,
  ErreurTransmission,
} from '../../core/transmissions/index.js'
export {
  CODES_ERREUR_INTENTION_METIER,
  ErreurIntentionMetier,
} from '../../core/intentions/index.js'
export {
  CODES_ERREUR_RESOLUTION_CONFLIT,
  ErreurResolutionConflit,
} from '../../core/resolution-conflits/index.js'
export {
  CODES_ERREUR_SCENE,
  ErreurScene,
} from '../../core/scenes/index.js'
export {
  InvalidProviderError,
  ProviderAlreadyRegisteredError,
  ProviderError,
  ProviderNotFoundError,
} from '../ProviderError.js'
