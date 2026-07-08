/**
 * core/adventure/AdventureObjective.js
 *
 * Single responsibility: represent one immutable adventure objective.
 *
 * Immutable value object. Frozen at construction.
 */

import { validateObjective } from './AdventureValidator.js'

// ─── AdventureObjective ───────────────────────────────────────────────────────

export class AdventureObjective {
  /**
   * @param {object}  fields
   * @param {string}  fields.id
   * @param {string}  fields.title
   * @param {string}  [fields.description]
   * @param {boolean} [fields.completed]
   * @param {boolean} [fields.optional]
   * @param {object}  [fields.metadata]
   */
  constructor({ id, title, description = '', completed = false, optional = false, metadata = {} }) {
    validateObjective({ id, title })

    this.id          = id
    this.title       = title
    this.description = description
    this.completed   = completed
    this.optional    = optional
    this.metadata    = Object.freeze({ ...metadata })

    Object.freeze(this)
  }

  /**
   * Returns a new AdventureObjective with completed set to true.
   *
   * @returns {AdventureObjective}
   */
  complete() {
    return new AdventureObjective({
      id          : this.id,
      title       : this.title,
      description : this.description,
      completed   : true,
      optional    : this.optional,
      metadata    : { ...this.metadata },
    })
  }
}
