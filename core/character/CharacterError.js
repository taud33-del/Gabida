/**
 * core/character/CharacterError.js
 *
 * Single responsibility: declare typed errors for the Character system.
 *
 * No logic. Declarations only.
 */

export class CharacterError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'CharacterError'
  }
}

export class InvalidCharacterError extends CharacterError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Invalid character: ${reason}`)
    this.name   = 'InvalidCharacterError'
    this.reason = reason
    this.value  = value
  }
}

export class DuplicateTraitError extends CharacterError {
  /** @param {string} name */
  constructor(name) {
    super(`Trait already exists: "${name}"`)
    this.name      = 'DuplicateTraitError'
    this.traitName = name
  }
}

export class RelationNotFoundError extends CharacterError {
  /** @param {string} id */
  constructor(id) {
    super(`Relation not found for id: "${id}"`)
    this.name = 'RelationNotFoundError'
    this.id   = id
  }
}

export class InvalidCharacterStateError extends CharacterError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Invalid character state: ${reason}`)
    this.name   = 'InvalidCharacterStateError'
    this.reason = reason
    this.value  = value
  }
}
