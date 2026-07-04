/**
 * core/modules/ModuleState.js
 *
 * Responsabilite unique : declarer les etats officiels du cycle de vie d'un module.
 *
 * Question : "Quels sont les etats possibles d'un module Gabida ?"
 *
 * Aucune logique. Aucune dependance. Constantes uniquement.
 * Ces valeurs sont la source de verite unique pour toutes les transitions
 * de cycle de vie des modules. Aucun module ne compare des chaines libres.
 */

export const MODULE_STATES = Object.freeze({
  CREATED     : 'created',
  INITIALIZED : 'initialized',
  STARTING    : 'starting',
  RUNNING     : 'running',
  STOPPING    : 'stopping',
  STOPPED     : 'stopped',
  DISPOSED    : 'disposed',
  ERROR       : 'error',
})
