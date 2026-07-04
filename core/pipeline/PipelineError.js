/**
 * core/pipeline/PipelineError.js
 *
 * Single responsibility: declare typed errors for the Pipeline system.
 *
 * No logic. Declarations only.
 */

export class PipelineError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'PipelineError'
  }
}

export class InvalidStageError extends PipelineError {
  /** @param {unknown} value */
  constructor(value) {
    super(`Invalid pipeline stage: ${String(value)}`)
    this.name  = 'InvalidStageError'
    this.value = value
  }
}

export class DuplicateStageError extends PipelineError {
  /** @param {string} name */
  constructor(name) {
    super(`Stage already registered: "${name}"`)
    this.name      = 'DuplicateStageError'
    this.stageName = name
  }
}

export class StageExecutionError extends PipelineError {
  /**
   * @param {string} stageName
   * @param {Error}  cause
   */
  constructor(stageName, cause) {
    super(`Stage "${stageName}" failed: ${cause.message}`)
    this.name      = 'StageExecutionError'
    this.stageName = stageName
    this.cause     = cause
  }
}

export class PipelineValidationError extends PipelineError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Pipeline validation failed: ${reason}`)
    this.name   = 'PipelineValidationError'
    this.reason = reason
    this.value  = value
  }
}
