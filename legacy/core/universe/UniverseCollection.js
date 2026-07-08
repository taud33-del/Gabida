/**
 * core/universe/UniverseCollection.js
 *
 * Single responsibility: hold an ordered, immutable set of universe items.
 *
 * Question: "How are locations or rules stored and queried as a group?"
 *
 * Every write operation returns a NEW UniverseCollection.
 * Internal array is never mutated or exposed directly.
 * Items must have an `id` string field.
 *
 * No dependency on Runtime, EventBus, Registry or Pipeline.
 */

import { InvalidUniverseError } from './UniverseError.js'

// ─── UniverseCollection ───────────────────────────────────────────────────────

export class UniverseCollection {
  /**
   * @param {object[]} [items]
   * @param {Function} DuplicateError — error class for duplicates
   * @param {Function} NotFoundError  — error class for missing items
   */
  constructor(items = [], DuplicateError, NotFoundError) {
    if (!DuplicateError || !NotFoundError) {
      throw new InvalidUniverseError('UniverseCollection requires DuplicateError and NotFoundError', null)
    }
    this._items          = [...items]
    this._DuplicateError = DuplicateError
    this._NotFoundError  = NotFoundError
    Object.freeze(this)
  }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * Returns a new collection with the item appended.
   * Throws if an item with the same id already exists.
   *
   * @param {object} item
   * @returns {UniverseCollection}
   */
  add(item) {
    if (!item || typeof item.id !== 'string') {
      throw new InvalidUniverseError('item must have a string id', item)
    }
    if (this._items.some(i => i.id === item.id)) {
      throw new this._DuplicateError(item.id)
    }
    return new UniverseCollection([...this._items, item], this._DuplicateError, this._NotFoundError)
  }

  /**
   * Returns a new collection without the item with the given id.
   * Throws if not found.
   *
   * @param {string} id
   * @returns {UniverseCollection}
   */
  remove(id) {
    if (!this._items.some(i => i.id === id)) {
      throw new this._NotFoundError(id)
    }
    return new UniverseCollection(
      this._items.filter(i => i.id !== id),
      this._DuplicateError,
      this._NotFoundError,
    )
  }

  // ─── Read API ─────────────────────────────────────────────────────────────────

  /** @param {string} id @returns {object | undefined} */
  get(id) { return this._items.find(i => i.id === id) }

  /** @param {string} id @returns {boolean} */
  has(id) { return this._items.some(i => i.id === id) }

  /** @returns {number} */
  size() { return this._items.length }

  /** @returns {object[]} frozen copy */
  getAll() { return Object.freeze([...this._items]) }

  /** @param {function} predicate @returns {object[]} */
  filter(predicate) { return Object.freeze(this._items.filter(predicate)) }

  /** @param {function} transform @returns {*[]} */
  map(transform) { return Object.freeze(this._items.map(transform)) }

  /** @param {function} comparator @returns {object[]} */
  sort(comparator) { return Object.freeze([...this._items].sort(comparator)) }
}
