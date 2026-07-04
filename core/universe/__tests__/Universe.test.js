/**
 * core/universe/__tests__/Universe.test.js
 *
 * Exhaustive tests for the Universe system.
 *
 * Coverage:
 *   - UNIVERSE_KEYS        : constants, frozen
 *   - UniverseError        : typed hierarchy, properties
 *   - UniverseValidator    : validateUniverse, validateUniverseName, validateLocation, validateRule, validateTimeline
 *   - UniverseLocation     : construction, frozen, invalid inputs
 *   - UniverseRule         : construction, frozen, defaults, invalid inputs
 *   - UniverseCollection   : add, remove, get, has, size, getAll, filter, map, sort, immutability, errors
 *   - Universe             : createUniverse, identity accessors, addLocation, removeLocation,
 *                            addRule, removeRule, snapshot, immutability, errors
 */

import { UNIVERSE_KEYS }          from '../UniverseKeys.js'
import {
  UniverseError,
  InvalidUniverseError,
  DuplicateLocationError,
  LocationNotFoundError,
  DuplicateRuleError,
  RuleNotFoundError,
}                                 from '../UniverseError.js'
import {
  validateUniverse,
  validateUniverseName,
  validateLocation,
  validateRule,
  validateTimeline,
}                                 from '../UniverseValidator.js'
import { UniverseLocation }       from '../UniverseLocation.js'
import { UniverseRule }           from '../UniverseRule.js'
import { UniverseCollection }     from '../UniverseCollection.js'
import { Universe, createUniverse } from '../Universe.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeUniverse = (overrides = {}) =>
  createUniverse({ id: 'u1', name: 'Middle Earth', ...overrides })

const makeLocation = (overrides = {}) =>
  new UniverseLocation({ id: 'loc1', name: 'The Shire', ...overrides })

const makeRule = (overrides = {}) =>
  new UniverseRule({ id: 'r1', name: 'No magic without cost', priority: 10, ...overrides })

const makeCollection = () =>
  new UniverseCollection([], DuplicateLocationError, LocationNotFoundError)

// ─── UNIVERSE_KEYS ────────────────────────────────────────────────────────────

describe('UNIVERSE_KEYS', () => {
  test('declares ID',          () => expect(typeof UNIVERSE_KEYS.ID).toBe('string'))
  test('declares NAME',        () => expect(typeof UNIVERSE_KEYS.NAME).toBe('string'))
  test('declares DESCRIPTION', () => expect(typeof UNIVERSE_KEYS.DESCRIPTION).toBe('string'))
  test('declares LORE',        () => expect(typeof UNIVERSE_KEYS.LORE).toBe('string'))
  test('declares LOCATIONS',   () => expect(typeof UNIVERSE_KEYS.LOCATIONS).toBe('string'))
  test('declares RULES',       () => expect(typeof UNIVERSE_KEYS.RULES).toBe('string'))
  test('declares TIMELINE',    () => expect(typeof UNIVERSE_KEYS.TIMELINE).toBe('string'))
  test('declares WEATHER',     () => expect(typeof UNIVERSE_KEYS.WEATHER).toBe('string'))
  test('declares FACTIONS',    () => expect(typeof UNIVERSE_KEYS.FACTIONS).toBe('string'))
  test('declares LANGUAGES',   () => expect(typeof UNIVERSE_KEYS.LANGUAGES).toBe('string'))
  test('declares METADATA',    () => expect(typeof UNIVERSE_KEYS.METADATA).toBe('string'))
  test('declares TAGS',        () => expect(typeof UNIVERSE_KEYS.TAGS).toBe('string'))
  test('is frozen',            () => expect(Object.isFrozen(UNIVERSE_KEYS)).toBe(true))
})

// ─── UniverseError ────────────────────────────────────────────────────────────

describe('UniverseError', () => {
  test('InvalidUniverseError extends UniverseError',   () => expect(new InvalidUniverseError('r', null)).toBeInstanceOf(UniverseError))
  test('DuplicateLocationError extends UniverseError', () => expect(new DuplicateLocationError('x')).toBeInstanceOf(UniverseError))
  test('LocationNotFoundError extends UniverseError',  () => expect(new LocationNotFoundError('x')).toBeInstanceOf(UniverseError))
  test('DuplicateRuleError extends UniverseError',     () => expect(new DuplicateRuleError('x')).toBeInstanceOf(UniverseError))
  test('RuleNotFoundError extends UniverseError',      () => expect(new RuleNotFoundError('x')).toBeInstanceOf(UniverseError))

  test('DuplicateLocationError stores id', () => expect(new DuplicateLocationError('loc1').id).toBe('loc1'))
  test('LocationNotFoundError stores id',  () => expect(new LocationNotFoundError('loc1').id).toBe('loc1'))
  test('DuplicateRuleError stores id',     () => expect(new DuplicateRuleError('r1').id).toBe('r1'))
  test('RuleNotFoundError stores id',      () => expect(new RuleNotFoundError('r1').id).toBe('r1'))
  test('InvalidUniverseError stores reason and value', () => {
    const err = new InvalidUniverseError('bad', null)
    expect(err.reason).toBe('bad')
    expect(err.value).toBeNull()
  })
})

