/**
 * core/runtime/Runtime.js
 *
 * Responsabilite unique : orchestrer le cycle de vie du moteur Gabida.
 *
 * Question : "Comment le moteur demarre-t-il, s'arrete-t-il et coordonne-t-il ses modules ?"
 *
 * Le Runtime est le point d'entree interne du moteur.
 * Il possede l'etat du runtime (RuntimeState).
 * Il gere le cycle de vie via des transitions validees.
 * Il coordonnera les modules lors de leur integration.
 * Il expose une API publique minimale.
 *
 * Le Runtime ne doit JAMAIS :
 *   - generer du texte
 *   - prendre des decisions narratives
 *   - appeler un provider IA directement
 *   - contenir de la logique metier narrative
 *   - connaitre les details d'implementation des modules
 *
 * @module core/runtime
 */

import { RUNTIME_STATES } from '../../constants/RuntimeStates.js'
import { RuntimeState, ErreurTransitionRuntime } from './RuntimeState.js'

export { ErreurTransitionRuntime }

// ─── Runtime ──────────────────────────────────────────────────────────────────

export class Runtime {
  constructor() {
    /** @type {RuntimeState} */
    this._state = new RuntimeState()
  }

  // ─── API publique ────────────────────────────────────────────────────────────

  /**
   * Demarre le runtime.
   * Transition : STOPPED → STARTING → RUNNING
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionRuntime}
   */
  async start() {
    this._state.transition(RUNTIME_STATES.STARTING)
    // TODO: initialiser les modules
    this._state.transition(RUNTIME_STATES.RUNNING)
  }

  /**
   * Arrete le runtime.
   * Transition : RUNNING → STOPPING → STOPPED
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionRuntime}
   */
  async stop() {
    this._state.transition(RUNTIME_STATES.STOPPING)
    // TODO: liberer les ressources des modules
    this._state.transition(RUNTIME_STATES.STOPPED)
  }

  /**
   * Met le runtime en pause.
   * Transition : RUNNING → PAUSED
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionRuntime}
   */
  async pause() {
    this._state.transition(RUNTIME_STATES.PAUSED)
    // TODO: suspendre les operations en cours
  }

  /**
   * Reprend le runtime depuis l'etat pause.
   * Transition : PAUSED → RUNNING
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionRuntime}
   */
  async resume() {
    this._state.transition(RUNTIME_STATES.RUNNING)
    // TODO: reprendre les operations suspendues
  }

  /**
   * Retourne l'etat actuel du runtime.
   * Retourne une chaine immuable — jamais l'objet d'etat interne.
   *
   * @returns {string}
   */
  getState() {
    return this._state.current
  }
}
