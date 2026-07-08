/**
 * core/context/ContextValidator.js
 *
 * Single responsibility: validate inputs to the Context system.
 *
 * Pure functions only. No classes. No side effects.
 * Throwing functions raise typed errors.
 * Boolean functions never throw.
 */

import { InvalidContextKeyError, InvalidContextValueError } from './ContextError.js'

// ─── Throwing validators ──────────────────────────────────────────────────────

/**
 * Validates that a context key is a non-empty string.
 *
 * @param {unknown} key
 * @returns {void}
 * @throws {InvalidContextKeyError}
 */
export function validateKey(key) {
  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new InvalidContextKeyError(key)
  }
}

/**
 * Validates that a context value is not undefined.
 *
 * @param {string}  key
 * @param {unknown} value
 * @returns {void}
 * @throws {InvalidContextValueError}
 */
export function validateValue(key, value) {
  if (value === undefined) {
    throw new InvalidContextValueError(key, value)
  }
}

// ─── Boolean helpers ─────────────────────────────────────────────────────────

/**
 * Returns true if a key is a non-empty string.
 *
 * @param {unknown} key
 * @returns {boolean}
 */
export function hasKey(data, key) {
  return Object.prototype.hasOwnProperty.call(data, key)
}

/**
 * Returns true if a value is a plain object (not null, not array).
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isContextObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
