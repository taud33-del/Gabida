/**
 * core/player/PlayerFlags.js
 *
 * Single responsibility: store an immutable key/value map of player flags.
 *
 * Every modification returns a NEW PlayerFlags.
 * Internal data is never exposed directly.
 */

import { InvalidPlayerError } from './PlayerError.js'

// ─── PlayerFlags ──────────────────────────────────────────────────────────────

export class PlayerFlags {
  /**
   * @param {object} [data]
   */
  constructor(data = {}) {
    this._data = { ...data }
    Object.freeze(this)
  }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * Returns a new PlayerFlags with the flag set.
   *
   * @param {string}  key
   * @param {unknown} value
   * @returns {PlayerFlags}
   */
  set(key, value) {
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new InvalidPlayerError(`flag key must be a non-empty string`, key)
    }
    if (value === undefined) {
      throw new InvalidPlayerError(`flag value must not be undefined`, value)
    }
    return new PlayerFlags({ ...this._data, [key]: value })
  }

  /**
   * Returns a new PlayerFlags without the given key.
   * Silent if absent.
   *
   * @param {string} key
   * @returns {PlayerFlags}
   */
  remove(key) {
    const next = { ...this._data }
    delete next[key]
    return new PlayerFlags(next)
  }

  // ─── Read API ─────────────────────────────────────────────────────────────────

  /** @param {string} key @returns {*} */
  get(key) { return this._data[key] }

  /** @param {string} key @returns {boolean} */
  has(key) { return Object.prototype.hasOwnProperty.call(this._data, key) }

  /** @returns {string[]} */
  keys() { return Object.freeze(Object.keys(this._data)) }

  /** @returns {*[]} */
  values() { return Object.freeze(Object.values(this._data)) }

  /** @returns {Array<[string, *]>} */
  entries() { return Object.freeze(Object.entries(this._data)) }

  /** @returns {number} */
  size() { return Object.keys(this._data).length }
}
