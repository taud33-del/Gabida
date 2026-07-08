/**
 * core/adventure/AdventureValidator.js
 *
 * Single responsibility: validate inputs to the Adventure system.
 *
 * Pure functions only. No classes. No side effects.
 */

import { ADVENTURE_STATUS }                           from './AdventureKeys.js'
import { InvalidAdventureError, InvalidStatusError }  from './AdventureError.js'

const VALID_STATUSES = Object.values(ADVENTURE_STATUS)

// ─── Throwing validators ──────────────────────────────────────────────────────

/**
 * @param {unknown} name
 * @throws {InvalidAdventureError}
 */
export function validateAdventureName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new InvalidAdventureError(`name must be a non-empty string, got: ${typeof name}`, name)
  }
}

/**
 * @param {unknown} status
 * @throws {InvalidStatusError}
 */
export function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new InvalidStatusError(status)
  }
}

/**
 * @param {unknown} adventure
 * @throws {InvalidAdventureError}
 */
export function validateAdventure(adventure) {
  if (adventure === null || typeof adventure !== 'object') {
    throw new InvalidAdventureError('adventure must be an object', adventure)
  }
  if (typeof adventure.id !== 'string' || adventure.id.trim().length === 0) {
    throw new InvalidAdventureError('adventure.id must be a non-empty string', adventure.id)
  }
  validateAdventureName(adventure.name)
}

/**
 * @param {unknown} objective
 * @throws {InvalidAdventureError}
 */
export function validateObjective(objective) {
  if (objective === null || typeof objective !== 'object') {
    throw new InvalidAdventureError('objective must be an object', objective)
  }
  if (typeof objective.id !== 'string' || objective.id.trim().length === 0) {
    throw new InvalidAdventureError('objective.id must be a non-empty string', objective.id)
  }
  if (typeof objective.title !== 'string' || objective.title.trim().length === 0) {
    throw new InvalidAdventureError('objective.title must be a non-empty string', objective.title)
  }
}
