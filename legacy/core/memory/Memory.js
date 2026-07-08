/**
 * core/memory/Memory.js
 *
 * Single responsibility: represent the complete immutable memory of one execution.
 *
 * Question: "What does a narrative agent remember at a given moment?"
 *
 * Memory is an immutable wrapper around MemoryCollection.
 * Every write operation returns a NEW Memory instance.
 * snapshot() returns a deep-frozen plain-object representation.
 *
 * No dependency on Runtime, EventBus, Registry or Pipeline.
 */

import { MemoryCollection }  from './MemoryCollection.js'
import { MemoryEntry }       from './MemoryEntry.js'
import { InvalidMemoryError } from './MemoryError.js'

// ─── Memory ───────────────────────────────────────────────────────────────────

export class Memory {
  /**
   * @param {MemoryCollection} [collection]
   */
  constructor(collection = new MemoryCollection()) {
    if (!(collection instanceof MemoryCollection)) {
      throw new InvalidMemoryError('collection must be a MemoryCollection instance', collection)
    }
    /** @type {MemoryCollection} */
    this._collection = collection
    Object.freeze(this)
  }

  // ─── Write API (returns NEW Memory) ──────────────────────────────────────────

  /**
   * Returns a new Memory with the entry added.
   *
   * @param {MemoryEntry} entry
   * @returns {Memory}
   */
  remember(entry) {
    return new Memory(this._collection.add(entry))
  }

  /**
   * Returns a new Memory without the entry identified by id.
   *
   * @param {string} id
   * @returns {Memory}
   */
  forget(id) {
    return new Memory(this._collection.remove(id))
  }

  // ─── Read API ─────────────────────────────────────────────────────────────────

  /**
   * Returns the MemoryEntry with the given id, or undefined.
   *
   * @param {string} id
   * @returns {MemoryEntry | undefined}
   */
  recall(id) {
    return this._collection.get(id)
  }

  /**
   * Returns a frozen array of all MemoryEntry objects.
   *
   * @returns {MemoryEntry[]}
   */
  recallAll() {
    return this._collection.getAll()
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._collection.has(id)
  }

  /**
   * @returns {number}
   */
  size() {
    return this._collection.size()
  }

  /**
   * Returns a deep-frozen plain-object snapshot of all entries.
   *
   * @returns {object}
   */
  snapshot() {
    const entries = this._collection.getAll()
    return Object.freeze(
      entries.map(e => Object.freeze({
        id         : e.id,
        key        : e.key,
        value      : e.value,
        timestamp  : e.timestamp,
        importance : e.importance,
        metadata   : e.metadata,
      }))
    )
  }
}
