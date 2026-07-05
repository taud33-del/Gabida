/**
 * core/stages/DecisionStage.js
 *
 * Single responsibility: adapt the existing `decision` business module to the
 * Pipeline as an immutable PipelineStage.
 *
 * Question: "How does the decision module run inside the Pipeline over a Context?"
 *
 * This stage is a thin adapter. It reads its inputs from the Context, calls the
 * existing `computeDecision` algorithm UNCHANGED, and writes the produced
 * Decision back into the Context. It contains no narrative logic of its own and
 * never mutates the received Context (write-as-copy).
 *
 * The FiltreRelationnel is deliberately NOT read here — decision consumes only
 * evenement, ressenti, fiches and etat.
 *
 * The `decision` module stays completely unaware of the Runtime and the Context.
 *
 * @module core/stages/DecisionStage
 */

import { PipelineStage }  from '../pipeline/PipelineStage.js'
import { computeDecision } from '../../decision/index.js'
import { STAGE_KEYS, STAGE_NAMES } from './StageKeys.js'
import { MissingContextInputError } from './StageError.js'

// ─── DecisionStage ─────────────────────────────────────────────────────────────

export class DecisionStage extends PipelineStage {
  constructor() {
    super(STAGE_NAMES.DECISION)
  }

  /**
   * Reads evenement/ressenti/fiches/etat from the Context, runs computeDecision
   * and returns a new Context carrying the produced Decision.
   *
   * @param {import('../context/Context.js').Context} context
   * @returns {Promise<import('../context/Context.js').Context>}
   * @throws {MissingContextInputError}
   */
  async execute(context) {
    const evenement = context.get(STAGE_KEYS.EVENEMENT)
    const ressenti  = context.get(STAGE_KEYS.RESSENTI)
    const fiches    = context.get(STAGE_KEYS.FICHES)
    const etat      = context.get(STAGE_KEYS.ETAT)

    if (evenement === undefined) throw new MissingContextInputError(this.name, STAGE_KEYS.EVENEMENT)
    if (ressenti === undefined)  throw new MissingContextInputError(this.name, STAGE_KEYS.RESSENTI)
    if (fiches === undefined)    throw new MissingContextInputError(this.name, STAGE_KEYS.FICHES)
    if (etat === undefined)      throw new MissingContextInputError(this.name, STAGE_KEYS.ETAT)

    const decision = computeDecision(evenement, ressenti, fiches, etat)
    return context.set(STAGE_KEYS.DECISION, decision)
  }
}
