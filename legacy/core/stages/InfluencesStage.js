/**
 * core/stages/InfluencesStage.js
 *
 * Single responsibility: adapt the existing `influences` business module to the
 * Pipeline as an immutable PipelineStage.
 *
 * Question: "How does the influences module run inside the Pipeline over a Context?"
 *
 * This stage is a thin adapter. It reads its inputs from the Context, calls the
 * existing `computeInfluences` algorithm UNCHANGED, and writes the produced
 * FiltreRelationnel back into the Context. It contains no narrative logic of its
 * own and never mutates the received Context (write-as-copy).
 *
 * The FiltreRelationnel produced here is meant to be consumed by the future
 * ressenti stage only — it is never re-injected into decision or prompt.
 *
 * The `influences` module stays completely unaware of the Runtime and the Context.
 *
 * @module core/stages/InfluencesStage
 */

import { PipelineStage }    from '../pipeline/PipelineStage.js'
import { computeInfluences } from '../../influences/index.js'
import { STAGE_KEYS, STAGE_NAMES } from './StageKeys.js'
import { MissingContextInputError } from './StageError.js'

// ─── InfluencesStage ──────────────────────────────────────────────────────────

export class InfluencesStage extends PipelineStage {
  constructor() {
    super(STAGE_NAMES.INFLUENCES)
  }

  /**
   * Reads evenement/fiches/etat from the Context, runs computeInfluences and
   * returns a new Context carrying the produced FiltreRelationnel.
   *
   * @param {import('../context/Context.js').Context} context
   * @returns {Promise<import('../context/Context.js').Context>}
   * @throws {MissingContextInputError}
   */
  async execute(context) {
    const evenement = context.get(STAGE_KEYS.EVENEMENT)
    const fiches    = context.get(STAGE_KEYS.FICHES)
    const etat      = context.get(STAGE_KEYS.ETAT)

    if (evenement === undefined) throw new MissingContextInputError(this.name, STAGE_KEYS.EVENEMENT)
    if (fiches === undefined)    throw new MissingContextInputError(this.name, STAGE_KEYS.FICHES)
    if (etat === undefined)      throw new MissingContextInputError(this.name, STAGE_KEYS.ETAT)

    const filtreRelationnel = computeInfluences(evenement, fiches, etat)
    return context.set(STAGE_KEYS.FILTRE_RELATIONNEL, filtreRelationnel)
  }
}
