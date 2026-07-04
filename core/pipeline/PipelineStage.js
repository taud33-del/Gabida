/**
 * core/pipeline/PipelineStage.js
 *
 * Single responsibility: define the abstract contract for every pipeline stage.
 *
 * Question: "What does every pipeline stage promise to the pipeline?"
 *
 * PipelineStage is the abstract base class every stage must extend.
 * Direct instantiation is forbidden.
 * Every concrete stage must implement execute(context).
 * execute() must return a new Context — never mutate the received one.
 *
 * No dependency on Runtime, ModuleManager or EventBus.
 */

import { InvalidStageError } from './PipelineError.js'

// ─── PipelineStage ────────────────────────────────────────────────────────────

export class PipelineStage {
  /**
   * @param {string} name - Unique identifier for this stage.
   */
  constructor(name) {
    if (new.target === PipelineStage) {
      throw new InvalidStageError('PipelineStage cannot be instantiated directly.')
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new InvalidStageError(`Stage name must be a non-empty string, got: ${typeof name}`)
    }
    /** @type {string} */
    this._name = name
  }

  // ─── Accessors ────────────────────────────────────────────────────────────────

  /** @returns {string} */
  get name() { return this._name }

  // ─── Abstract API ─────────────────────────────────────────────────────────────

  /**
   * Executes this stage against the given Context.
   * Must return a new Context. Must never mutate the received Context.
   *
   * @param {import('../context/Context.js').Context} context
   * @returns {Promise<import('../context/Context.js').Context>}
   * @throws {InvalidStageError} — when called on the abstract class.
   */
  async execute(_context) {
    throw new InvalidStageError(`execute() is not implemented in stage "${this._name}".`)
  }
}