// ─── UniverseValidator ────────────────────────────────────────────────────────

describe('UniverseValidator', () => {
  describe('validateUniverseName', () => {
    test('accepts non-empty string',   () => expect(() => validateUniverseName('Earth')).not.toThrow())
    test('rejects empty string',       () => expect(() => validateUniverseName('')).toThrow(InvalidUniverseError))
    test('rejects null',               () => expect(() => validateUniverseName(null)).toThrow(InvalidUniverseError))
    test('rejects number',             () => expect(() => validateUniverseName(42)).toThrow(InvalidUniverseError))
  })

  describe('validateUniverse', () => {
    test('accepts valid object',       () => expect(() => validateUniverse({ id: 'u1', name: 'Earth' })).not.toThrow())
    test('rejects null',               () => expect(() => validateUniverse(null)).toThrow(InvalidUniverseError))
    test('rejects missing id',         () => expect(() => validateUniverse({ name: 'Earth' })).toThrow(InvalidUniverseError))
    test('rejects empty id',           () => expect(() => validateUniverse({ id: '', name: 'Earth' })).toThrow(InvalidUniverseError))
    test('rejects missing name',       () => expect(() => validateUniverse({ id: 'u1' })).toThrow(InvalidUniverseError))
  })

  describe('validateLocation', () => {
    test('accepts valid location',     () => expect(() => validateLocation({ id: 'l1', name: 'Forest' })).not.toThrow())
    test('rejects null',               () => expect(() => validateLocation(null)).toThrow(InvalidUniverseError))
    test('rejects empty id',           () => expect(() => validateLocation({ id: '', name: 'Forest' })).toThrow(InvalidUniverseError))
    test('rejects empty name',         () => expect(() => validateLocation({ id: 'l1', name: '' })).toThrow(InvalidUniverseError))
  })

  describe('validateRule', () => {
    test('accepts valid rule',         () => expect(() => validateRule({ id: 'r1', name: 'Law', priority: 5 })).not.toThrow())
    test('rejects null',               () => expect(() => validateRule(null)).toThrow(InvalidUniverseError))
    test('rejects empty id',           () => expect(() => validateRule({ id: '', name: 'Law', priority: 0 })).toThrow(InvalidUniverseError))
    test('rejects non-finite priority', () => expect(() => validateRule({ id: 'r1', name: 'Law', priority: NaN })).toThrow(InvalidUniverseError))
  })

  describe('validateTimeline', () => {
    test('accepts array of strings',   () => expect(() => validateTimeline(['Age 1', 'Age 2'])).not.toThrow())
    test('accepts empty array',        () => expect(() => validateTimeline([])).not.toThrow())
    test('rejects non-array',          () => expect(() => validateTimeline('history')).toThrow(InvalidUniverseError))
    test('rejects array with empty string', () => expect(() => validateTimeline([''])).toThrow(InvalidUniverseError))
  })
})

// ─── UniverseLocation ────────────────────────────────────────────────────────

describe('UniverseLocation', () => {
  test('constructs successfully',       () => expect(() => makeLocation()).not.toThrow())
  test('is frozen',                     () => expect(Object.isFrozen(makeLocation())).toBe(true))
  test('exposes id and name',           () => { const l = makeLocation(); expect(l.id).toBe('loc1'); expect(l.name).toBe('The Shire') })
  test('description defaults to empty', () => expect(makeLocation().description).toBe(''))
  test('metadata is frozen',            () => expect(Object.isFrozen(makeLocation().metadata)).toBe(true))
  test('accepts metadata',              () => {
    const l = makeLocation({ metadata: { region: 'west' } })
    expect(l.metadata.region).toBe('west')
  })
  test('rejects empty id',              () => expect(() => makeLocation({ id: '' })).toThrow(InvalidUniverseError))
  test('rejects empty name',            () => expect(() => makeLocation({ name: '' })).toThrow(InvalidUniverseError))
})

// ─── UniverseRule ────────────────────────────────────────────────────────────

