/**
 * core/universe/Universe.js
 *
 * Single responsibility: represent one immutable narrative universe.
 *
 * Question: "What defines the world in which a narrative takes place?"
 *
 * Every write operation returns a NEW Universe.
 * Internal collections are never exposed directly.
 * snapshot() returns a fully frozen plain object.
 *
 * No dependency on Runtime, EventBus, Registry, Character or Pipeline.
 */

import { UniverseCollection }       from './UniverseCollection.js'
import { UniverseLocation }         from './UniverseLocation.js'
import { UniverseRule }             from './UniverseRule.js'
import { validateUniverse }         from './UniverseValidator.js'
import { InvalidUniverseError,
         DuplicateLocationError, LocationNotFoundError,
         DuplicateRuleError, RuleNotFoundError } from './UniverseError.js'

// ─── Universe ─────────────────────────────────────────────────────────────────

export class Universe {
  /**
   * @param {object}            identity  — { id, name, description?, lore?, tags?, metadata? }
   * @param {UniverseCollection} locations
   * @param {UniverseCollection} rules
   */
  constructor(identity, locations, rules) {
    validateUniverse({ id: identity.id, name: identity.name })

    if (!(locations instanceof UniverseCollection)) {
      throw new InvalidUniverseError('locations must be a UniverseCollection', locations)
    }
    if (!(rules instanceof UniverseCollection)) {
      throw new InvalidUniverseError('rules must be a UniverseCollection', rules)
    }

    this._identity  = Object.freeze({ ...identity })
    this._locations = locations
    this._rules     = rules
    Object.freeze(this)
  }

  // ─── Identity accessors ───────────────────────────────────────────────────────

  get id()          { return this._identity.id }
  get name()        { return this._identity.name }
  get description() { return this._identity.description ?? '' }
  get lore()        { return this._identity.lore ?? '' }
  get tags()        { return Object.freeze([...(this._identity.tags ?? [])]) }
  get metadata()    { return Object.freeze({ ...(this._identity.metadata ?? {}) }) }
  get locations()   { return this._locations }
  get rules()       { return this._rules }

  // ─── Write API ────────────────────────────────────────────────────────────────

  /**
   * @param {UniverseLocation} location
   * @returns {Universe}
   */
  addLocation(location) {
    if (!(location instanceof UniverseLocation)) {
      throw new InvalidUniverseError('location must be a UniverseLocation', location)
    }
    return new Universe(this._identity, this._locations.add(location), this._rules)
  }

  /**
   * @param {string} id
   * @returns {Universe}
   */
  removeLocation(id) {
    return new Universe(this._identity, this._locations.remove(id), this._rules)
  }

  /**
   * @param {UniverseRule} rule
   * @returns {Universe}
   */
  addRule(rule) {
    if (!(rule instanceof UniverseRule)) {
      throw new InvalidUniverseError('rule must be a UniverseRule', rule)
    }
    return new Universe(this._identity, this._locations, this._rules.add(rule))
  }

  /**
   * @param {string} id
   * @returns {Universe}
   */
  removeRule(id) {
    return new Universe(this._identity, this._locations, this._rules.remove(id))
  }

  // ─── Snapshot ─────────────────────────────────────────────────────────────────

  /** @returns {object} deep-frozen plain object */
  snapshot() {
    return Object.freeze({
      id          : this._identity.id,
      name        : this._identity.name,
      description : this._identity.description ?? '',
      lore        : this._identity.lore ?? '',
      tags        : Object.freeze([...(this._identity.tags ?? [])]),
      metadata    : Object.freeze({ ...(this._identity.metadata ?? {}) }),
      locations   : this._locations.map(l => Object.freeze({ id: l.id, name: l.name, description: l.description, metadata: l.metadata })),
      rules       : this._rules.map(r => Object.freeze({ id: r.id, name: r.name, description: r.description, priority: r.priority, enabled: r.enabled })),
    })
  }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

/**
 * Creates an empty Universe with the given identity.
 *
 * @param {object} identity
 * @returns {Universe}
 */
export function createUniverse(identity) {
  return new Universe(
    identity,
    new UniverseCollection([], DuplicateLocationError, LocationNotFoundError),
    new UniverseCollection([], DuplicateRuleError, RuleNotFoundError),
  )
}
