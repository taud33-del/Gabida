/**
 * core/adventure/AdventureCollection.js
 *
 * Single responsibility: hold an ordered, immutable set of AdventureObjective objects.
 *
 * Every write operation returns a NEW AdventureCollection.
 * Internal array is never mutated or exposed directly.
 */

import { AdventureObjective }                         from './AdventureObjective.js'
import { DuplicateObjectiveError,
         ObjectiveNotFoundError,
         InvalidAdventureError }                      from './AdventureError.js'

// ─── AdventureCollection ─────────────────────────────────────────────────────

export class AdventureCollection {
  /**
   * @param {AdventureObjective[]} [items]
   */
  constructor(items = []) {
    this._items = [...items]
    Object.freeze(this)
  }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * Returns a new collection with the objective appended.
   * Throws DuplicateObjectiveError if id already exists.
   *
   * @param {AdventureObjective} item
   * @returns {AdventureCollection}
   */
  add(item) {
    if (!(item instanceof AdventureObjective)) {
      throw new InvalidAdventureError('item must be an AdventureObjective', item)
    }
    if (this._items.some(i => i.id === item.id)) {
      throw new DuplicateObjectiveError(item.id)
    }
    return new AdventureCollection([...this._items, item])
  }

  /**
   * Returns a new collection without the objective with the given id.
   * Throws ObjectiveNotFoundError if not found.
   *
   * @param {string} id
   * @returns {AdventureCollection}
   */
  remove(id) {
    if (!this._items.some(i => i.id === id)) {
      throw new ObjectiveNotFoundError(id)
    }
    return new AdventureCollection(this._items.filter(i => i.id !== id))
  }

  /**
   * Returns a new collection with the objective at id replaced by its completed form.
   * Throws ObjectiveNotFoundError if not found.
   *
   * @param {string} id
   * @returns {AdventureCollection}
   */
  complete(id) {
    if (!this._items.some(i => i.id === id)) {
      throw new ObjectiveNotFoundError(id)
    }
    return new AdventureCollection(
      this._items.map(i => i.id === id ? i.complete() : i)
    )
  }

  // ─── Read API ─────────────────────────────────────────────────────────────────

  /** @param {string} id @returns {AdventureObjective | undefined} */
  get(id) { return this._items.find(i => i.id === id) }

  /** @param {string} id @returns {boolean} */
  has(id) { return this._items.some(i => i.id === id) }

  /** @returns {number} */
  size() { return this._items.length }

  /** @returns {AdventureObjective[]} frozen copy */
  getAll() { return Object.freeze([...this._items]) }

  /** @param {function} predicate @returns {AdventureObjective[]} */
  filter(predicate) { return Object.freeze(this._items.filter(predicate)) }

  /** @param {function} transform @returns {*[]} */
  map(transform) { return Object.freeze(this._items.map(transform)) }

  /** @param {function} comparator @returns {AdventureObjective[]} */
  sort(comparator) { return Object.freeze([...this._items].sort(comparator)) }
}
