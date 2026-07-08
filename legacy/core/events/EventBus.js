/**
 * core/events/EventBus.js
 *
 * Responsabilite unique : orchestrer la communication par evenements entre modules.
 *
 * Question : "Comment les modules communiquent-ils sans se connaitre directement ?"
 *
 * L'EventBus est le seul mecanisme de communication entre modules independants.
 * Il ne connait pas le Runtime.
 * Il ne connait pas le ModuleManager.
 * Il n'importe aucun module metier.
 *
 * Regles d'execution :
 *   - Les listeners s'executent de facon synchrone dans leur ordre d'enregistrement.
 *   - L'ordre d'enregistrement est preserve.
 *   - Un listener qui lance une erreur ne corrompt pas l'etat du bus.
 *   - La suppression d'un listener pendant emit() ne brise pas l'iteration.
 *   - L'ajout d'un listener pendant emit() n'affecte pas l'emission en cours.
 *   - Les payloads sont transmis tels quels — le bus ne les modifie pas.
 *
 * Le bus ne contient aucune logique metier.
 * Il ne met jamais en file d'attente les evenements.
 * Il ne rattrape jamais silencieusement les erreurs des listeners.
 */

import { EventSubscription }              from './EventSubscription.js'
import { validateEventName, validateCallback } from './EventValidator.js'
import {
  ListenerNotFoundError,
  DuplicateSubscriptionError,
} from './EventError.js'

// ─── EventBus ─────────────────────────────────────────────────────────────────

export class EventBus {
  constructor() {
    /** @type {Map<string, EventSubscription[]>} */
    this._listeners = new Map()
  }

  // ─── API publique ────────────────────────────────────────────────────────────

  /**
   * Enregistre un listener pour un evenement.
   * Lance DuplicateSubscriptionError si le meme callback est deja enregistre.
   *
   * @param {string}   event    - Nom de l'evenement.
   * @param {Function} callback - Fonction a appeler lors de l'emission.
   * @returns {EventSubscription}
   * @throws {InvalidEventNameError}
   * @throws {InvalidCallbackError}
   * @throws {DuplicateSubscriptionError}
   */
  subscribe(event, callback) {
    validateEventName(event)
    validateCallback(callback)

    const existing = this._getList(event)
    if (existing.some(s => s.callback === callback)) {
      throw new DuplicateSubscriptionError(event, callback)
    }

    const subscription = new EventSubscription(
      event,
      callback,
      false,
      (sub) => this._remove(event, sub),
    )
    this._getOrCreate(event).push(subscription)
    return subscription
  }

  /**
   * Retire un listener enregistre via son callback.
   * Lance ListenerNotFoundError si aucun listener correspondant n'existe.
   *
   * @param {string}   event    - Nom de l'evenement.
   * @param {Function} callback - Callback a retirer.
   * @returns {void}
   * @throws {InvalidEventNameError}
   * @throws {InvalidCallbackError}
   * @throws {ListenerNotFoundError}
   */
  unsubscribe(event, callback) {
    validateEventName(event)
    validateCallback(callback)

    const list = this._getList(event)
    const sub  = list.find(s => s.callback === callback && s.isActive())
    if (!sub) throw new ListenerNotFoundError(event, callback)
    sub.dispose()
  }

  /**
   * Emet un evenement et appelle tous les listeners actifs dans leur ordre
   * d'enregistrement. Une copie de la liste est utilisee pour chaque emission,
   * garantissant la stabilite en cas de modifications pendant l'iteration.
   *
   * Les erreurs des listeners sont propagees et interrompent l'emission.
   *
   * @param {string} event   - Nom de l'evenement.
   * @param {*}      payload - Donnees transmises aux listeners (non modifiees).
   * @returns {void}
   * @throws {InvalidEventNameError}
   */
  emit(event, payload) {
    validateEventName(event)

    const snapshot = [...this._getList(event)]
    for (const sub of snapshot) {
      if (!sub.isActive()) continue
      sub.callback(payload)
      if (sub.once) sub.dispose()
    }
  }

  /**
   * Enregistre un listener qui se desabonne automatiquement apres le premier appel.
   *
   * @param {string}   event    - Nom de l'evenement.
   * @param {Function} callback - Fonction a appeler une seule fois.
   * @returns {EventSubscription}
   * @throws {InvalidEventNameError}
   * @throws {InvalidCallbackError}
   * @throws {DuplicateSubscriptionError}
   */
  once(event, callback) {
    validateEventName(event)
    validateCallback(callback)

    const existing = this._getList(event)
    if (existing.some(s => s.callback === callback)) {
      throw new DuplicateSubscriptionError(event, callback)
    }

    const subscription = new EventSubscription(
      event,
      callback,
      true,
      (sub) => this._remove(event, sub),
    )
    this._getOrCreate(event).push(subscription)
    return subscription
  }

  /**
   * Retire tous les listeners de tous les evenements.
   *
   * @returns {void}
   */
  clear() {
    for (const [, list] of this._listeners) {
      for (const sub of list) {
        sub.dispose()
      }
    }
    this._listeners.clear()
  }

  /**
   * Retourne le nombre de listeners actifs pour un evenement.
   *
   * @param {string} event
   * @returns {number}
   * @throws {InvalidEventNameError}
   */
  listenerCount(event) {
    validateEventName(event)
    return this._getList(event).filter(s => s.isActive()).length
  }

  /**
   * Indique si un evenement possede au moins un listener actif.
   *
   * @param {string} event
   * @returns {boolean}
   * @throws {InvalidEventNameError}
   */
  hasListeners(event) {
    validateEventName(event)
    return this._getList(event).some(s => s.isActive())
  }

  // ─── Interne ──────────────────────────────────────────────────────────────────

  /**
   * Retourne la liste des abonnements pour un evenement, ou tableau vide.
   *
   * @param {string} event
   * @returns {EventSubscription[]}
   */
  _getList(event) {
    return this._listeners.get(event) ?? []
  }

  /**
   * Retourne la liste des abonnements, en la creant si necessaire.
   *
   * @param {string} event
   * @returns {EventSubscription[]}
   */
  _getOrCreate(event) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, [])
    }
    return this._listeners.get(event)
  }

  /**
   * Retire un abonnement de la liste d'un evenement.
   *
   * @param {string}            event
   * @param {EventSubscription} sub
   * @returns {void}
   */
  _remove(event, sub) {
    const list = this._listeners.get(event)
    if (!list) return
    const idx = list.indexOf(sub)
    if (idx !== -1) list.splice(idx, 1)
  }
}
