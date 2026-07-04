/**
 * core/character/CharacterTraits.js
 *
 * Single responsibility: store an immutable map of character traits.
 *
 * Every modification returns a NEW CharacterTraits.
 * Internal data is never exposed directly.
 */

import { validateTrait }       from './CharacterValidator.js'
import { DuplicateTraitError } from './CharacterError.js'

// ─── CharacterTraits ─────────────────────────────────────────────────────────

export class CharacterTraits {
  /**
   * @param {object} [data]
   */
  constructor(data = {}) {
    /** @type {object} */
    this._data = { ...data }
    Object.freeze(this)
  }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * Returns a new CharacterTraits with the trait set.
   * Throws DuplicateTraitError if the trait already exists.
   *
   * @param {string} name
   * @param {*}      value
   * @returns {CharacterTraits}
   */
  set(name, value) {
    validateTrait(name, value)
    if (Object.prototype.hasOwnProperty.call(this._data, name)) {
      throw new DuplicateTraitError(name)
    }
    return new CharacterTraits({ ...this._data, [name]: value })
  }

  /**
   * Returns a new CharacterTraits with the trait updated (or added).
   *
   * @param {string} name
   * @param {*}      value
   * @returns {CharacterTraits}
   */
  update(name, value) {
    validateTrait(name, value)
    return new CharacterTraits({ ...this._data, [name]: value })
  }

  /**
   * Returns a new CharacterTraits without the given trait.
   * Silent if absent.
   *
   * @param {string} name
   * @returns {CharacterTraits}
   */
  remove(name) {
    const next = { ...this._data }
    delete next[name]
    return new CharacterTraits(next)
  }

  // ─── Read API ─────────────────────────────────────────────────────────────────

  /** @param {string} name @returns {*} */
  get(name) { return this._data[name] }

  /** @param {string} name @returns {boolean} */
  has(name) { return Object.prototype.hasOwnProperty.call(this._data, name) }

  /** @returns {string[]} */
  keys() { return Object.freeze(Object.keys(this._data)) }

  /** @returns {*[]} */
  values() { return Object.freeze(Object.values(this._data)) }

  /** @returns {Array<[string, *]>} */
  entries() { return Object.freeze(Object.entries(this._data)) }

  /** @returns {number} */
  size() { return Object.keys(this._data).length }

  /** @returns {object} */
  toObject() { return Object.freeze({ ...this._data }) }
}
