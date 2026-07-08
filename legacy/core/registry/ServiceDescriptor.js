/**
 * core/registry/ServiceDescriptor.js
 *
 * Responsabilite unique : representer un service enregistre dans le registre.
 *
 * Question : "Que sait-on d'un service enregistre ?"
 *
 * ServiceDescriptor est un objet valeur cree par ServiceRegistry lors de chaque
 * enregistrement. Il encapsule le nom, la factory ou l'instance, le type de
 * cycle de vie et les metadonnees optionnelles.
 *
 * Il est passif — il ne s'enregistre pas lui-meme.
 * Il cree l'instance lors de l'appel a create() (jamais lors de la construction).
 * Il met en cache l'instance pour les singletons.
 *
 * Il ne connait pas ServiceRegistry.
 */

import { REGISTRATION_TYPES } from './RegistrationTypes.js'

// ─── ServiceDescriptor ────────────────────────────────────────────────────────

export class ServiceDescriptor {
  /**
   * @param {object}   options
   * @param {string}   options.name       - Identifiant unique du service.
   * @param {string}   options.lifetime   - Type de cycle de vie (REGISTRATION_TYPES).
   * @param {Function} [options.factory]  - Fonction de creation (SINGLETON / TRANSIENT).
   * @param {*}        [options.instance] - Instance deja construite (INSTANCE).
   * @param {object}   [options.metadata] - Metadonnees optionnelles.
   */
  constructor({ name, lifetime, factory = null, instance = null, metadata = {} }) {
    /** @type {string} */
    this._name     = name
    /** @type {string} */
    this._lifetime = lifetime
    /** @type {Function|null} */
    this._factory  = factory
    /** @type {*} */
    this._instance = instance
    /** @type {object} */
    this._metadata = Object.freeze({ ...metadata })
    /** @type {boolean} */
    this._resolved = lifetime === REGISTRATION_TYPES.INSTANCE
  }

  // ─── Accesseurs ──────────────────────────────────────────────────────────────

  /** @returns {string} */
  get name()     { return this._name }

  /** @returns {string} */
  get lifetime() { return this._lifetime }

  /** @returns {object} */
  get metadata() { return this._metadata }

  // ─── API publique ────────────────────────────────────────────────────────────

  /**
   * Cree ou retourne l'instance du service selon son type de cycle de vie.
   *
   * INSTANCE  : retourne l'instance fournie lors de l'enregistrement.
   * SINGLETON : cree l'instance au premier appel, la met en cache pour les suivants.
   * TRANSIENT : cree une nouvelle instance a chaque appel.
   *
   * @returns {*}
   */
  create() {
    if (this._lifetime === REGISTRATION_TYPES.INSTANCE) {
      return this._instance
    }

    if (this._lifetime === REGISTRATION_TYPES.SINGLETON) {
      if (!this._resolved) {
        this._instance = this._factory()
        this._resolved = true
      }
      return this._instance
    }

    // TRANSIENT — jamais mis en cache
    return this._factory()
  }

  /**
   * Libere l'instance si elle existe et possede une methode dispose().
   * Sans effet si l'instance n'est pas encore creee ou n'est pas disposable.
   *
   * @returns {void}
   */
  dispose() {
    if (this._instance && typeof this._instance.dispose === 'function') {
      this._instance.dispose()
    }
    this._instance = null
    this._resolved = this._lifetime === REGISTRATION_TYPES.INSTANCE ? false : false
  }
}
