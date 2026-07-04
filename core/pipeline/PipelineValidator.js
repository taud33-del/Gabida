/**
 * core/pipeline/PipelineValidator.js
 *
 * Single responsibility: validate inputs to the Pipeline system.
 *
 * Pure functions only. No classes. No side effects.
 * Throwing functions raise typed errors.
 * Boolean functions never throw.
 */

import { Context }               from '../context/Context.js'
import { InvalidStageError, PipelineValidationError } from './PipelineError.js'

// ─── Boolean helpers ─────────────────────────────────────────────────────────

/**
 * Returns true if value is a PipelineStage-like object:
 * has a string name property and an execute function.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPipelineStage(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.execute === 'function'
  )
}

// ─── Throwing validators ──────────────────────────────────────────────────────

/**
 * Validates that a value is a valid PipelineStage.
 *
 * @param {unknown} stage
 * @returns {void}
 * @throws {InvalidStageError}
 */
export function validateStage(stage) {
  if (!isPipelineStage(stage)) {
    throw new InvalidStageError(stage)
  }
}

/**
 * Validates that an array of stages is non-empty and all stages are valid.
 *
 * @param {unknown[]} stages
 * @returns {void}
 * @throws {PipelineValidationError}
 * @throws {InvalidStageError}
 */
export function validatePipeline(stages) {
  if (!Array.isArray(stages)) {
    throw new PipelineValidationError('stages must be an array', stages)
  }
  for (const stage of stages) {
    validateStage(stage)
  }
}

/**
 * Validates that a value is a Context instance.
 *
 * @param {unknown} context
 * @returns {void}
 * @throws {PipelineValidationError}
 */
export function validateContext(context) {
  if (!(context instanceof Context)) {
    throw new PipelineValidationError(
      'context must be a Context instance',
      context,
    )
  }
}
