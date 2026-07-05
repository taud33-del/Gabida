/**
 * core/stages/RessentiStage.js
 *
 * Single responsibility: adapt the existing `ressenti` business module to the
 * Pipeline as an immutable PipelineStage.
 *
 * Question: "How does the ressenti module run inside the Pipeline over a Context?"
 *
 * This stage is a thin adapter. It reads its inputs from the Context, calls the
 * existing `computeRessenti` algorithm UNCHANGED, and writes the produced
 * Ressenti back into the Context. It contains no narrative logic of its own and
 * never mutates the received Context (write-as-copy).
 *
 * The FiltreRelationnel is consumed HERE and only here — it is never re-injected
 * into decision or prompt (absolute rule of the engine).
 *
 * The `ressenti` module stays completely unaware of the Runtime and the Context.
 *
 * @module core/stages/RessentiStage
 */

import { PipelineStage }  from '../pipeline/PipelineStage.js'
import { computeRessenti } from '../../ressenti/index.js'
import { STAGE_KEYS, STAGE_NAMES } from './StageKeys.js'
import { MissingContextInputError } from './StageError.js'

// ─── RessentiStage ─────────────────────────────────────────────────────────────

export class RessentiStage extends PipelineStage {
  constructor() {
    super(STAGE_NAMES.RESSENTI)
  }

  /**
   * Reads evenement/filtreRelationnel from the Context, runs computeRessenti and
   * returns a new Context carrying the produced Ressenti.
   *
   * @param {import('../context/Context.js').Context} context
   * @returns {Promise<import('../context/Context.js').Context>}
   * @throws {MissingContextInputError}
   */
  async execute(context) {
    const evenement        = context.get(STAGE_KEYS.EVENEMENT)
    const filtreRelationnel = context.get(STAGE_KEYS.FILTRE_RELATIONNEL)

    if (evenement === undefined)        throw new MissingContextInputError(this.name, STAGE_KEYS.EVENEMENT)
    if (filtreRelationnel === undefined) throw new MissingContextInputError(this.name, STAGE_KEYS.FILTRE_RELATIONNEL)

    const ressenti = computeRessenti(evenement, filtreRelationnel)
    return context.set(STAGE_KEYS.RESSENTI, ressenti)
  }
}
