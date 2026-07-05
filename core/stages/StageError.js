/**
 * core/stages/StageError.js
 *
 * Single responsibility: declare the typed errors of the narrative adapter stages.
 *
 * No logic beyond error construction. No side effects.
 */

// ─── Base ─────────────────────────────────────────────────────────────────────

export class StageError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'StageError'
  }
}

// ─── Erreurs specifiques ──────────────────────────────────────────────────────

/**
 * Levee quand une entree attendue est absente du Context au moment d'executer un stage.
 */
export class MissingContextInputError extends StageError {
  /**
   * @param {string} stageName
   * @param {string} key -- Cle de Context manquante
   */
  constructor(stageName, key) {
    super(`Stage "${stageName}" : entree de Context manquante : "${key}".`)
    this.name      = 'MissingContextInputError'
    this.stageName = stageName
    this.key       = key
  }
}
