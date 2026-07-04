/**
 * core/runtime/RuntimeError.js
 *
 * Single responsibility: declare typed errors for the execution Runtime.
 *
 * No logic. Declarations only.
 */

export class RuntimeError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'RuntimeError'
  }
}

export class InvalidPipelineError extends RuntimeError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Invalid pipeline: ${reason}`)
    this.name   = 'InvalidPipelineError'
    this.reason = reason
    this.value  = value
  }
}

export class InvalidContextError extends RuntimeError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Invalid context: ${reason}`)
    this.name   = 'InvalidContextError'
    this.reason = reason
    this.value  = value
  }
}

export class RuntimeExecutionError extends RuntimeError {
  /**
   * @param {Error}  cause
   * @param {object} contextSnapshot
   * @param {object} pipelineSnapshot
   */
  constructor(cause, contextSnapshot, pipelineSnapshot) {
    super(`Runtime execution failed: ${cause.message}`)
    this.name             = 'RuntimeExecutionError'
    this.cause            = cause
    this.contextSnapshot  = Object.freeze(contextSnapshot)
    this.pipelineSnapshot = Object.freeze(pipelineSnapshot)
  }
}