describe('UniverseRule', () => {
  test('constructs successfully',       () => expect(() => makeRule()).not.toThrow())
  test('is frozen',                     () => expect(Object.isFrozen(makeRule())).toBe(true))
  test('exposes id, name, priority',    () => {
    const r = makeRule()
    expect(r.id).toBe('r1')
    expect(r.name).toBe('No magic without cost')
    expect(r.priority).toBe(10)
  })
  test('enabled defaults to true',      () => expect(makeRule().enabled).toBe(true))
  test('description defaults to empty', () => expect(makeRule().description).toBe(''))
  test('accepts enabled: false',        () => expect(makeRule({ enabled: false }).enabled).toBe(false))
  test('rejects empty id',              () => expect(() => makeRule({ id: '' })).toThrow(InvalidUniverseError))
  test('rejects NaN priority',          () => expect(() => makeRule({ priority: NaN })).toThrow(InvalidUniverseError))
})

// ─── UniverseCollection ──────────────────────────────────────────────────────

describe('UniverseCollection', () => {
  let col

  beforeEach(() => { col = makeCollection() })

  test('starts empty',     () => expect(col.size()).toBe(0))
  test('is frozen',        () => expect(Object.isFrozen(col)).toBe(true))
  test('requires DuplicateError and NotFoundError', () =>
    expect(() => new UniverseCollection([])).toThrow(InvalidUniverseError))

  describe('add()', () => {
    test('returns new collection',       () => expect(col.add(makeLocation())).not.toBe(col))
    test('new collection has item',      () => expect(col.add(makeLocation()).has('loc1')).toBe(true))
    test('original unchanged',           () => { col.add(makeLocation()); expect(col.size()).toBe(0) })
    test('throws DuplicateLocationError',() => {
      expect(() => col.add(makeLocation()).add(makeLocation())).toThrow(DuplicateLocationError)
    })
    test('rejects item without id',      () => expect(() => col.add({ name: 'x' })).toThrow(InvalidUniverseError))
  })

  describe('remove()', () => {
    test('returns new collection without item', () => expect(col.add(makeLocation()).remove('loc1').has('loc1')).toBe(false))
    test('throws LocationNotFoundError',        () => expect(() => col.remove('nope')).toThrow(LocationNotFoundError))
    test('original unchanged',                  () => {
      const c = col.add(makeLocation())
      c.remove('loc1')
      expect(c.has('loc1')).toBe(true)
    })
  })

  describe('get()', () => {
    test('returns item for known id',    () => expect(col.add(makeLocation()).get('loc1')).toBeInstanceOf(UniverseLocation))
    test('returns undefined for absent', () => expect(col.get('x')).toBeUndefined())
  })

  describe('getAll()', () => {
    test('returns frozen array',         () => expect(Object.isFrozen(col.getAll())).toBe(true))
    test('preserves insertion order',    () => {
      const l1 = makeLocation({ id: 'a', name: 'A' })
      const l2 = makeLocation({ id: 'b', name: 'B' })
      const c  = col.add(l1).add(l2)
      expect(c.getAll().map(l => l.id)).toEqual(['a', 'b'])
    })
  })

  describe('filter()', () => {
    test('returns frozen filtered array', () => {
      const c = col.add(makeLocation({ id: 'a', name: 'A' })).add(makeLocation({ id: 'b', name: 'B' }))
      const f = c.filter(l => l.id === 'a')
      expect(f.length).toBe(1)
      expect(Object.isFrozen(f)).toBe(true)
    })
  })

  describe('map()', () => {
    test('returns frozen mapped array', () => {
      const c   = col.add(makeLocation())
      const ids = c.map(l => l.id)
      expect(ids).toEqual(['loc1'])
      expect(Object.isFrozen(ids)).toBe(true)
    })
  })

  describe('sort()', () => {
    test('returns frozen sorted copy', () => {
      const l1 = makeLocation({ id: 'b', name: 'B' })
      const l2 = makeLocation({ id: 'a', name: 'A' })
      const c  = col.add(l1).add(l2)
      const sorted = c.sort((a, b) => a.id.localeCompare(b.id))
      expect(sorted[0].id).toBe('a')
      expect(Object.isFrozen(sorted)).toBe(true)
    })
    test('does not mutate internal order', () => {
      const l1 = makeLocation({ id: 'b', name: 'B' })
      const l2 = makeLocation({ id: 'a', name: 'A' })
      const c  = col.add(l1).add(l2)
      c.sort((a, b) => a.id.localeCompare(b.id))
      expect(c.getAll()[0].id).toBe('b')
    })
  })
})

// ─── Universe ─────────────────────────────────────────────────────────────────

