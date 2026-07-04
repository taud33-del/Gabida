/**
 * core/registry/ServiceRegistry.js
 *
 * Responsabilite unique : centraliser l'enregistrement et la resolution des services.
 *
 * Question : "Comment obtenir un service sans en connaitre l'implementation ?"
 *
 * Le ServiceRegistry est le conteneur central de Gabida.
 * Aucun composant n'instancie directement un autre composant.
 * Tout est obtenu via resolve().
 *
 * Le registre ne connait pas :
 *   - le Runtime
 *   - le ModuleManager
 *   - l'EventBus
 *   - aucun module metier
 *
 * Regles d'execution :
 *   - Les factories ne s'executent jamais pendant register().
 *   - Les factories s'executent uniquement pendant resolve().
 *   - Les singletons sont crees une seule fois et mis en cache.
 *   - Les transitoires ne sont jamais mis en cache.
 *   - Le registre ne mute jamais les services resolus.
 *   - Les dependances circulaires sont detectees et signalees avec une erreur typee.
 */

import { REGISTRATION_TYPES }  from './RegistrationTypes.js'
import { ServiceDescriptor }   from './ServiceDescriptor.js'
import {
  validateServiceName,
  validateFactory,
  validateRegistrationType,
}                              from './RegistryValidator.js'
import {
  DuplicateServiceError,
  ServiceNotFoundError,
  CircularDependencyError,
  InvalidRegistrationError,
}                              from './RegistryError.js'

// ─── ServiceRegistry ──────────────────────────────────────────────────────────

export class ServiceRegistry {
  constructor() {
    /** @type {Map<string, ServiceDescriptor>} */
    this._services  = new Map()
    /** @type {Set<string>} */
    this._resolving = new Set()
  }

  // ─── API publique ────────────────────────────────────────────────────────────

  /**
   * Enregistre un service.
   *
   * Surcharges :
   *   register(name, instance)                     → INSTANCE
   *   register(name, factory, REGISTRATION_TYPES.SINGLETON)
   *   register(name, factory, REGISTRATION_TYPES.TRANSIENT)
   *
   * @param {string}   name
   * @param {*}        factoryOrInstance
   * @param {string}   [lifetime]
   * @param {object}   [metadata]
   * @returns {void}
   * @throws {DuplicateServiceError}
   * @throws {InvalidRegistrationError}
   * @throws {InvalidFactoryError}
   */
  register(name, factoryOrInstance, lifetime, metadata = {}) {
    validateServiceName(name)

    if (this._services.has(name)) {
      throw new DuplicateServiceError(name)
    }

    // Determiner le type de cycle de vie
    const resolvedLifetime = lifetime ?? (
      typeof factoryOrInstance === 'function'
        ? REGISTRATION_TYPES.SINGLETON
        : REGISTRATION_TYPES.INSTANCE
    )

    validateRegistrationType(resolvedLifetime)

    if (resolvedLifetime === REGISTRATION_TYPES.INSTANCE) {
      if (typeof factoryOrInstance === 'function' && lifetime === undefined) {
        // factory sans lifetime explicite → SINGLETON par defaut (deja traite)
      }
      // Pour INSTANCE explicite ou objet direct sans lifetime
      this._services.set(name, new ServiceDescriptor({
        name,
        lifetime : resolvedLifetime,
        instance : factoryOrInstance,
        metadata,
      }))
      return
    }

    // SINGLETON ou TRANSIENT — necessite une factory
    validateFactory(factoryOrInstance)
    this._services.set(name, new ServiceDescriptor({
      name,
      lifetime : resolvedLifetime,
      factory  : factoryOrInstance,
      metadata,
    }))
  }

  /**
   * Supprime un service du registre et dispose son descripteur.
   * Lance ServiceNotFoundError si le nom n'existe pas.
   *
   * @param {string} name
   * @returns {void}
   * @throws {ServiceNotFoundError}
   */
  unregister(name) {
    const descriptor = this._services.get(name)
    if (!descriptor) throw new ServiceNotFoundError(name)
    descriptor.dispose()
    this._services.delete(name)
  }

  /**
   * Resout un service par son nom.
   * Detecte les dependances circulaires.
   *
   * @param {string} name
   * @returns {*}
   * @throws {ServiceNotFoundError}
   * @throws {CircularDependencyError}
   */
  resolve(name) {
    validateServiceName(name)

    if (!this._services.has(name)) {
      throw new ServiceNotFoundError(name)
    }

    if (this._resolving.has(name)) {
      throw new CircularDependencyError(name)
    }

    this._resolving.add(name)
    try {
      return this._services.get(name).create()
    } finally {
      this._resolving.delete(name)
    }
  }

  /**
   * Indique si un service est enregistre sous ce nom.
   *
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._services.has(name)
  }

  /**
   * Retourne tous les descripteurs enregistres dans leur ordre d'insertion.
   *
   * @returns {ServiceDescriptor[]}
   */
  getAll() {
    return [...this._services.values()]
  }

  /**
   * Retourne le nombre de services enregistres.
   *
   * @returns {number}
   */
  size() {
    return this._services.size
  }

  /**
   * Supprime tous les services du registre et dispose chaque descripteur.
   *
   * @returns {void}
   */
  clear() {
    for (const descriptor of this._services.values()) {
      descriptor.dispose()
    }
    this._services.clear()
  }
}
