/**
 * core/character/Character.js
 *
 * Single responsibility: represent one immutable narrative character.
 *
 * Question: "Who is this character and what do they know right now?"
 *
 * Every write operation returns a NEW Character.
 * Internal components are never exposed directly.
 * Memory integration uses the existing Memory class.
 *
 * No dependency on Runtime, EventBus, Registry or Pipeline.
 */

import { Memory }              from '../memory/Memory.js'
import { MemoryEntry }         from '../memory/MemoryEntry.js'
import { CharacterTraits }     from './CharacterTraits.js'
import { CharacterRelations }  from './CharacterRelations.js'
import { CharacterState }      from './CharacterState.js'
import { validateId, validateName, validateTrait, validateRelation } from './CharacterValidator.js'
import { InvalidCharacterError } from './CharacterError.js'

// ─── Character ────────────────────────────────────────────────────────────────

export class Character {
  /**
   * @param {object}             identity   — { id, name, description?, age?, role?, tags?, metadata? }
   * @param {CharacterState}     state
   * @param {CharacterTraits}    traits
   * @param {CharacterRelations} relations
   * @param {Memory}             memory
   */
  constructor(identity, state, traits, relations, memory) {
    validateId(identity.id)
    validateName(identity.name)

    if (!(state instanceof CharacterState))      throw new InvalidCharacterError('state must be a CharacterState', state)
    if (!(traits instanceof CharacterTraits))    throw new InvalidCharacterError('traits must be a CharacterTraits', traits)
    if (!(relations instanceof CharacterRelations)) throw new InvalidCharacterError('relations must be a CharacterRelations', relations)
    if (!(memory instanceof Memory))             throw new InvalidCharacterError('memory must be a Memory instance', memory)

    this._identity  = Object.freeze({ ...identity })
    this._state     = state
    this._traits    = traits
    this._relations = relations
    this._memory    = memory
    Object.freeze(this)
  }

  // ─── Identity accessors ───────────────────────────────────────────────────────

  get id()          { return this._identity.id }
  get name()        { return this._identity.name }
  get description() { return this._identity.description ?? null }
  get age()         { return this._identity.age ?? null }
  get role()        { return this._identity.role ?? null }
  get tags()        { return Object.freeze(this._identity.tags ?? []) }
  get state()       { return this._state }
  get traits()      { return this._traits }
  get relations()   { return this._relations }
  get memory()      { return this._memory }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /** @param {MemoryEntry} entry @returns {Character} */
  remember(entry) {
    return new Character(this._identity, this._state, this._traits, this._relations, this._memory.remember(entry))
  }

  /** @param {string} id @returns {Character} */
  forget(id) {
    return new Character(this._identity, this._state, this._traits, this._relations, this._memory.forget(id))
  }

  /**
   * Sets a trait. Throws DuplicateTraitError if already set.
   * @param {string} name @param {*} value @returns {Character}
   */
  setTrait(name, value) {
    validateTrait(name, value)
    return new Character(this._identity, this._state, this._traits.set(name, value), this._relations, this._memory)
  }

  /** @param {string} name @returns {Character} */
  removeTrait(name) {
    return new Character(this._identity, this._state, this._traits.remove(name), this._relations, this._memory)
  }

  /** @param {string} id @param {object} relation @returns {Character} */
  setRelation(id, relation) {
    validateRelation(id, relation)
    return new Character(this._identity, this._state, this._traits, this._relations.set(id, relation), this._memory)
  }

  /** @param {string} id @returns {Character} */
  removeRelation(id) {
    return new Character(this._identity, this._state, this._traits, this._relations.remove(id), this._memory)
  }

  /** @param {CharacterState} newState @returns {Character} */
  withState(newState) {
    if (!(newState instanceof CharacterState)) throw new InvalidCharacterError('state must be a CharacterState', newState)
    return new Character(this._identity, newState, this._traits, this._relations, this._memory)
  }

  // ─── Snapshot ─────────────────────────────────────────────────────────────────

  /** @returns {object} deep-frozen plain object */
  snapshot() {
    return Object.freeze({
      id          : this._identity.id,
      name        : this._identity.name,
      description : this._identity.description ?? null,
      age         : this._identity.age ?? null,
      role        : this._identity.role ?? null,
      tags        : Object.freeze([...(this._identity.tags ?? [])]),
      state       : Object.freeze({ status: this._state.status, flags: this._state.flags, metadata: this._state.metadata }),
      traits      : this._traits.toObject(),
      relations   : this._relations.getAll(),
      memory      : this._memory.snapshot(),
    })
  }
}
