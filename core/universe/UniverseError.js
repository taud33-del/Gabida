/**
 * core/universe/UniverseError.js
 *
 * Single responsibility: declare typed errors for the Universe system.
 *
 * No logic. Declarations only.
 */

export class UniverseError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'UniverseError'
  }
}

export class InvalidUniverseError extends UniverseError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Invalid universe: ${reason}`)
    this.name   = 'InvalidUniverseError'
    this.reason = reason
    this.value  = value
  }
}

export class DuplicateLocationError extends UniverseError {
  /** @param {string} id */
  constructor(id) {
    super(`Location already exists: "${id}"`)
    this.name = 'DuplicateLocationError'
    this.id   = id
  }
}

export class LocationNotFoundError extends UniverseError {
  /** @param {string} id */
  constructor(id) {
    super(`Location not found: "${id}"`)
    this.name = 'LocationNotFoundError'
    this.id   = id
  }
}

export class DuplicateRuleError extends UniverseError {
  /** @param {string} id */
  constructor(id) {
    super(`Rule already exists: "${id}"`)
    this.name = 'DuplicateRuleError'
    this.id   = id
  }
}

export class RuleNotFoundError extends UniverseError {
  /** @param {string} id */
  constructor(id) {
    super(`Rule not found: "${id}"`)
    this.name = 'RuleNotFoundError'
    this.id   = id
  }
}
