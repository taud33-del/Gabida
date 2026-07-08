/**
 * core/adventure/Adventure.js
 *
 * Single responsibility: represent one immutable narrative adventure.
 *
 * Question: "What is happening in this story and how far along is it?"
 *
 * Every write operation returns a NEW Adventure.
 * Internal components are never exposed directly.
 * snapshot() returns a fully frozen plain object.
 *
 * No dependency on Runtime, EventBus, Registry, Character, Universe or Pipeline.
 */

import { AdventureCollection }  from './AdventureCollection.js'
import { AdventureObjective }   from './AdventureObjective.js'
import { AdventureState }       from './AdventureState.js'
import { validateAdventure }    from './AdventureValidator.js'
import { InvalidAdventureError } from './AdventureError.js'

// ─── Adventure ────────────────────────────────────────────────────────────────

export class Adventure {
  /**
   * @param {object}              identity    — { id, name, description?, metadata? }
   * @param {AdventureState}      state
   * @param {AdventureCollection} objectives
   */
  constructor(identity, state, objectives) {
    validateAdventure({ id: identity.id, name: identity.name })

    if (!(state instanceof AdventureState)) {
      throw new InvalidAdventureError('state must be an AdventureState', state)
    }
    if (!(objectives instanceof AdventureCollection)) {
      throw new InvalidAdventureError('objectives must be an AdventureCollection', objectives)
    }

    this._identity   = Object.freeze({ ...identity })
    this._state      = state
    this._objectives = objectives
    Object.freeze(this)
  }

  // ─── Identity accessors ───────────────────────────────────────────────────────

  get id()          { return this._identity.id }
  get name()        { return this._identity.name }
  get description() { return this._identity.description ?? '' }
  get metadata()    { return Object.freeze({ ...(this._identity.metadata ?? {}) }) }
  get state()       { return this._state }
  get objectives()  { return this._objectives }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * Returns a new Adventure with the objective added.
   *
   * @param {AdventureObjective} objective
   * @returns {Adventure}
   */
  addObjective(objective) {
    if (!(objective instanceof AdventureObjective)) {
      throw new InvalidAdventureError('objective must be an AdventureObjective', objective)
    }
    return new Adventure(this._identity, this._state, this._objectives.add(objective))
  }

  /**
   * Returns a new Adventure without the objective with the given id.
   *
   * @param {string} id
   * @returns {Adventure}
   */
  removeObjective(id) {
    return new Adventure(this._identity, this._state, this._objectives.remove(id))
  }

  /**
   * Returns a new Adventure with the objective marked as completed.
   *
   * @param {string} id
   * @returns {Adventure}
   */
  completeObjective(id) {
    return new Adventure(this._identity, this._state, this._objectives.complete(id))
  }

  /**
   * Returns a new Adventure with the given state applied.
   *
   * @param {AdventureState} newState
   * @returns {Adventure}
   */
  updateState(newState) {
    if (!(newState instanceof AdventureState)) {
      throw new InvalidAdventureError('state must be an AdventureState', newState)
    }
    return new Adventure(this._identity, newState, this._objectives)
  }

  // ─── Snapshot ─────────────────────────────────────────────────────────────────

  /** @returns {object} deep-frozen plain object */
  snapshot() {
    return Object.freeze({
      id          : this._identity.id,
      name        : this._identity.name,
      description : this._identity.description ?? '',
      metadata    : Object.freeze({ ...(this._identity.metadata ?? {}) }),
      state       : Object.freeze({
        status      : this._state.status,
        currentStep : this._state.currentStep,
        flags       : this._state.flags,
        variables   : this._state.variables,
        metadata    : this._state.metadata,
      }),
      objectives  : this._objectives.map(o => Object.freeze({
        id          : o.id,
        title       : o.title,
        description : o.description,
        completed   : o.completed,
        optional    : o.optional,
        metadata    : o.metadata,
      })),
    })
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

/**
 * Creates an empty Adventure with the given identity.
 *
 * @param {object} identity
 * @returns {Adventure}
 */
export function createAdventure(identity) {
  return new Adventure(identity, new AdventureState(), new AdventureCollection())
}
