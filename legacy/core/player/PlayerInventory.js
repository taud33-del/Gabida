/**
 * core/player/PlayerInventory.js
 *
 * Single responsibility: store an ordered, immutable collection of inventory items.
 *
 * Every write operation returns a NEW PlayerInventory.
 * Internal array is never mutated or exposed directly.
 * Items must have a non-empty string `id` field.
 */

import {
  DuplicateItemError,
  ItemNotFoundError,
  InvalidPlayerError,
} from './PlayerError.js'

// ─── PlayerInventory ─────────────────────────────────────────────────────────

export class PlayerInventory {
  /**
   * @param {object[]} [items]
   */
  constructor(items = []) {
    this._items = [...items]
    Object.freeze(this)
  }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * Returns a new inventory with the item appended.
   * Throws DuplicateItemError if id already exists.
   *
   * @param {object} item — must have a non-empty string `id`
   * @returns {PlayerInventory}
   */
  add(item) {
    if (item === null || typeof item !== 'object' || typeof item.id !== 'string' || item.id.trim().length === 0) {
      throw new InvalidPlayerError('item must be an object with a non-empty string id', item)
    }
    if (this._items.some(i => i.id === item.id)) {
      throw new DuplicateItemError(item.id)
    }
    return new PlayerInventory([...this._items, item])
  }

  /**
   * Returns a new inventory without the item with the given id.
   * Throws ItemNotFoundError if not found.
   *
   * @param {string} id
   * @returns {PlayerInventory}
   */
  remove(id) {
    if (!this._items.some(i => i.id === id)) {
      throw new ItemNotFoundError(id)
    }
    return new PlayerInventory(this._items.filter(i => i.id !== id))
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
