/**
 * core/events/EventError.js
 *
 * Responsabilite unique : definir les erreurs typees du bus d'evenements.
 *
 * Question : "Quelle erreur s'est produite dans le bus d'evenements ?"
 *
 * Toutes les erreurs du bus sont typees et nommees.
 * Aucune erreur brute ne traverse les frontieres du EventBus.
 * Aucune logique. Declarations uniquement.
 */

// ─── Erreur de base ───────────────────────────────────────────────────────────

export class EventBusError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'EventBusError'
  }
}

// ─── Erreurs specifiques ──────────────────────────────────────────────────────

export class InvalidEventNameError extends EventBusError {
  /** @param {unknown} value */
  constructor(value) {
    super(`Nom d'evenement invalide : ${String(value)}`)
    this.name  = 'InvalidEventNameError'
    this.value = value
  }
}

export class InvalidCallbackError extends EventBusError {
  /** @param {unknown} value */
  constructor(value) {
    super(`Le callback doit etre une fonction, recu : ${typeof value}`)
    this.name  = 'InvalidCallbackError'
    this.value = value
  }
}

export class ListenerNotFoundError extends EventBusError {
  /**
   * @param {string} event
   * @param {Function} callback
   */
  constructor(event, callback) {
    super(`Listener introuvable pour l'evenement "${event}"`)
    this.name     = 'ListenerNotFoundError'
    this.event    = event
    this.callback = callback
  }
}

export class DuplicateSubscriptionError extends EventBusError {
  /**
   * @param {string} event
   * @param {Function} callback
   */
  constructor(event, callback) {
    super(`Abonnement en double : le meme callback est deja enregistre pour "${event}"`)
    this.name     = 'DuplicateSubscriptionError'
    this.event    = event
    this.callback = callback
  }
}
