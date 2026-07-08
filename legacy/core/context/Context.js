/**
 * core/context/Context.js
 *
 * Single responsibility: represent the immutable execution context of one narrative run.
 *
 * Question: "What is the complete, frozen state of one execution at a given moment?"
 *
 * Context is the single object passed across Runtime, Modules, Pipeline and Memory.
 * Every modification produces a NEW Context — the original is never mutated.
 * Internal storage is never exposed directly.
 * All retrieved values are deep-frozen snapshots.
 *
 * Typed domain slots (player, character, universe, adventure, memory) are stored in a
 * separate _typed map so their class identity is preserved. The generic _data bag
 * continues to work exactly as before for all other keys.
 *
 * No dependency on Runtime, ModuleManager or EventBus.
 */

import { snapshot, clone } from './ContextSnapshot.js'
import { validateKey, validateValue, isContextObject } from './ContextValidator.js'
import { InvalidContextValueError } from './ContextError.js'
import {
  assertPlayer,
  assertCharacter,
  assertUniverse,
  assertAdventure,
  assertMemory,
} from './ContextTypedValidator.js'
import { CONTEXT_KEYS } from './ContextKeys.js'

// ─── Domain slot names (the five typed keys) ──────────────────────────────────

const TYPED_KEYS = Object.freeze([
  CONTEXT_KEYS.PLAYER,
  CONTEXT_KEYS.CHARACTER,
  CONTEXT_KEYS.UNIVERSE,
  CONTEXT_KEYS.ADVENTURE,
  CONTEXT_KEYS.MEMORY,
])

// ─── Context ──────────────────────────────────────────────────────────────────

export class Context {
  /**
   * @param {object} [initial]  — Initial key/value pairs for the generic bag.
   * @param {object} [typed]    — Pre-validated domain instances { player?, character?, universe?, adventure?, memory? }
   *                              Internal use only — do NOT pass from outside.
   */
  constructor(initial = {}, typed = {}) {
    /** @type {object} — generic k/v bag, plain values only, never exposed */
    this._data  = clone(initial)
    /** @type {object} — live domain instances, class identity preserved */
    this._typed = { ...typed }
    Object.freeze(this)
  }

  // ─── Internal factory (keeps both maps consistent) ────────────────────────────

  /** @private */
  _withData(nextData) {
    return new Context(nextData, this._typed)
  }

  /** @private */
  _withTyped(key, instance) {
    return new Context(this._data, { ...this._typed, [key]: instance })
  }

  /** @private */
  _withoutTyped(key) {
    const next = { ...this._typed }
    delete next[key]
    return new Context(this._data, next)
  }

  // ─── Read API ─────────────────────────────────────────────────────────────────

  /**
   * Returns a deep-frozen snapshot of the value stored under key.
   * For typed domain keys, returns the live instance directly (it is already frozen).
   * Returns undefined if the key is absent.
   *
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    validateKey(key)
    if (TYPED_KEYS.includes(key) && Object.prototype.hasOwnProperty.call(this._typed, key)) {
      return this._typed[key]
    }
    return snapshot(this._data[key])
  }

  /**
   * Returns true if the key exists in this context (either bag).
   *
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    validateKey(key)
    if (TYPED_KEYS.includes(key) && Object.prototype.hasOwnProperty.call(this._typed, key)) return true
    return Object.prototype.hasOwnProperty.call(this._data, key)
  }

  /**
   * Returns a frozen array of all keys present (generic + typed).
   *
   * @returns {string[]}
   */
  keys() {
    return Object.freeze([...Object.keys(this._data), ...Object.keys(this._typed)])
  }

  /**
   * Returns a frozen array of all values.
   * Generic values are deep-frozen snapshots; typed instances are returned as-is.
   *
   * @returns {*[]}
   */
  values() {
    const generic = Object.values(this._data).map(snapshot)
    const typed   = Object.values(this._typed)
    return Object.freeze([...generic, ...typed])
  }

  /**
   * Returns a frozen array of [key, value] pairs for all slots.
   *
   * @returns {Array<[string, *]>}
   */
  entries() {
    const generic = Object.entries(this._data).map(([k, v]) => Object.freeze([k, snapshot(v)]))
    const typed   = Object.entries(this._typed).map(([k, v]) => Object.freeze([k, v]))
    return Object.freeze([...generic, ...typed])
  }

  /**
   * Returns the total number of keys (generic + typed).
   *
   * @returns {number}
   */
  size() {
    return Object.keys(this._data).length + Object.keys(this._typed).length
  }

  /**
   * Returns a deep-frozen plain object copy of the generic bag only.
   * Typed domain instances are excluded (use snapshot() for the full picture).
   *
   * @returns {object}
   */
  toObject() {
    return snapshot(this._data)
  }

  // ─── Write API (returns new Context) ─────────────────────────────────────────

  /**
   * Returns a new Context with key set to value.
   * For typed domain keys use the typed helpers (withPlayer etc.) instead.
   *
   * @param {string} key
   * @param {*}      value
   * @returns {Context}
   */
  set(key, value) {
    validateKey(key)
    validateValue(key, value)
    if (TYPED_KEYS.includes(key)) {
      _assertTyped(key, value)
      return this._withTyped(key, value)
    }
    return this._withData({ ...this._data, [key]: clone(value) })
  }

  /**
   * Returns a new Context without the given key.
   *
   * @param {string} key
   * @returns {Context}
   */
  remove(key) {
    validateKey(key)
    if (TYPED_KEYS.includes(key)) return this._withoutTyped(key)
    const next = clone(this._data)
    delete next[key]
    return this._withData(next)
  }

