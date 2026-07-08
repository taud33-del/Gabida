/**
 * core/events/EventTypes.js
 *
 * Responsabilite unique : centraliser les types d'evenements officiels de Gabida.
 *
 * Question : "Quels sont les evenements officiels du moteur Gabida ?"
 *
 * Ce fichier ne cree pas de bus d'evenements.
 * Il ne contient aucune logique.
 * Il declare uniquement les noms d'evenements stables utilises par
 * les emetteurs et les abonnes a travers tout le moteur.
 *
 * Convention de nommage : domaine.action
 *
 * Aucune dependance. Constantes uniquement.
 */

export const EVENT_TYPES = Object.freeze({

  // ─── Modules ──────────────────────────────────────────────────────────────────
  MODULE_INITIALIZED : 'module.initialized',
  MODULE_STARTED     : 'module.started',
  MODULE_STOPPED     : 'module.stopped',
  MODULE_DISPOSED    : 'module.disposed',
  MODULE_ERROR       : 'module.error',

  // ─── Runtime ──────────────────────────────────────────────────────────────────
  RUNTIME_STARTED    : 'runtime.started',
  RUNTIME_STOPPED    : 'runtime.stopped',
  RUNTIME_PAUSED     : 'runtime.paused',
  RUNTIME_RESUMED    : 'runtime.resumed',

})
