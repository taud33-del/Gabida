/**
 * core/modules/Module.js
 *
 * Responsabilite unique : definir le contrat abstrait de tout module Gabida.
 *
 * Question : "Qu'est-ce qu'un module Gabida ?"
 *
 * Module est la classe de base abstraite dont tout module futur herite.
 * Elle definit le cycle de vie officiel et impose son respect via des transitions validees.
 * Elle ne contient aucune logique metier.
 * Elle ne connait aucun module concret.
 *
 * Toute sous-classe doit implementer :
 *   _initialize() — logique d'initialisation specifique au module
 *   _start()      — logique de demarrage specifique au module
 *   _stop()       — logique d'arret specifique au module
 *   _dispose()    — logique de liberation des ressources
 *
 * L'API publique (initialize, start, stop, dispose, getState) est fournie
 * par cette classe et ne doit pas etre surchargee.
 */

import { MODULE_STATES } from './ModuleState.js'
import { isTransitionAllowed } from './ModuleLifecycle.js'

// ─── Erreurs ──────────────────────────────────────────────────────────────────

export class ErreurTransitionModule extends Error {
  /**
   * @param {string} moduleName
   * @param {string} from
   * @param {string} to
   */
  constructor(moduleName, from, to) {
    super(`[${moduleName}] Transition interdite : ${from} → ${to}`)
    this.name       = 'ErreurTransitionModule'
    this.moduleName = moduleName
    this.from       = from
    this.to         = to
  }
}

export class ErreurModuleAbstrait extends Error {
  /**
   * @param {string} methodName
   */
  constructor(methodName) {
    super(`Methode abstraite non implementee : ${methodName}()`)
    this.name = 'ErreurModuleAbstrait'
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────

export class Module {
  /**
   * @param {string} name - Identifiant unique du module.
   */
  constructor(name) {
    if (new.target === Module) {
      throw new ErreurModuleAbstrait('Module')
    }
    /** @type {string} */
    this._name = name
    /** @type {string} */
    this._state = MODULE_STATES.CREATED
  }

  // ─── Accesseurs ──────────────────────────────────────────────────────────────

  /** @returns {string} */
  get name() { return this._name }

  // ─── API publique ────────────────────────────────────────────────────────────

  /**
   * Initialise le module.
   * Transition : CREATED → INITIALIZED
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionModule}
   */
  async initialize() {
    this._transition(MODULE_STATES.INITIALIZED)
    await this._initialize()
  }

  /**
   * Demarre le module.
   * Transition : INITIALIZED → STARTING → RUNNING
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionModule}
   */
  async start() {
    this._transition(MODULE_STATES.STARTING)
    await this._start()
    this._transition(MODULE_STATES.RUNNING)
  }

  /**
   * Arrete le module.
   * Transition : RUNNING → STOPPING → STOPPED
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionModule}
   */
  async stop() {
    this._transition(MODULE_STATES.STOPPING)
    await this._stop()
    this._transition(MODULE_STATES.STOPPED)
  }

  /**
   * Libere les ressources du module.
   * Transition : STOPPED → DISPOSED  ou  ERROR → DISPOSED
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionModule}
   */
  async dispose() {
    this._transition(MODULE_STATES.DISPOSED)
    await this._dispose()
  }

  /**
   * Retourne l'etat actuel du module.
   *
   * @returns {string}
   */
  getState() {
    return this._state
  }

  // ─── Methodes abstraites (a implementer par les sous-classes) ─────────────────

  /** @returns {Promise<void>} */
  async _initialize() { throw new ErreurModuleAbstrait('_initialize') }

  /** @returns {Promise<void>} */
  async _start()      { throw new ErreurModuleAbstrait('_start') }

  /** @returns {Promise<void>} */
  async _stop()       { throw new ErreurModuleAbstrait('_stop') }

  /** @returns {Promise<void>} */
  async _dispose()    { throw new ErreurModuleAbstrait('_dispose') }

  // ─── Interne ──────────────────────────────────────────────────────────────────

  /**
   * Applique une transition validee.
   *
   * @param {string} to
   * @returns {void}
   * @throws {ErreurTransitionModule}
   */
  _transition(to) {
    if (!isTransitionAllowed(this._state, to)) {
      throw new ErreurTransitionModule(this._name, this._state, to)
    }
    this._state = to
  }
}
