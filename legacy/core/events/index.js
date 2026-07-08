/**
 * core/events/index.js
 *
 * Point d'entree unique du sous-module events.
 * Ce fichier ne definit rien : il reexporte uniquement.
 */

export { EventBus }                                  from './EventBus.js'
export { EventSubscription }                         from './EventSubscription.js'
export { EVENT_TYPES }                               from './EventTypes.js'
export { validateEventName, validateCallback,
         isValidEventName, isValidCallback }         from './EventValidator.js'
export {
  EventBusError,
  InvalidEventNameError,
  InvalidCallbackError,
  ListenerNotFoundError,
  DuplicateSubscriptionError,
}                                                    from './EventError.js'
