/**
 * core/stages/ProviderStage.js
 *
 * Single responsibility: adapt the api/ provider gateway to the Pipeline as an
 * immutable PipelineStage — the final link of the cognitive chain.
 *
 * Question: "How does the LLM call run inside the Pipeline over a Context?"
 *
 * This stage is a thin adapter. It reads the produced Prompt and the provider
 * configuration from the Context, delegates to the agnostic `callProvider`
 * gateway (which resolves the registered adapter, e.g. SimulationProvider), and
 * writes the produced ReponseIA back into the Context.
 *
 * It contains NO narrative logic, NO decision and NO extra processing. It never
 * knows any concrete provider — only the agnostic `callProvider` facade of api/.
 * The only side effect (the async provider call) is confined to this stage.
 *
 * @module core/stages/ProviderStage
 */

import { PipelineStage } from '../pipeline/PipelineStage.js'
import { callProvider }  from '../../api/index.js'
import { STAGE_KEYS, STAGE_NAMES } from './StageKeys.js'
import { MissingContextInputError } from './StageError.js'

// ─── ProviderStage ─────────────────────────────────────────────────────────────

export class ProviderStage extends PipelineStage {
  constructor() {
    super(STAGE_NAMES.PROVIDER)
  }

  /**
   * Reads prompt/providerConfig from the Context, calls callProvider and returns
   * a new Context carrying the produced ReponseIA.
   *
   * @param {import('../context/Context.js').Context} context
   * @returns {Promise<import('../context/Context.js').Context>}
   * @throws {MissingContextInputError}
   */
  async execute(context) {
    const prompt = context.get(STAGE_KEYS.PROMPT)
    const config = context.get(STAGE_KEYS.PROVIDER_CONFIG)

    if (prompt === undefined) throw new MissingContextInputError(this.name, STAGE_KEYS.PROMPT)
    if (config === undefined) throw new MissingContextInputError(this.name, STAGE_KEYS.PROVIDER_CONFIG)

    const reponseIA = await callProvider(prompt, config)
    return context.set(STAGE_KEYS.REPONSE_IA, reponseIA)
  }
}
