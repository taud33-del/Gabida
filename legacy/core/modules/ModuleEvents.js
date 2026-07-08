/**
 * core/modules/ModuleEvents.js
 *
 * Responsabilite unique : centraliser les identifiants d'evenements des modules.
 *
 * Question : "Quels sont les evenements officiels emis par un module Gabida ?"
 *
 * Ce fichier ne cree pas de bus d'evenements.
 * Il ne contient aucune logique.
 * Il declare uniquement les noms d'evenements stables que le ModuleManager
 * et les consommateurs peuvent utiliser pour s'abonner ou publier.
 *
 * Aucune dependance. Constantes uniquement.
 */

export const MODULE_EVENTS = Object.freeze({
  INITIALIZED : 'module.initialized',
  STARTED     : 'module.started',
  STOPPED     : 'module.stopped',
  DISPOSED    : 'module.disposed',
  ERROR       : 'module.error',
})
