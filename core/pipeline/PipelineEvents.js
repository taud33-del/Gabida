/**
 * core/pipeline/PipelineEvents.js
 *
 * Single responsibility: declare official Pipeline event identifiers.
 *
 * No event bus is created here.
 * No logic. No dependencies. Constants only.
 */

export const PIPELINE_EVENTS = Object.freeze({
  PIPELINE_STARTED  : 'pipeline.started',
  PIPELINE_FINISHED : 'pipeline.finished',
  STAGE_STARTED     : 'pipeline.stage.started',
  STAGE_FINISHED    : 'pipeline.stage.finished',
  STAGE_FAILED      : 'pipeline.stage.failed',
})
