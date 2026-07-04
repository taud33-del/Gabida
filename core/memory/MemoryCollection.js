/**
 * core/memory/MemoryCollection.js
 *
 * Single responsibility: hold an ordered, immutable set of MemoryEntry objects.
 *
 * Question: "How are memory entries stored and queried as a group?"
 *
 * Every write operation returns a NEW MemoryCollection.
 * The internal array is never mutated or exposed directly.
 * All returned arrays are frozen copies.
 *
 * No dependency on Runtime, EventBus, Registry or Pipeline.
 */

import { MemoryEntry }          from './MemoryEntry.js'
import {
  DuplicateMemoryError,
  MemoryNotFoundError,
  InvalidMemoryError,
}                               from './MemoryError.js'

// ─── MemoryCollection ────────────────────────────────────────────────────────

export class MemoryCollection {
  /**
   * @param {MemoryEntry[]} [entries]
   */
  constructor(entries = []) {
    /** @type {MemoryEntry[]} — private, never exposed */
    this._entries = [...entries]
    Object.freeze(this)
  }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * Returns a new collection with entry appended.
   * Throws if an entry with the same id already exists.
   *
   * @param {MemoryEntry} entry
   * @returns {MemoryCollection}
   * @throws {DuplicateMemoryError}
   * @throws {InvalidMemoryError}
   */
  add(entry) {
    if (!(entry instanceof MemoryEntry)) {
      throw new InvalidMemoryError('entry must be a MemoryEntry instance', entry)
    }
    if (this._entries.some(e => e.id === entry.id)) {
      throw new DuplicateMemoryError(entry.id)
    }
    return new MemoryCollection([...this._entries, entry])
  }

  /**
   * Returns a new collection without the entry identified by id.
   * Throws if id is not found.
   *
   * @param {string} id
   * @returns {MemoryCollection}
   * @throws {MemoryNotFoundError}
   */
  remove(id) {
    if (!this._entries.some(e => e.id === id)) {
      throw new MemoryNotFoundError(id)
    }
    return new MemoryCollection(this._entries.filter(e => e.id !== id))
  }

  // ─── Read API ─────────────────────────────────────────────────────────────────

  /**
   * Returns the MemoryEntry with the given id, or undefined.
   *
   * @param {string} id
   * @returns {MemoryEntry | undefined}
   */
  get(id) { return this._entries.find(e => e.id === id) }

  /** @param {string} id @returns {boolean} */
  has(id) { return this._entries.some(e => e.id === id) }

  /** @returns {number} */
  size() { return this._entries.length }

  /** @returns {MemoryEntry[]} frozen copy */
  getAll() { return Object.freeze([...this._entries]) }

  /**
   * @param {function(MemoryEntry): boolean} predicate
   * @returns {MemoryEntry[]} frozen filtered copy
   */
  filter(predicate) { return Object.freeze(this._entries.filter(predicate)) }

  /**
   * @param {function(MemoryEntry): *} transform
   * @returns {*[]} frozen mapped copy
   */
  map(transform) { return Object.freeze(this._entries.map(transform)) }

  /**
   * @param {function(MemoryEntry, MemoryEntry): number} comparator
   * @returns {MemoryEntry[]} frozen sorted copy
   */
  sort(comparator) { return Object.freeze([...this._entries].sort(comparator)) }
}
