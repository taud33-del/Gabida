/**
 * core/runtime/index.js
 *
 * Point d'entree unique du sous-module runtime.
 * Ce fichier ne definit rien : il reexporte uniquement.
 */

export { Runtime, ErreurTransitionRuntime } from './Runtime.js'
export { RuntimeState }                     from './RuntimeState.js'
export { RUNTIME_EVENTS }                   from './RuntimeEvents.js'
export { isTransitionAllowed, getAllowedTransitions } from './RuntimeLifecycle.js'
export {
  RuntimeError,
  InvalidPipelineError,
  InvalidContextError,
  RuntimeExecutionError,
} from './RuntimeError.js'
