/**
 * core/stages/index.js
 *
 * Barrel of the narrative adapter stages layer (Sprint 22 — Lot 1).
 *
 * This layer is the official home of the PipelineStage adapters that connect the
 * existing business modules to the Pipeline through the Context. Business modules
 * remain unaware of the Runtime and the Context; each stage only reads/writes the
 * Context and delegates to the unchanged business algorithm.
 *
 * @module core/stages
 */

export { STAGE_KEYS, STAGE_NAMES } from './StageKeys.js'
export { StageError, MissingContextInputError } from './StageError.js'
export { AnalyseStage } from './AnalyseStage.js'
export { InfluencesStage } from './InfluencesStage.js'
export { RessentiStage } from './RessentiStage.js'
export { DecisionStage } from './DecisionStage.js'
export { PromptStage } from './PromptStage.js'
export { ProviderStage } from './ProviderStage.js'
export { buildNarrativePipeline } from './NarrativePipeline.js'
