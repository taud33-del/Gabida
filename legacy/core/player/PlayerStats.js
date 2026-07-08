/**
 * core/player/PlayerStats.js
 *
 * Single responsibility: represent the immutable statistics of a Player.
 *
 * Immutable value object. Frozen at construction.
 */

import { validateStats } from './PlayerValidator.js'

// ─── PlayerStats ──────────────────────────────────────────────────────────────

export class PlayerStats {
  /**
   * @param {object} [options]
   * @param {number} [options.level]
   * @param {number} [options.experience]
   * @param {object} [options.attributes]
   * @param {object} [options.metadata]
   */
  constructor({ level = 1, experience = 0, attributes = {}, metadata = {} } = {}) {
    validateStats({ level, experience })

    this.level      = level
    this.experience = experience
    this.attributes = Object.freeze({ ...attributes })
    this.metadata   = Object.freeze({ ...metadata })

    Object.freeze(this)
  }
}
