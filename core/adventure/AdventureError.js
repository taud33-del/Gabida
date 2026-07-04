/**
 * core/adventure/AdventureError.js
 *
 * Single responsibility: declare typed errors for the Adventure system.
 *
 * No logic. Declarations only.
 */

export class AdventureError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'AdventureError'
  }
}

export class InvalidAdventureError extends AdventureError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Invalid adventure: ${reason}`)
    this.name   = 'InvalidAdventureError'
    this.reason = reason
    this.value  = value
  }
}

export class DuplicateObjectiveError extends AdventureError {
  /** @param {string} id */
  constructor(id) {
    super(`Objective already exists: "${id}"`)
    this.name = 'DuplicateObjectiveError'
    this.id   = id
  }
}

export class ObjectiveNotFoundError extends AdventureError {
  /** @param {string} id */
  constructor(id) {
    super(`Objective not found: "${id}"`)
    this.name = 'ObjectiveNotFoundError'
    this.id   = id
  }
}

export class InvalidStatusError extends AdventureError {
  /**
   * @param {unknown} status
   */
  constructor(status) {
    super(`Invalid adventure status: "${String(status)}"`)
    this.name   = 'InvalidStatusError'
    this.status = status
  }
}
