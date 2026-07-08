/**
 * core/player/Player.js
 *
 * Single responsibility: represent one immutable player in a Gabida session.
 *
 * Question: "Who is the player and what do they carry right now?"
 *
 * Every write operation returns a NEW Player.
 * Internal components are never exposed directly.
 * snapshot() returns a fully frozen plain object.
 *
 * No dependency on Runtime, EventBus, Registry, Character, Adventure, Universe or Pipeline.
 */

import { PlayerInventory }  from './PlayerInventory.js'
import { PlayerStats }      from './PlayerStats.js'
import { PlayerFlags }      from './PlayerFlags.js'
import { validatePlayer }   from './PlayerValidator.js'
import { InvalidPlayerError } from './PlayerError.js'

// ─── Player ───────────────────────────────────────────────────────────────────

export class Player {
  /**
   * @param {object}          identity  — { id, name, description?, role?, tags?, metadata? }
   * @param {PlayerStats}     stats
   * @param {PlayerInventory} inventory
   * @param {PlayerFlags}     flags
   */
  constructor(identity, stats, inventory, flags) {
    validatePlayer({ id: identity.id, name: identity.name })

    if (!(stats instanceof PlayerStats))         throw new InvalidPlayerError('stats must be a PlayerStats', stats)
    if (!(inventory instanceof PlayerInventory)) throw new InvalidPlayerError('inventory must be a PlayerInventory', inventory)
    if (!(flags instanceof PlayerFlags))         throw new InvalidPlayerError('flags must be a PlayerFlags', flags)

    this._identity  = Object.freeze({ ...identity })
    this._stats     = stats
    this._inventory = inventory
    this._flags     = flags
    Object.freeze(this)
  }

  // ─── Identity accessors ───────────────────────────────────────────────────────

  get id()          { return this._identity.id }
  get name()        { return this._identity.name }
  get description() { return this._identity.description ?? '' }
  get role()        { return this._identity.role ?? null }
  get tags()        { return Object.freeze([...(this._identity.tags ?? [])]) }
  get metadata()    { return Object.freeze({ ...(this._identity.metadata ?? {}) }) }
  get stats()       { return this._stats }
  get inventory()   { return this._inventory }
  get flags()       { return this._flags }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * @param {object} item
   * @returns {Player}
   */
  addItem(item) {
    return new Player(this._identity, this._stats, this._inventory.add(item), this._flags)
  }

  /**
   * @param {string} id
   * @returns {Player}
   */
  removeItem(id) {
    return new Player(this._identity, this._stats, this._inventory.remove(id), this._flags)
  }

  /**
   * @param {PlayerStats} newStats
   * @returns {Player}
   */
  updateStats(newStats) {
    if (!(newStats instanceof PlayerStats)) throw new InvalidPlayerError('stats must be a PlayerStats', newStats)
    return new Player(this._identity, newStats, this._inventory, this._flags)
  }

  /**
   * @param {string}  key
   * @param {unknown} value
   * @returns {Player}
   */
  setFlag(key, value) {
    return new Player(this._identity, this._stats, this._inventory, this._flags.set(key, value))
  }

  /**
   * @param {string} key
   * @returns {Player}
   */
  removeFlag(key) {
    return new Player(this._identity, this._stats, this._inventory, this._flags.remove(key))
  }

  // ─── Snapshot ─────────────────────────────────────────────────────────────────

  /** @returns {object} deep-frozen plain object */
  snapshot() {
    return Object.freeze({
      id          : this._identity.id,
      name        : this._identity.name,
      description : this._identity.description ?? '',
      role        : this._identity.role ?? null,
      tags        : Object.freeze([...(this._identity.tags ?? [])]),
      metadata    : Object.freeze({ ...(this._identity.metadata ?? {}) }),
      stats       : Object.freeze({
        level      : this._stats.level,
        experience : this._stats.experience,
        attributes : this._stats.attributes,
        metadata   : this._stats.metadata,
      }),
      inventory   : this._inventory.map(item => Object.freeze({ ...item })),
      flags       : Object.freeze({ ...Object.fromEntries(this._flags.entries()) }),
    })
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

/**
 * Creates a fresh Player with default stats, empty inventory and empty flags.
 *
 * @param {object} identity
 * @returns {Player}
 */
export function createPlayer(identity) {
  return new Player(identity, new PlayerStats(), new PlayerInventory(), new PlayerFlags())
}
