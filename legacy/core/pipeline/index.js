/**
 * core/pipeline/index.js
 *
 * Single entry point for the pipeline sub-module.
 * This file defines nothing — it only re-exports.
 */

export { Pipeline }                                  from './Pipeline.js'
export { PipelineBuilder }                           from './PipelineBuilder.js'
export { PipelineStage }                             from './PipelineStage.js'
export { PIPELINE_EVENTS }                           from './PipelineEvents.js'
export {
  validateStage,
  validatePipeline,
  validateContext,
  isPipelineStage,
}                                                    from './PipelineValidator.js'
export {
  PipelineError,
  InvalidStageError,
  DuplicateStageError,
  StageExecutionError,
  PipelineValidationError,
}                                                    from './PipelineError.js'
