/**
 * constants/RuntimeStates.js
 *
 * Etats officiels du cycle de vie du runtime Gabida.
 *
 * Ces valeurs sont la source de verite unique pour toutes les transitions
 * de cycle de vie. Aucun module ne compare des chaines libres pour
 * representer l'etat du runtime.
 *
 * Aucune logique. Aucune dependance. Constantes uniquement.
 */

export const RUNTIME_STATES = Object.freeze({
  STOPPED  : 'stopped',
  STARTING : 'starting',
  RUNNING  : 'running',
  PAUSED   : 'paused',
  STOPPING : 'stopping',
})
