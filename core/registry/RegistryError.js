/**
 * core/registry/RegistryError.js
 *
 * Responsabilite unique : definir les erreurs typees du registre de services.
 *
 * Question : "Quelle erreur s'est produite dans le registre de services ?"
 *
 * Toutes les erreurs du registre sont typees et nommees.
 * Aucune erreur brute ne traverse les frontieres du ServiceRegistry.
 * Aucune logique. Declarations uniquement.
 */

// ─── Erreur de base ───────────────────────────────────────────────────────────

export class RegistryError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'RegistryError'
  }
}

// ─── Erreurs specifiques ──────────────────────────────────────────────────────

export class DuplicateServiceError extends RegistryError {
  /** @param {string} name */
  constructor(name) {
    super(`Service deja enregistre : "${name}"`)
    this.name        = 'DuplicateServiceError'
    this.serviceName = name
  }
}

export class ServiceNotFoundError extends RegistryError {
  /** @param {string} name */
  constructor(name) {
    super(`Service introuvable : "${name}"`)
    this.name        = 'ServiceNotFoundError'
    this.serviceName = name
  }
}

export class InvalidRegistrationError extends RegistryError {
  /**
   * @param {string} reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Enregistrement invalide : ${reason}`)
    this.name   = 'InvalidRegistrationError'
    this.reason = reason
    this.value  = value
  }
}

export class InvalidFactoryError extends RegistryError {
  /** @param {unknown} value */
  constructor(value) {
    super(`La factory doit etre une fonction, recu : ${typeof value}`)
    this.name  = 'InvalidFactoryError'
    this.value = value
  }
}

export class CircularDependencyError extends RegistryError {
  /** @param {string} name */
  constructor(name) {
    super(`Dependance circulaire detectee lors de la resolution de "${name}"`)
    this.name        = 'CircularDependencyError'
    this.serviceName = name
  }
}
