/**
 * core/adventure/AdventureState.js
 *
 * Single responsibility: represent the runtime state of an Adventure.
 *
 * Immutable value object. Frozen at construction.
 */

import { validateStatus }            from './AdventureValidator.js'
import { ADVENTURE_STATUS }          from './AdventureKeys.js'

// ─── AdventureState ───────────────────────────────────────────────────────────

export class AdventureState {
  /**
   * @param {object} [options]
   * @param {string} [options.status]
   * @param {string} [options.currentStep]
   * @param {object} [options.flags]
   * @param {object} [options.variables]
   * @param {object} [options.metadata]
   */
  constructor({
    status      = ADVENTURE_STATUS.IDLE,
    currentStep = '',
    flags       = {},
    variables   = {},
    metadata    = {},
  } = {}) {
    validateStatus(status)

    this.status      = status
    this.currentStep = currentStep
    this.flags       = Object.freeze({ ...flags })
    this.variables   = Object.freeze({ ...variables })
    this.metadata    = Object.freeze({ ...metadata })

    Object.freeze(this)
  }
}
