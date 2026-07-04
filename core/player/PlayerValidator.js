/**
 * core/player/PlayerValidator.js
 *
 * Single responsibility: validate inputs to the Player system.
 *
 * Pure functions only. No classes. No side effects.
 */

import { InvalidPlayerError, InvalidStatsError } from './PlayerError.js'

// ─── Throwing validators ──────────────────────────────────────────────────────

/**
 * @param {unknown} name
 * @throws {InvalidPlayerError}
 */
export function validatePlayerName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new InvalidPlayerError(`name must be a non-empty string, got: ${typeof name}`, name)
  }
}

/**
 * @param {unknown} player
 * @throws {InvalidPlayerError}
 */
export function validatePlayer(player) {
  if (player === null || typeof player !== 'object') {
    throw new InvalidPlayerError('player must be an object', player)
  }
  if (typeof player.id !== 'string' || player.id.trim().length === 0) {
    throw new InvalidPlayerError('player.id must be a non-empty string', player.id)
  }
  validatePlayerName(player.name)
}

/**
 * @param {unknown} stats
 * @throws {InvalidStatsError}
 */
export function validateStats(stats) {
  if (stats === null || typeof stats !== 'object') {
    throw new InvalidStatsError('stats must be an object', stats)
  }
  if (typeof stats.level !== 'number' || !Number.isInteger(stats.level) || stats.level < 0) {
    throw new InvalidStatsError('stats.level must be a non-negative integer', stats.level)
  }
  if (typeof stats.experience !== 'number' || !Number.isFinite(stats.experience) || stats.experience < 0) {
    throw new InvalidStatsError('stats.experience must be a non-negative number', stats.experience)
  }
}

/**
 * @param {unknown} inventory
 * @throws {InvalidPlayerError}
 */
export function validateInventory(inventory) {
  if (!Array.isArray(inventory)) {
    throw new InvalidPlayerError('inventory must be an array', inventory)
  }
  for (const item of inventory) {
    if (item === null || typeof item !== 'object' || typeof item.id !== 'string' || item.id.trim().length === 0) {
      throw new InvalidPlayerError('each inventory item must be an object with a non-empty string id', item)
    }
  }
}

/**
 * @param {unknown} flags
 * @throws {InvalidPlayerError}
 */
export function validateFlags(flags) {
  if (flags === null || typeof flags !== 'object' || Array.isArray(flags)) {
    throw new InvalidPlayerError('flags must be a plain object', flags)
  }
}
