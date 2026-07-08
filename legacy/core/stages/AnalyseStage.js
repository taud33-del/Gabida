/**
 * core/stages/AnalyseStage.js
 *
 * Single responsibility: adapt the existing `analyse` business module to the
 * Pipeline as an immutable PipelineStage.
 *
 * Question: "How does the analyse module run inside the Pipeline over a Context?"
 *
 * This stage is a thin adapter. It reads its inputs from the Context, calls the
 * existing `analyzeEvent` algorithm UNCHANGED, and writes the produced Evenement
 * back into the Context. It contains no narrative logic of its own and never
 * mutates the received Context (write-as-copy).
 *
 * The `analyse` module stays completely unaware of the Runtime and the Context.
 *
 * @module core/stages/AnalyseStage
 */

import { PipelineStage } from '../pipeline/PipelineStage.js'
import { analyzeEvent }  from '../../analyse/index.js'
import { STAGE_KEYS, STAGE_NAMES } from './StageKeys.js'
import { MissingContextInputError } from './StageError.js'

// ─── AnalyseStage ─────────────────────────────────────────────────────────────

export class AnalyseStage extends PipelineStage {
  constructor() {
    super(STAGE_NAMES.ANALYSE)
  }

  /**
   * Reads playerMessage/fiches/etat from the Context, runs analyzeEvent and
   * returns a new Context carrying the produced Evenement.
   *
   * @param {import('../context/Context.js').Context} context
   * @returns {Promise<import('../context/Context.js').Context>}
   * @throws {MissingContextInputError}
   */
  async execute(context) {
    const playerMessage = context.get(STAGE_KEYS.PLAYER_MESSAGE)
    const fiches        = context.get(STAGE_KEYS.FICHES)
    const etat          = context.get(STAGE_KEYS.ETAT)

    if (playerMessage === undefined) throw new MissingContextInputError(this.name, STAGE_KEYS.PLAYER_MESSAGE)
    if (fiches === undefined)        throw new MissingContextInputError(this.name, STAGE_KEYS.FICHES)
    if (etat === undefined)          throw new MissingContextInputError(this.name, STAGE_KEYS.ETAT)

    const evenement = analyzeEvent(playerMessage, fiches, etat)
    return context.set(STAGE_KEYS.EVENEMENT, evenement)
  }
}
