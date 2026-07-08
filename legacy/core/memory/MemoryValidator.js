/**
 * core/memory/MemoryValidator.js
 *
 * Single responsibility: validate inputs to the Memory system.
 *
 * Pure functions only. No classes. No side effects.
 * Throwing functions raise typed errors.
 * Boolean functions never throw.
 */

import {
  InvalidMemoryKeyError,
  InvalidMemoryError,
}                          from './MemoryError.js'

const MIN_IMPORTANCE = 0
const MAX_IMPORTANCE = 1

// ─── Throwing validators ──────────────────────────────────────────────────────

/**
 * Validates that a key is a non-empty string.
 *
 * @param {unknown} key
 * @returns {void}
 * @throws {InvalidMemoryKeyError}
 */
export function validateKey(key) {
  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new InvalidMemoryKeyError(key)
  }
}

/**
 * Validates that an importance value is a number in [0, 1].
 *
 * @param {unknown} importance
 * @returns {void}
 * @throws {InvalidMemoryError}
 */
export function validateImportance(importance) {
  if (
    typeof importance !== 'number' ||
    isNaN(importance) ||
    importance < MIN_IMPORTANCE ||
    importance > MAX_IMPORTANCE
  ) {
    throw new InvalidMemoryError(
      `importance must be a number in [0, 1], got: ${importance}`,
      importance,
    )
  }
}

/**
 * Validates that a timestamp is a positive integer.
 *
 * @param {unknown} timestamp
 * @returns {void}
 * @throws {InvalidMemoryError}
 */
export function validateTimestamp(timestamp) {
  if (
    typeof timestamp !== 'number' ||
    !Number.isInteger(timestamp) ||
    timestamp < 0
  ) {
    throw new InvalidMemoryError(
      `timestamp must be a non-negative integer, got: ${timestamp}`,
      timestamp,
    )
  }
}

/**
 * Validates that an entry has id (string), key (string), value (not undefined),
 * timestamp and importance.
 *
 * @param {unknown} entry
 * @returns {void}
 * @throws {InvalidMemoryError}
 * @throws {InvalidMemoryKeyError}
 */
export function validateEntry(entry) {
  if (entry === null || typeof entry !== 'object') {
    throw new InvalidMemoryError('entry must be an object', entry)
  }
  if (typeof entry.id !== 'string' || entry.id.trim().length === 0) {
    throw new InvalidMemoryError('entry.id must be a non-empty string', entry.id)
  }
  validateKey(entry.key)
  if (entry.value === undefined) {
    throw new InvalidMemoryError('entry.value must not be undefined', entry.value)
  }
  validateTimestamp(entry.timestamp)
  validateImportance(entry.importance)
}
