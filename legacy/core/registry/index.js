/**
 * core/registry/index.js
 *
 * Point d'entree unique du sous-module registry.
 * Ce fichier ne definit rien : il reexporte uniquement.
 */

export { ServiceRegistry }                                from './ServiceRegistry.js'
export { ServiceDescriptor }                              from './ServiceDescriptor.js'
export { REGISTRATION_TYPES }                             from './RegistrationTypes.js'
export {
  validateServiceName,
  validateRegistrationType,
  validateFactory,
  isValidServiceName,
  isValidRegistrationType,
  isValidFactory,
}                                                         from './RegistryValidator.js'
export {
  RegistryError,
  DuplicateServiceError,
  ServiceNotFoundError,
  InvalidRegistrationError,
  InvalidFactoryError,
  CircularDependencyError,
}                                                         from './RegistryError.js'
