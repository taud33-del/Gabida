/**
 * core/universe/UniverseValidator.js
 *
 * Single responsibility: validate inputs to the Universe system.
 *
 * Pure functions only. No classes. No side effects.
 */

import { InvalidUniverseError } from './UniverseError.js'

// ─── Throwing validators ──────────────────────────────────────────────────────

/**
 * @param {unknown} name
 * @throws {InvalidUniverseError}
 */
export function validateUniverseName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new InvalidUniverseError(`name must be a non-empty string, got: ${typeof name}`, name)
  }
}

/**
 * @param {unknown} universe
 * @throws {InvalidUniverseError}
 */
export function validateUniverse(universe) {
  if (universe === null || typeof universe !== 'object') {
    throw new InvalidUniverseError('universe must be an object', universe)
  }
  if (typeof universe.id !== 'string' || universe.id.trim().length === 0) {
    throw new InvalidUniverseError('universe.id must be a non-empty string', universe.id)
  }
  validateUniverseName(universe.name)
}

/**
 * @param {unknown} location
 * @throws {InvalidUniverseError}
 */
export function validateLocation(location) {
  if (location === null || typeof location !== 'object') {
    throw new InvalidUniverseError('location must be an object', location)
  }
  if (typeof location.id !== 'string' || location.id.trim().length === 0) {
    throw new InvalidUniverseError('location.id must be a non-empty string', location.id)
  }
  if (typeof location.name !== 'string' || location.name.trim().length === 0) {
    throw new InvalidUniverseError('location.name must be a non-empty string', location.name)
  }
}

/**
 * @param {unknown} rule
 * @throws {InvalidUniverseError}
 */
export function validateRule(rule) {
  if (rule === null || typeof rule !== 'object') {
    throw new InvalidUniverseError('rule must be an object', rule)
  }
  if (typeof rule.id !== 'string' || rule.id.trim().length === 0) {
    throw new InvalidUniverseError('rule.id must be a non-empty string', rule.id)
  }
  if (typeof rule.name !== 'string' || rule.name.trim().length === 0) {
    throw new InvalidUniverseError('rule.name must be a non-empty string', rule.name)
  }
  if (typeof rule.priority !== 'number' || !Number.isFinite(rule.priority)) {
    throw new InvalidUniverseError('rule.priority must be a finite number', rule.priority)
  }
}

/**
 * @param {unknown} timeline
 * @throws {InvalidUniverseError}
 */
export function validateTimeline(timeline) {
  if (!Array.isArray(timeline)) {
    throw new InvalidUniverseError('timeline must be an array', timeline)
  }
  for (const entry of timeline) {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      throw new InvalidUniverseError('timeline entries must be non-empty strings', entry)
    }
  }
}
