/**
 * core/runtime/RuntimeEvents.js
 *
 * Responsabilite unique : centraliser les identifiants d'evenements du runtime.
 *
 * Question : "Quels sont les evenements officiels emis par le runtime ?"
 *
 * Ce fichier ne cree pas de bus d'evenements.
 * Il ne contient aucune logique.
 * Il declare uniquement les noms d'evenements stables que les modules
 * et l'application hote peuvent utiliser pour s'abonner ou publier.
 *
 * Aucune dependance. Constantes uniquement.
 */

export const RUNTIME_EVENTS = Object.freeze({
  STARTED : 'runtime.started',
  STOPPED : 'runtime.stopped',
  PAUSED  : 'runtime.paused',
  RESUMED : 'runtime.resumed',
  ERROR   : 'runtime.error',
})
