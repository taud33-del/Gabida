/**
 * core/character/CharacterValidator.js
 *
 * Single responsibility: validate inputs to the Character system.
 *
 * Pure functions only. No classes. No side effects.
 * Throwing functions raise typed errors.
 */

import { InvalidCharacterError } from './CharacterError.js'

// ─── Throwing validators ──────────────────────────────────────────────────────

/**
 * @param {unknown} id
 * @throws {InvalidCharacterError}
 */
export function validateId(id) {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new InvalidCharacterError(`id must be a non-empty string, got: ${typeof id}`, id)
  }
}

/**
 * @param {unknown} name
 * @throws {InvalidCharacterError}
 */
export function validateName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new InvalidCharacterError(`name must be a non-empty string, got: ${typeof name}`, name)
  }
}

/**
 * @param {string}  traitName
 * @param {unknown} value
 * @throws {InvalidCharacterError}
 */
export function validateTrait(traitName, value) {
  if (typeof traitName !== 'string' || traitName.trim().length === 0) {
    throw new InvalidCharacterError(`trait name must be a non-empty string`, traitName)
  }
  if (value === undefined) {
    throw new InvalidCharacterError(`trait value must not be undefined`, value)
  }
}

/**
 * @param {string}  id
 * @param {unknown} relation
 * @throws {InvalidCharacterError}
 */
export function validateRelation(id, relation) {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new InvalidCharacterError(`relation id must be a non-empty string`, id)
  }
  if (relation === null || typeof relation !== 'object') {
    throw new InvalidCharacterError(`relation must be a plain object`, relation)
  }
}

/**
 * @param {unknown} character
 * @throws {InvalidCharacterError}
 */
export function validateCharacter(character) {
  if (character === null || typeof character !== 'object') {
    throw new InvalidCharacterError('character must be an object', character)
  }
  validateId(character.id)
  validateName(character.name)
}