describe('Universe', () => {
  test('creates successfully via createUniverse', () => expect(() => makeUniverse()).not.toThrow())
  test('is frozen',                               () => expect(Object.isFrozen(makeUniverse())).toBe(true))
  test('exposes id and name',                     () => { const u = makeUniverse(); expect(u.id).toBe('u1'); expect(u.name).toBe('Middle Earth') })
  test('description defaults to empty',           () => expect(makeUniverse().description).toBe(''))
  test('lore defaults to empty',                  () => expect(makeUniverse().lore).toBe(''))
  test('tags defaults to frozen []',              () => { const t = makeUniverse().tags; expect(t).toEqual([]); expect(Object.isFrozen(t)).toBe(true) })
  test('metadata defaults to frozen {}',          () => expect(Object.isFrozen(makeUniverse().metadata)).toBe(true))

  test('rejects invalid locations type', () =>
    expect(() => new Universe({ id: 'u1', name: 'E' }, {}, new UniverseCollection([], DuplicateRuleError, RuleNotFoundError)))
      .toThrow(InvalidUniverseError))
  test('rejects invalid rules type', () =>
    expect(() => new Universe({ id: 'u1', name: 'E' }, new UniverseCollection([], DuplicateLocationError, LocationNotFoundError), {}))
      .toThrow(InvalidUniverseError))

  describe('addLocation()', () => {
    test('returns new Universe with location', () => expect(makeUniverse().addLocation(makeLocation()).locations.has('loc1')).toBe(true))
    test('original unchanged',                 () => { const u = makeUniverse(); u.addLocation(makeLocation()); expect(u.locations.size()).toBe(0) })
    test('throws DuplicateLocationError',      () => {
      const u = makeUniverse().addLocation(makeLocation())
      expect(() => u.addLocation(makeLocation())).toThrow(DuplicateLocationError)
    })
    test('rejects non-UniverseLocation',       () => expect(() => makeUniverse().addLocation({ id: 'x' })).toThrow(InvalidUniverseError))
  })

  describe('removeLocation()', () => {
    test('removes location',                   () => expect(makeUniverse().addLocation(makeLocation()).removeLocation('loc1').locations.has('loc1')).toBe(false))
    test('throws LocationNotFoundError',       () => expect(() => makeUniverse().removeLocation('nope')).toThrow(LocationNotFoundError))
    test('original unchanged',                 () => {
      const u = makeUniverse().addLocation(makeLocation())
      u.removeLocation('loc1')
      expect(u.locations.has('loc1')).toBe(true)
    })
  })

  describe('addRule()', () => {
    test('returns new Universe with rule',     () => expect(makeUniverse().addRule(makeRule()).rules.has('r1')).toBe(true))
    test('original unchanged',                 () => { const u = makeUniverse(); u.addRule(makeRule()); expect(u.rules.size()).toBe(0) })
    test('throws DuplicateRuleError',          () => {
      const u = makeUniverse().addRule(makeRule())
      expect(() => u.addRule(makeRule())).toThrow(DuplicateRuleError)
    })
    test('rejects non-UniverseRule',           () => expect(() => makeUniverse().addRule({ id: 'x' })).toThrow(InvalidUniverseError))
  })

  describe('removeRule()', () => {
    test('removes rule',                       () => expect(makeUniverse().addRule(makeRule()).removeRule('r1').rules.has('r1')).toBe(false))
    test('throws RuleNotFoundError',           () => expect(() => makeUniverse().removeRule('nope')).toThrow(RuleNotFoundError))
  })

  describe('snapshot()', () => {
    test('returns frozen plain object',        () => expect(Object.isFrozen(makeUniverse().snapshot())).toBe(true))
    test('contains id, name, locations, rules', () => {
      const snap = makeUniverse().snapshot()
      expect(snap.id).toBe('u1')
      expect(snap.name).toBe('Middle Earth')
      expect(snap.locations).toEqual([])
      expect(snap.rules).toEqual([])
    })
    test('includes location data',             () => {
      const snap = makeUniverse().addLocation(makeLocation()).snapshot()
      expect(snap.locations[0].id).toBe('loc1')
      expect(snap.locations[0].name).toBe('The Shire')
    })
    test('includes rule data',                 () => {
      const snap = makeUniverse().addRule(makeRule()).snapshot()
      expect(snap.rules[0].id).toBe('r1')
      expect(snap.rules[0].priority).toBe(10)
    })
    test('locations array is frozen',          () => expect(Object.isFrozen(makeUniverse().snapshot().locations)).toBe(true))
    test('rules array is frozen',              () => expect(Object.isFrozen(makeUniverse().snapshot().rules)).toBe(true))
  })

  describe('immutability', () => {
    test('chain of addLocation/removeLocation is correct', () => {
      const loc2 = makeLocation({ id: 'loc2', name: 'Rivendell' })
      const u = makeUniverse().addLocation(makeLocation()).addLocation(loc2).removeLocation('loc1')
      expect(u.locations.has('loc1')).toBe(false)
      expect(u.locations.has('loc2')).toBe(true)
    })
    test('cannot assign to Universe directly', () => {
      const u = makeUniverse()
      expect(() => { u.foo = 'bar' }).toThrow()
    })
  })
})
