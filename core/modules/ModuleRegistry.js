/**
 * core/modules/ModuleRegistry.js
 *
 * Responsabilite unique : maintenir le registre des modules enregistres.
 *
 * Question : "Quels modules sont disponibles dans ce runtime ?"
 *
 * Le registre ne demarre jamais un module.
 * Le registre n'arrete jamais un module.
 * Le registre ne modifie jamais l'etat d'un module.
 * Il est le seul endroit ou les modules sont indexes par nom.
 *
 * Le ModuleManager est le seul consommateur autorise du registre.
 */

import { Module } from './Module.js'

// ─── Erreurs ──────────────────────────────────────────────────────────────────

export class ErreurRegistreModule extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'ErreurRegistreModule'
  }
}

export class ErreurModuleDejaPresentDansRegistre extends ErreurRegistreModule {
  /** @param {string} name */
  constructor(name) {
    super(`Module deja enregistre : "${name}"`)
    this.name       = 'ErreurModuleDejaPresentDansRegistre'
    this.moduleName = name
  }
}

export class ErreurModuleInconnu extends ErreurRegistreModule {
  /** @param {string} name */
  constructor(name) {
    super(`Module inconnu : "${name}"`)
    this.name       = 'ErreurModuleInconnu'
    this.moduleName = name
  }
}

// ─── ModuleRegistry ───────────────────────────────────────────────────────────

export class ModuleRegistry {
  constructor() {
    /** @type {Map<string, Module>} */
    this._modules = new Map()
  }

  /**
   * Enregistre un module.
   * Lance ErreurModuleDejaPresentDansRegistre si le nom est deja utilise.
   *
   * @param {Module} module
   * @returns {void}
   * @throws {ErreurModuleDejaPresentDansRegistre}
   */
  register(module) {
    if (this._modules.has(module.name)) {
      throw new ErreurModuleDejaPresentDansRegistre(module.name)
    }
    this._modules.set(module.name, module)
  }

  /**
   * Supprime un module du registre.
   * Lance ErreurModuleInconnu si le nom n'existe pas.
   *
   * @param {string} name
   * @returns {void}
   * @throws {ErreurModuleInconnu}
   */
  unregister(name) {
    if (!this._modules.has(name)) {
      throw new ErreurModuleInconnu(name)
    }
    this._modules.delete(name)
  }

  /**
   * Retourne un module par son nom.
   * Lance ErreurModuleInconnu si le nom n'existe pas.
   *
   * @param {string} name
   * @returns {Module}
   * @throws {ErreurModuleInconnu}
   */
  get(name) {
    const module = this._modules.get(name)
    if (!module) throw new ErreurModuleInconnu(name)
    return module
  }

  /**
   * Indique si un module est enregistre sous ce nom.
   *
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._modules.has(name)
  }

  /**
   * Retourne tous les modules enregistres dans leur ordre d'insertion.
   *
   * @returns {Module[]}
   */
  getAll() {
    return [...this._modules.values()]
  }

  /**
   * Supprime tous les modules du registre.
   *
   * @returns {void}
   */
  clear() {
    this._modules.clear()
  }
}
