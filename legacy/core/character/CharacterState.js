/**
 * core/character/CharacterState.js
 *
 * Single responsibility: represent the runtime state of a Character.
 *
 * Immutable value object. Frozen at construction.
 * No logic beyond safe construction and read access.
 */

import { InvalidCharacterStateError } from './CharacterError.js'

// ─── CharacterState ───────────────────────────────────────────────────────────

export class CharacterState {
  /**
   * @param {object} [options]
   * @param {string} [options.status]
   * @param {object} [options.flags]
   * @param {object} [options.metadata]
   */
  constructor({ status = 'idle', flags = {}, metadata = {} } = {}) {
    if (typeof status !== 'string' || status.trim().length === 0) {
      throw new InvalidCharacterStateError('status must be a non-empty string', status)
    }
    this.status   = status
    this.flags    = Object.freeze({ ...flags })
    this.metadata = Object.freeze({ ...metadata })
    Object.freeze(this)
  }
}
