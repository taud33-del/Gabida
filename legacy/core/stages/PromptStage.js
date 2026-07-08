/**
 * core/stages/PromptStage.js
 *
 * Single responsibility: adapt the existing `prompt` business module to the
 * Pipeline as an immutable PipelineStage.
 *
 * Question: "How does the prompt module run inside the Pipeline over a Context?"
 *
 * This stage is a thin adapter. It reads its inputs from the Context, calls the
 * existing `buildPrompt` algorithm UNCHANGED, and writes the produced Prompt
 * back into the Context. It contains no narrative logic of its own and never
 * mutates the received Context (write-as-copy).
 *
 * The raw player message enters the language layer HERE (via prompt), never
 * before. The FiltreRelationnel is deliberately NOT read here.
 *
 * The `prompt` module stays completely unaware of the Runtime and the Context.
 *
 * @module core/stages/PromptStage
 */

import { PipelineStage } from '../pipeline/PipelineStage.js'
import { buildPrompt }   from '../../prompt/index.js'
import { STAGE_KEYS, STAGE_NAMES } from './StageKeys.js'
import { MissingContextInputError } from './StageError.js'

// ─── PromptStage ───────────────────────────────────────────────────────────────

export class PromptStage extends PipelineStage {
  constructor() {
    super(STAGE_NAMES.PROMPT)
  }

  /**
   * Reads playerMessage/decision/ressenti/fiches/etat from the Context, runs
   * buildPrompt and returns a new Context carrying the produced Prompt.
   *
   * @param {import('../context/Context.js').Context} context
   * @returns {Promise<import('../context/Context.js').Context>}
   * @throws {MissingContextInputError}
   */
  async execute(context) {
    const playerMessage = context.get(STAGE_KEYS.PLAYER_MESSAGE)
    const decision      = context.get(STAGE_KEYS.DECISION)
    const ressenti      = context.get(STAGE_KEYS.RESSENTI)
    const fiches        = context.get(STAGE_KEYS.FICHES)
    const etat          = context.get(STAGE_KEYS.ETAT)

    if (playerMessage === undefined) throw new MissingContextInputError(this.name, STAGE_KEYS.PLAYER_MESSAGE)
    if (decision === undefined)      throw new MissingContextInputError(this.name, STAGE_KEYS.DECISION)
    if (ressenti === undefined)      throw new MissingContextInputError(this.name, STAGE_KEYS.RESSENTI)
    if (fiches === undefined)        throw new MissingContextInputError(this.name, STAGE_KEYS.FICHES)
    if (etat === undefined)          throw new MissingContextInputError(this.name, STAGE_KEYS.ETAT)

    const prompt = buildPrompt(playerMessage, decision, ressenti, fiches, etat)
    return context.set(STAGE_KEYS.PROMPT, prompt)
  }
}
