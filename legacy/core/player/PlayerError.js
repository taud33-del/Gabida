/**
 * core/player/PlayerError.js
 *
 * Single responsibility: declare typed errors for the Player system.
 *
 * No logic. Declarations only.
 */

export class PlayerError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'PlayerError'
  }
}

export class InvalidPlayerError extends PlayerError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Invalid player: ${reason}`)
    this.name   = 'InvalidPlayerError'
    this.reason = reason
    this.value  = value
  }
}

export class DuplicateItemError extends PlayerError {
  /** @param {string} id */
  constructor(id) {
    super(`Item already exists in inventory: "${id}"`)
    this.name = 'DuplicateItemError'
    this.id   = id
  }
}

export class ItemNotFoundError extends PlayerError {
  /** @param {string} id */
  constructor(id) {
    super(`Item not found in inventory: "${id}"`)
    this.name = 'ItemNotFoundError'
    this.id   = id
  }
}

export class InvalidStatsError extends PlayerError {
  /**
   * @param {string}  reason
   * @param {unknown} value
   */
  constructor(reason, value) {
    super(`Invalid player stats: ${reason}`)
    this.name   = 'InvalidStatsError'
    this.reason = reason
    this.value  = value
  }
}
