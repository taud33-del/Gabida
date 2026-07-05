/**
 * core/modules/ModuleManager.js
 *
 * Responsabilite unique : orchestrer le cycle de vie de tous les modules enregistres.
 *
 * Question : "Comment initialiser, demarrer, arreter et liberer l'ensemble des modules ?"
 *
 * Le ModuleManager est le seul orchestrateur du systeme de modules.
 * Il utilise le ModuleRegistry comme source de verite des modules disponibles.
 * Il ne connait aucune implementation concrete de module.
 * Il depend uniquement de l'abstraction Module.
 *
 * Le Runtime deleguera la gestion des modules au ModuleManager.
 * Le ModuleManager ne connait pas le Runtime.
 *
 * Les operations collectives (initializeAll, startAll, stopAll, disposeAll)
 * propagent les erreurs sans masquer leur origine.
 *
 * Observabilite (Sprint 17) : si un EventBus est injecte, le ModuleManager
 * publie les MODULE_EVENTS individuels du cycle de vie (INITIALIZED, STARTED,
 * STOPPED, DISPOSED) apres chaque operation reussie, et ERROR (portant
 * l'ErreurModuleManager) en cas d'echec, avant de propager. Sans bus, il reste
 * totalement silencieux. Le ModuleManager n'emet aucun evenement collectif.
 */

import { ModuleRegistry } from './ModuleRegistry.js'
import { MODULE_EVENTS } from './ModuleEvents.js'

// ─── Erreurs ──────────────────────────────────────────────────────────────────

export class ErreurModuleManager extends Error {
  /**
   * @param {string} operation
   * @param {string} moduleName
   * @param {Error}  cause
   */
  constructor(operation, moduleName, cause) {
    super(`ModuleManager.${operation}("${moduleName}") a echoue : ${cause.message}`)
    this.name       = 'ErreurModuleManager'
    this.operation  = operation
    this.moduleName = moduleName
    this.cause      = cause
  }
}

// ─── ModuleManager ────────────────────────────────────────────────────────────

export class ModuleManager {
  /**
   * @param {ModuleRegistry} registry
   * @param {object}   [options]
   * @param {import('../events/EventBus.js').EventBus} [options.eventBus]
   *   Bus optionnel sur lequel publier les MODULE_EVENTS. Absent : aucune emission.
   */
  constructor(registry, { eventBus } = {}) {
    /** @type {ModuleRegistry} */
    this._registry = registry
    /** @type {import('../events/EventBus.js').EventBus | null} */
    this._eventBus = eventBus ?? null
  }

  /**
   * Publie un evenement sur le bus injecte, ou ne fait rien si aucun bus.
   *
   * @private
   * @param {string} event
   * @param {*}      payload
   * @returns {void}
   */
  _emit(event, payload) {
    if (this._eventBus) this._eventBus.emit(event, payload)
  }

  // ─── Operations individuelles ─────────────────────────────────────────────────

  /**
   * Initialise un module specifique.
   *
   * @param {import('./Module.js').Module} module
   * @returns {Promise<void>}
   * @throws {ErreurModuleManager}
   */
  async initialize(module) {
    try {
      await module.initialize()
    } catch (err) {
      const erreur = new ErreurModuleManager('initialize', module.name, err)
      this._emit(MODULE_EVENTS.ERROR, erreur)
      throw erreur
    }
    this._emit(MODULE_EVENTS.INITIALIZED, module.name)
  }

  /**
   * Demarre un module specifique.
   *
   * @param {import('./Module.js').Module} module
   * @returns {Promise<void>}
   * @throws {ErreurModuleManager}
   */
  async start(module) {
    try {
      await module.start()
    } catch (err) {
      const erreur = new ErreurModuleManager('start', module.name, err)
      this._emit(MODULE_EVENTS.ERROR, erreur)
      throw erreur
    }
    this._emit(MODULE_EVENTS.STARTED, module.name)
  }

  /**
   * Arrete un module specifique.
   *
   * @param {import('./Module.js').Module} module
   * @returns {Promise<void>}
   * @throws {ErreurModuleManager}
   */
  async stop(module) {
    try {
      await module.stop()
    } catch (err) {
      const erreur = new ErreurModuleManager('stop', module.name, err)
      this._emit(MODULE_EVENTS.ERROR, erreur)
      throw erreur
    }
    this._emit(MODULE_EVENTS.STOPPED, module.name)
  }

  /**
   * Libere les ressources d'un module specifique.
   *
   * @param {import('./Module.js').Module} module
   * @returns {Promise<void>}
   * @throws {ErreurModuleManager}
   */
  async dispose(module) {
    try {
      await module.dispose()
    } catch (err) {
      const erreur = new ErreurModuleManager('dispose', module.name, err)
      this._emit(MODULE_EVENTS.ERROR, erreur)
      throw erreur
    }
    this._emit(MODULE_EVENTS.DISPOSED, module.name)
  }

  // ─── Operations collectives ───────────────────────────────────────────────────

  /**
   * Initialise tous les modules du registre dans leur ordre d'insertion.
   * S'arrete et propage la premiere erreur rencontree.
   *
   * @returns {Promise<void>}
   * @throws {ErreurModuleManager}
   */
  async initializeAll() {
    for (const module of this._registry.getAll()) {
      await this.initialize(module)
    }
  }

  /**
   * Demarre tous les modules du registre dans leur ordre d'insertion.
   * S'arrete et propage la premiere erreur rencontree.
   *
   * @returns {Promise<void>}
   * @throws {ErreurModuleManager}
   */
  async startAll() {
    for (const module of this._registry.getAll()) {
      await this.start(module)
    }
  }

  /**
   * Arrete tous les modules du registre en ordre inverse d'insertion.
   * S'arrete et propage la premiere erreur rencontree.
   *
   * @returns {Promise<void>}
   * @throws {ErreurModuleManager}
   */
  async stopAll() {
    const modules = this._registry.getAll().reverse()
    for (const module of modules) {
      await this.stop(module)
    }
  }

  /**
   * Libere tous les modules du registre en ordre inverse d'insertion.
   * S'arrete et propage la premiere erreur rencontree.
   *
   * @returns {Promise<void>}
   * @throws {ErreurModuleManager}
   */
  async disposeAll() {
    const modules = this._registry.getAll().reverse()
    for (const module of modules) {
      await this.dispose(module)
    }
  }
}
