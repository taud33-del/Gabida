/**
 * core/events/EventSubscription.js
 *
 * Responsabilite unique : representer un abonnement a un evenement.
 *
 * Question : "Qu'est-ce qu'un abonnement actif dans le bus d'evenements ?"
 *
 * EventSubscription est un objet valeur cree par EventBus.subscribe() et once().
 * Il est retourne a l'appelant pour lui permettre de se desabonner
 * sans conserver une reference au callback.
 *
 * Il ne connait pas EventBus.
 * Il est passif — il ne s'enregistre pas lui-meme.
 * dispose() appelle le callback de desabonnement fourni par EventBus.
 */

// ─── EventSubscription ────────────────────────────────────────────────────────

export class EventSubscription {
  /**
   * @param {string}   event      - Nom de l'evenement.
   * @param {Function} callback   - Callback enregistre.
   * @param {boolean}  once       - Vrai si l'abonnement expire apres le premier appel.
   * @param {Function} onDispose  - Fonction appelee par dispose() pour retirer cet abonnement du bus.
   */
  constructor(event, callback, once, onDispose) {
    /** @type {string} */
    this._event     = event
    /** @type {Function} */
    this._callback  = callback
    /** @type {boolean} */
    this._once      = once
    /** @type {Function} */
    this._onDispose = onDispose
    /** @type {boolean} */
    this._active    = true
  }

  // ─── Accesseurs ──────────────────────────────────────────────────────────────

  /** @returns {string} */
  get event()    { return this._event }

  /** @returns {Function} */
  get callback() { return this._callback }

  /** @returns {boolean} */
  get once()     { return this._once }

  // ─── API publique ────────────────────────────────────────────────────────────

  /**
   * Indique si cet abonnement est encore actif.
   *
   * @returns {boolean}
   */
  isActive() {
    return this._active
  }

  /**
   * Desactive et retire cet abonnement du bus.
   * Idempotent : appeler dispose() plusieurs fois est sans effet.
   *
   * @returns {void}
   */
  dispose() {
    if (!this._active) return
    this._active = false
    this._onDispose(this)
  }
}
