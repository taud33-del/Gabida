/**
 * core/runtime/RuntimeState.js
 *
 * Responsabilite unique : representer et faire evoluer l'etat du runtime.
 *
 * Question : "Dans quel etat se trouve le runtime en ce moment ?"
 *
 * RuntimeState est un objet mutable interne au runtime.
 * Il n'est jamais expose directement a l'exterieur.
 * Le Runtime en est le seul proprietaire.
 *
 * La transition d'etat est validee avant d'etre appliquee.
 * Aucune transition illegale n'est silencieusement acceptee.
 */

import { RUNTIME_STATES } from '../../constants/RuntimeStates.js'
import { isTransitionAllowed } from './RuntimeLifecycle.js'

// ─── Erreurs ──────────────────────────────────────────────────────────────────

export class ErreurTransitionRuntime extends Error {
  /**
   * @param {string} from
   * @param {string} to
   */
  constructor(from, to) {
    super(`Transition interdite : ${from} → ${to}`)
    this.name = 'ErreurTransitionRuntime'
    this.from = from
    this.to   = to
  }
}

// ─── RuntimeState ─────────────────────────────────────────────────────────────

export class RuntimeState {
  constructor() {
    /** @type {string} */
    this._current = RUNTIME_STATES.STOPPED
  }

  /**
   * Etat actuel du runtime.
   *
   * @returns {string}
   */
  get current() {
    return this._current
  }

  /**
   * Applique une transition vers l'etat cible.
   * Lance ErreurTransitionRuntime si la transition est illegale.
   *
   * @param {string} to - Etat cible.
   * @returns {void}
   * @throws {ErreurTransitionRuntime}
   */
  transition(to) {
    if (!isTransitionAllowed(this._current, to)) {
      throw new ErreurTransitionRuntime(this._current, to)
    }
    this._current = to
  }
}
