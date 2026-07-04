/**
 * core/context/ContextError.js
 *
 * Single responsibility: declare typed errors for the Context system.
 *
 * No logic. Declarations only.
 */

export class ContextError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'ContextError'
  }
}

export class InvalidContextKeyError extends ContextError {
  /** @param {unknown} key */
  constructor(key) {
    super(`Invalid context key: ${String(key)}`)
    this.name = 'InvalidContextKeyError'
    this.key  = key
  }
}

export class ContextFrozenError extends ContextError {
  constructor() {
    super('Context is immutable — use set(), remove() or merge() to obtain a new Context.')
    this.name = 'ContextFrozenError'
  }
}

export class InvalidContextValueError extends ContextError {
  /**
   * @param {string}  key
   * @param {unknown} value
   */
  constructor(key, value) {
    super(`Invalid value for context key "${key}": ${typeof value}`)
    this.name  = 'InvalidContextValueError'
    this.key   = key
    this.value = value
  }
}

export class ContextValidationError extends ContextError {
  /**
   * @param {string} reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Context validation failed: ${reason}`)
    this.name   = 'ContextValidationError'
    this.reason = reason
    this.value  = value
  }
}
