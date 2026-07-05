/**
 * core/stages/NarrativePipeline.js
 *
 * Single responsibility: assemble the complete cognitive chain as one Pipeline.
 *
 * Question: "How is the full Gabida dialogue chain wired into a Pipeline?"
 *
 * This module only WIRES the already-validated adapter stages in the canonical
 * order. It contains no narrative logic, no decision, no algorithm — only
 * assembly:
 *
 *   AnalyseStage → InfluencesStage → RessentiStage → DecisionStage
 *     → PromptStage → ProviderStage
 *
 * The produced Pipeline is immutable (frozen by PipelineBuilder.build()) and can
 * be executed by the Runtime over a Context carrying the host inputs
 * (playerMessage, fiches, etat, providerConfig).
 *
 * @module core/stages/NarrativePipeline
 */

import { PipelineBuilder } from '../pipeline/PipelineBuilder.js'
import { AnalyseStage }    from './AnalyseStage.js'
import { InfluencesStage } from './InfluencesStage.js'
import { RessentiStage }   from './RessentiStage.js'
import { DecisionStage }   from './DecisionStage.js'
import { PromptStage }     from './PromptStage.js'
import { ProviderStage }   from './ProviderStage.js'

/**
 * Builds the complete cognitive Pipeline (User → … → ReponseIA).
 * Pure assembly: instantiates each adapter stage and adds it in canonical order.
 *
 * @returns {import('../pipeline/Pipeline.js').Pipeline}
 */
export function buildNarrativePipeline() {
  return new PipelineBuilder()
    .add(new AnalyseStage())
    .add(new InfluencesStage())
    .add(new RessentiStage())
    .add(new DecisionStage())
    .add(new PromptStage())
    .add(new ProviderStage())
    .build()
}