  /**
   * Returns a new Context with all keys from obj merged into the generic bag.
   * Typed domain keys inside obj are ignored (use typed helpers instead).
   *
   * @param {object} obj
   * @returns {Context}
   */
  merge(obj) {
    const safe = {}
    for (const [k, v] of Object.entries(obj)) {
      if (!TYPED_KEYS.includes(k)) safe[k] = v
    }
    return this._withData({ ...this._data, ...clone(safe) })
  }

  /**
   * Returns a new Context with identical data.
   * Typed instances are shared (they are already immutable).
   *
   * @returns {Context}
   */
  clone() {
    return new Context(clone(this._data), { ...this._typed })
  }

  // ─── Typed getters ────────────────────────────────────────────────────────────

  /** @returns {import('../player/Player.js').Player | undefined} */
  getPlayer()    { return this._typed[CONTEXT_KEYS.PLAYER] }

  /** @returns {import('../character/Character.js').Character | undefined} */
  getCharacter() { return this._typed[CONTEXT_KEYS.CHARACTER] }

  /** @returns {import('../universe/Universe.js').Universe | undefined} */
  getUniverse()  { return this._typed[CONTEXT_KEYS.UNIVERSE] }

  /** @returns {import('../adventure/Adventure.js').Adventure | undefined} */
  getAdventure() { return this._typed[CONTEXT_KEYS.ADVENTURE] }

  /** @returns {import('../memory/Memory.js').Memory | undefined} */
  getMemory()    { return this._typed[CONTEXT_KEYS.MEMORY] }

  // ─── Typed setters (return NEW Context) ──────────────────────────────────────

  /** @param {import('../player/Player.js').Player} player @returns {Context} */
  withPlayer(player) {
    assertPlayer(player)
    return this._withTyped(CONTEXT_KEYS.PLAYER, player)
  }

  /** @param {import('../character/Character.js').Character} character @returns {Context} */
  withCharacter(character) {
    assertCharacter(character)
    return this._withTyped(CONTEXT_KEYS.CHARACTER, character)
  }

  /** @param {import('../universe/Universe.js').Universe} universe @returns {Context} */
  withUniverse(universe) {
    assertUniverse(universe)
    return this._withTyped(CONTEXT_KEYS.UNIVERSE, universe)
  }

  /** @param {import('../adventure/Adventure.js').Adventure} adventure @returns {Context} */
  withAdventure(adventure) {
    assertAdventure(adventure)
    return this._withTyped(CONTEXT_KEYS.ADVENTURE, adventure)
  }

  /** @param {import('../memory/Memory.js').Memory} memory @returns {Context} */
  withMemory(memory) {
    assertMemory(memory)
    return this._withTyped(CONTEXT_KEYS.MEMORY, memory)
  }

  // ─── Slots d'infrastructure (variables / flags / metadata) ───────────────────
  //
  // Accesseurs nommes vers des slots techniques plats du sac generique. Ils ne
  // modifient pas le modele de stockage : la lecture renvoie un snapshot gele,
  // l'ecriture retourne un nouveau Context. Aucun concept metier.

  /** @returns {object | undefined} */
  getVariables() { return this.get(CONTEXT_KEYS.VARIABLES) }

  /** @returns {object | undefined} */
  getFlags()     { return this.get(CONTEXT_KEYS.FLAGS) }

  /** @returns {object | undefined} */
  getMetadata()  { return this.get(CONTEXT_KEYS.METADATA) }

  /** @param {object} variables @returns {Context} */
  withVariables(variables) { return this._withInfraSlot(CONTEXT_KEYS.VARIABLES, variables) }

  /** @param {object} flags @returns {Context} */
  withFlags(flags)         { return this._withInfraSlot(CONTEXT_KEYS.FLAGS, flags) }

  /** @param {object} metadata @returns {Context} */
  withMetadata(metadata)   { return this._withInfraSlot(CONTEXT_KEYS.METADATA, metadata) }

  /**
   * Ecrit un slot d'infrastructure plat et retourne un nouveau Context.
   *
   * @private
   * @param {string} key
   * @param {object} value — doit etre un objet plat (ni null, ni tableau).
   * @returns {Context}
   * @throws {InvalidContextValueError}
   */
  _withInfraSlot(key, value) {
    if (!isContextObject(value)) {
      throw new InvalidContextValueError(key, value)
    }
    return this._withData({ ...this._data, [key]: clone(value) })
  }

  // ─── Snapshot ─────────────────────────────────────────────────────────────────

  /**
   * Returns a deep-frozen, JSON-serialisable plain object representing the full context.
   *
   * Each typed domain instance is serialised via its own snapshot() method.
   * Generic values are deep-cloned and frozen.
   * No live reference escapes.
   *
   * @returns {object}
   */
  snapshot() {
    const result = {}

    for (const [k, v] of Object.entries(this._data)) {
      result[k] = snapshot(v)
    }

    for (const [k, instance] of Object.entries(this._typed)) {
      result[k] = typeof instance.snapshot === 'function'
        ? instance.snapshot()
        : snapshot(instance)
    }

    return Object.freeze(result)
  }
}

// ─── Internal typed assertion dispatcher ─────────────────────────────────────

function _assertTyped(key, value) {
  switch (key) {
    case CONTEXT_KEYS.PLAYER:    assertPlayer(value);    break
    case CONTEXT_KEYS.CHARACTER: assertCharacter(value); break
    case CONTEXT_KEYS.UNIVERSE:  assertUniverse(value);  break
    case CONTEXT_KEYS.ADVENTURE: assertAdventure(value); break
    case CONTEXT_KEYS.MEMORY:    assertMemory(value);    break
  }
}
