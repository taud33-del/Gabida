/**
 * core/modules/index.js
 *
 * Point d'entree unique du sous-module modules.
 * Ce fichier ne definit rien : il reexporte uniquement.
 */

export { Module, ErreurTransitionModule, ErreurModuleAbstrait } from './Module.js'
export { MODULE_STATES }                                         from './ModuleState.js'
export { MODULE_EVENTS }                                         from './ModuleEvents.js'
export { isTransitionAllowed, getAllowedTransitions }            from './ModuleLifecycle.js'
export {
  ModuleRegistry,
  ErreurRegistreModule,
  ErreurModuleDejaPresentDansRegistre,
  ErreurModuleInconnu,
}                                                                from './ModuleRegistry.js'
export { ModuleManager, ErreurModuleManager }                    from './ModuleManager.js'
