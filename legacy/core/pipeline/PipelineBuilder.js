/**
 * core/pipeline/PipelineBuilder.js
 *
 * Single responsibility: construct an immutable Pipeline from an ordered set of stages.
 *
 * Question: "How is a Pipeline assembled before execution?"
 *
 * The Builder may mutate internally during construction.
 * The Pipeline it produces is immutable and contains a frozen stage list.
 * The Builder and the Pipeline are entirely independent after build().
 *
 * No dependency on Runtime, ModuleManager or EventBus.
 */

import { validateStage }        from './PipelineValidator.js'
import { DuplicateStageError }  from './PipelineError.js'
import { Pipeline }             from './Pipeline.js'

// ─── PipelineBuilder ──────────────────────────────────────────────────────────

export class PipelineBuilder {
  constructor() {
    /** @type {Map<string, import('./PipelineStage.js').PipelineStage>} */
    this._stages = new Map()
  }

  /**
   * Adds a stage to the builder.
   * Preserves insertion order.
   *
   * @param {import('./PipelineStage.js').PipelineStage} stage
   * @returns {PipelineBuilder} this — for chaining.
   * @throws {InvalidStageError}
   * @throws {DuplicateStageError}
   */
  add(stage) {
    validateStage(stage)
    if (this._stages.has(stage.name)) {
      throw new DuplicateStageError(stage.name)
    }
    this._stages.set(stage.name, stage)
    return this
  }

  /**
   * Removes a stage by name. Silent if absent.
   *
   * @param {string} name
   * @returns {PipelineBuilder} this — for chaining.
   */
  remove(name) {
    this._stages.delete(name)
    return this
  }

  /**
   * Removes all stages from the builder.
   *
   * @returns {PipelineBuilder} this — for chaining.
   */
  clear() {
    this._stages.clear()
    return this
  }

  /**
   * Builds and returns a new immutable Pipeline.
   * The builder's internal state is not modified.
   *
   * @returns {Pipeline}
   */
  build() {
    return new Pipeline([...this._stages.values()])
  }
}
