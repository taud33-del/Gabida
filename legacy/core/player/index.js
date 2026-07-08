/**
 * core/player/index.js
 *
 * Single entry point for the player sub-module.
 * This file defines nothing — it only re-exports.
 */

export { Player, createPlayer }                        from './Player.js'
export { PlayerInventory }                             from './PlayerInventory.js'
export { PlayerStats }                                 from './PlayerStats.js'
export { PlayerFlags }                                 from './PlayerFlags.js'
export { PLAYER_KEYS }                                 from './PlayerKeys.js'
export {
  validatePlayer,
  validatePlayerName,
  validateStats,
  validateInventory,
  validateFlags,
}                                                      from './PlayerValidator.js'
export {
  PlayerError,
  InvalidPlayerError,
  DuplicateItemError,
  ItemNotFoundError,
  InvalidStatsError,
}                                                      from './PlayerError.js'
