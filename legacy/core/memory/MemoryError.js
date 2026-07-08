/**
 * core/memory/MemoryError.js
 *
 * Single responsibility: declare typed errors for the Memory system.
 *
 * No logic. Declarations only.
 */

export class MemoryError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'MemoryError'
  }
}

export class InvalidMemoryError extends MemoryError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Invalid memory: ${reason}`)
    this.name   = 'InvalidMemoryError'
    this.reason = reason
    this.value  = value
  }
}

export class DuplicateMemoryError extends MemoryError {
  /** @param {string} id */
  constructor(id) {
    super(`Memory entry already exists: "${id}"`)
    this.name = 'DuplicateMemoryError'
    this.id   = id
  }
}

export class MemoryNotFoundError extends MemoryError {
  /** @param {string} id */
  constructor(id) {
    super(`Memory entry not found: "${id}"`)
    this.name = 'MemoryNotFoundError'
    this.id   = id
  }
}

export class InvalidMemoryKeyError extends MemoryError {
  /** @param {unknown} key */
  constructor(key) {
    super(`Invalid memory key: ${String(key)}`)
    this.name = 'InvalidMemoryKeyError'
    this.key  = key
  }
}
