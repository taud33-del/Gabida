/**
 * core/registry/RegistrationTypes.js
 *
 * Responsabilite unique : declarer les types d'enregistrement du registre de services.
 *
 * Question : "Quel est le cycle de vie d'un service enregistre ?"
 *
 * SINGLETON  : cree une seule fois au premier resolve(), puis mis en cache.
 * TRANSIENT  : cree a chaque resolve(), jamais mis en cache.
 * INSTANCE   : objet deja construit fourni directement, retourne tel quel.
 *
 * Aucune logique. Aucune dependance. Constantes uniquement.
 */

export const REGISTRATION_TYPES = Object.freeze({
  SINGLETON  : 'singleton',
  TRANSIENT  : 'transient',
  INSTANCE   : 'instance',
})
