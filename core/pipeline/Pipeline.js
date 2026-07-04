/**
 * core/pipeline/Pipeline.js
 *
 * Single responsibility: execute an ordered sequence of immutable stages over a Context.
 *
 * Question: "How does a Context flow through ordered processing stages?"
 *
 * Pipeline is immutable. Its stage list is frozen at construction.
 * Each stage receives the Context returned by the previous stage.
 * Execution stops and propagates on the first stage failure.
 * The Pipeline never mutates any Context.
 *
 * Do not instantiate directly — use PipelineBuilder.
 *
 * No dependency on Runtime, ModuleManager or EventBus.
 */

import { validatePipeline, validateContext } from './PipelineValidator.js'
import { StageExecutionError }               from './PipelineError.js'

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export class Pipeline {
  /**
   * @param {import('./PipelineStage.js').PipelineStage[]} stages
   */
  constructor(stages) {
    validatePipeline(stages)
    /** @type {import('./PipelineStage.js').PipelineStage[]} */
    this._stages = Object.freeze([...stages])
    Object.freeze(this)
  }

  // ─── Execution ────────────────────────────────────────────────────────────────

  /**
   * Executes all stages in insertion order.
   * Each stage receives the Context returned by the previous stage.
   * Returns the final Context after all stages have run.
   * Stops and throws on the first stage failure.
   *
   * @param {import('../context/Context.js').Context} context
   * @returns {Promise<import('../context/Context.js').Context>}
   * @throws {StageExecutionError}
   * @throws {PipelineValidationError}
   */
  async execute(context) {
    validateContext(context)
    let current = context
    for (const stage of this._stages) {
      try {
        current = await stage.execute(current)
      } catch (err) {
        throw new StageExecutionError(stage.name, err)
      }
    }
    return current
  }

  // ─── Inspection API ──────────────────────────────────────────────────────────

  /** @returns {number} */
  size() { return this._stages.length }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  has(name) { return this._stages.some(s => s.name === name) }

  /**
   * @param {string} name
   * @returns {import('./PipelineStage.js').PipelineStage | undefined}
   */
  get(name) { return this._stages.find(s => s.name === name) }

  /**
   * Returns a frozen copy of the stage array.
   *
   * @returns {import('./PipelineStage.js').PipelineStage[]}
   */
  getAll() { return Object.freeze([...this._stages]) }

  /**
   * Alias for getAll() — returns stages as a plain frozen array.
   *
   * @returns {import('./PipelineStage.js').PipelineStage[]}
   */
  toArray() { return this.getAll() }
}
