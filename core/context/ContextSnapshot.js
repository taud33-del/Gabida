/**
 * core/context/ContextSnapshot.js
 *
 * Single responsibility: produce deep-frozen, isolated copies of context data.
 *
 * Question: "How do we guarantee that no mutable reference escapes the Context?"
 *
 * Pure utility functions only. No classes. No side effects.
 * Every function returns a new value — inputs are never mutated.
 */

// ─── Deep clone ───────────────────────────────────────────────────────────────

/**
 * Produces a deep clone of a value using structured clone semantics.
 * Handles plain objects, arrays, primitives.
 *
 * @param {*} value
 * @returns {*}
 */
export function clone(value) {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(clone)
  const result = {}
  for (const key of Object.keys(value)) {
    result[key] = clone(value[key])
  }
  return result
}

// ─── Deep freeze ─────────────────────────────────────────────────────────────

/**
 * Recursively freezes an object and all its nested plain objects.
 * Returns the frozen value (same reference, now frozen).
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function freeze(value) {
  if (value === null || typeof value !== 'object') return value
  if (Object.isFrozen(value)) return value
  for (const key of Object.keys(value)) {
    freeze(value[key])
  }
  return Object.freeze(value)
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────

/**
 * Produces a deep-cloned, deep-frozen snapshot of a value.
 * The returned value shares no references with the input.
 *
 * @param {*} value
 * @returns {*}
 */
export function snapshot(value) {
  return freeze(clone(value))
}
