/**
 * core/character/CharacterRelations.js
 *
 * Single responsibility: store an immutable map of character relationships.
 *
 * Every modification returns a NEW CharacterRelations.
 * Internal data is never exposed directly.
 */

import { validateRelation }      from './CharacterValidator.js'
import { RelationNotFoundError } from './CharacterError.js'

// ─── CharacterRelations ───────────────────────────────────────────────────────

export class CharacterRelations {
  /**
   * @param {object} [data]  — map of id → relation object
   */
  constructor(data = {}) {
    /** @type {object} */
    this._data = { ...data }
    Object.freeze(this)
  }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * Returns a new CharacterRelations with the relation added or replaced.
   *
   * @param {string} id
   * @param {object} relation
   * @returns {CharacterRelations}
   */
  set(id, relation) {
    validateRelation(id, relation)
    return new CharacterRelations({ ...this._data, [id]: { ...relation } })
  }

  /**
   * Returns a new CharacterRelations without the given id.
   * Throws RelationNotFoundError if absent.
   *
   * @param {string} id
   * @returns {CharacterRelations}
   */
  remove(id) {
    if (!Object.prototype.hasOwnProperty.call(this._data, id)) {
      throw new RelationNotFoundError(id)
    }
    const next = { ...this._data }
    delete next[id]
    return new CharacterRelations(next)
  }

  // ─── Read API ─────────────────────────────────────────────────────────────────

  /**
   * @param {string} id
   * @returns {object | undefined}
   */
  get(id) {
    const rel = this._data[id]
    return rel ? Object.freeze({ ...rel }) : undefined
  }

  /** @param {string} id @returns {boolean} */
  has(id) { return Object.prototype.hasOwnProperty.call(this._data, id) }

  /** @returns {number} */
  size() { return Object.keys(this._data).length }

  /** @returns {object} frozen map */
  getAll() {
    const copy = {}
    for (const [id, rel] of Object.entries(this._data)) {
      copy[id] = Object.freeze({ ...rel })
    }
    return Object.freeze(copy)
  }
}
