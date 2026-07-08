/**
 * core/universe/UniverseLocation.js
 *
 * Single responsibility: represent one immutable location within a Universe.
 *
 * Immutable value object. Frozen at construction.
 */

import { validateLocation } from './UniverseValidator.js'

// ─── UniverseLocation ────────────────────────────────────────────────────────

export class UniverseLocation {
  /**
   * @param {object} fields
   * @param {string} fields.id
   * @param {string} fields.name
   * @param {string} [fields.description]
   * @param {object} [fields.metadata]
   */
  constructor({ id, name, description = '', metadata = {} }) {
    validateLocation({ id, name })

    this.id          = id
    this.name        = name
    this.description = description
    this.metadata    = Object.freeze({ ...metadata })

    Object.freeze(this)
  }
}
