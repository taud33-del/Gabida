/**
 * core/universe/UniverseRule.js
 *
 * Single responsibility: represent one immutable rule governing a Universe.
 *
 * Immutable value object. Frozen at construction.
 */

import { validateRule } from './UniverseValidator.js'

// ─── UniverseRule ────────────────────────────────────────────────────────────

export class UniverseRule {
  /**
   * @param {object}  fields
   * @param {string}  fields.id
   * @param {string}  fields.name
   * @param {string}  [fields.description]
   * @param {number}  [fields.priority]
   * @param {boolean} [fields.enabled]
   */
  constructor({ id, name, description = '', priority = 0, enabled = true }) {
    validateRule({ id, name, priority })

    this.id          = id
    this.name        = name
    this.description = description
    this.priority    = priority
    this.enabled     = enabled

    Object.freeze(this)
  }
}
