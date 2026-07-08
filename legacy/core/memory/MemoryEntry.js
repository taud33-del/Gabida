/**
 * core/memory/MemoryEntry.js
 *
 * Single responsibility: represent one immutable memory record.
 *
 * Question: "What is a single unit of memory in Gabida?"
 *
 * MemoryEntry is an immutable value object.
 * All fields are set at construction and the instance is frozen immediately.
 * No field can be mutated after creation.
 *
 * No dependency on Runtime, EventBus, Registry or Pipeline.
 */

import { validateEntry }  from './MemoryValidator.js'

// ─── MemoryEntry ──────────────────────────────────────────────────────────────

export class MemoryEntry {
  /**
   * @param {object} fields
   * @param {string} fields.id
   * @param {string} fields.key
   * @param {*}      fields.value
   * @param {number} fields.timestamp
   * @param {number} fields.importance  — float in [0, 1]
   * @param {object} [fields.metadata]
   */
  constructor({ id, key, value, timestamp, importance, metadata = {} }) {
    validateEntry({ id, key, value, timestamp, importance })

    this.id         = id
    this.key        = key
    this.value      = value
    this.timestamp  = timestamp
    this.importance = importance
    this.metadata   = Object.freeze({ ...metadata })

    Object.freeze(this)
  }
}
