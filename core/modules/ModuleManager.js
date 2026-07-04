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
 */

import { ModuleRegistry } from './ModuleRegistry.js'

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
   */
  constructor(registry) {
    /** @type {ModuleRegistry} */
    this._registry = registry
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
      throw new ErreurModuleManager('initialize', module.name, err)
    }
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
      throw new ErreurModuleManager('start', module.name, err)
    }
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
      throw new ErreurModuleManager('stop', module.name, err)
    }
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
      throw new ErreurModuleManager('dispose', module.name, err)
    }
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
