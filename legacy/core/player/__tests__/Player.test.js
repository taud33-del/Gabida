/**
 * core/player/__tests__/Player.test.js
 *
 * Exhaustive tests for the Player system.
 *
 * Coverage:
 *   - PLAYER_KEYS       : constants, frozen
 *   - PlayerError       : typed hierarchy, properties
 *   - PlayerValidator   : validatePlayer, validatePlayerName, validateStats, validateInventory, validateFlags
 *   - PlayerStats       : construction, frozen, defaults, invalid inputs
 *   - PlayerFlags       : set, remove, get, has, keys, values, entries, size, immutability
 *   - PlayerInventory   : add, remove, get, has, size, getAll, filter, map, sort, immutability
 *   - Player            : createPlayer, accessors, addItem, removeItem, updateStats,
 *                         setFlag, removeFlag, snapshot, immutability, errors
 */

import { PLAYER_KEYS }           from '../PlayerKeys.js'
import {
  PlayerError,
  InvalidPlayerError,
  DuplicateItemError,
  ItemNotFoundError,
  InvalidStatsError,
}                                from '../PlayerError.js'
import {
  validatePlayer,
  validatePlayerName,
  validateStats,
  validateInventory,
  validateFlags,
}                                from '../PlayerValidator.js'
import { PlayerStats }           from '../PlayerStats.js'
import { PlayerFlags }           from '../PlayerFlags.js'
import { PlayerInventory }       from '../PlayerInventory.js'
import { Player, createPlayer }  from '../Player.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeItem   = (overrides = {}) => ({ id: 'item1', name: 'Sword', ...overrides })
const makePlayer = (overrides = {}) => createPlayer({ id: 'p1', name: 'Hero', ...overrides })

// ─── PLAYER_KEYS ─────────────────────────────────────────────────────────────

describe('PLAYER_KEYS', () => {
  test('declares ID',          () => expect(typeof PLAYER_KEYS.ID).toBe('string'))
  test('declares NAME',        () => expect(typeof PLAYER_KEYS.NAME).toBe('string'))
  test('declares DESCRIPTION', () => expect(typeof PLAYER_KEYS.DESCRIPTION).toBe('string'))
  test('declares STATS',       () => expect(typeof PLAYER_KEYS.STATS).toBe('string'))
  test('declares INVENTORY',   () => expect(typeof PLAYER_KEYS.INVENTORY).toBe('string'))
  test('declares FLAGS',       () => expect(typeof PLAYER_KEYS.FLAGS).toBe('string'))
  test('declares METADATA',    () => expect(typeof PLAYER_KEYS.METADATA).toBe('string'))
  test('declares LEVEL',       () => expect(typeof PLAYER_KEYS.LEVEL).toBe('string'))
  test('declares EXPERIENCE',  () => expect(typeof PLAYER_KEYS.EXPERIENCE).toBe('string'))
  test('declares ROLE',        () => expect(typeof PLAYER_KEYS.ROLE).toBe('string'))
  test('declares PROFILE',     () => expect(typeof PLAYER_KEYS.PROFILE).toBe('string'))
  test('declares TAGS',        () => expect(typeof PLAYER_KEYS.TAGS).toBe('string'))
  test('declares STATUS',      () => expect(typeof PLAYER_KEYS.STATUS).toBe('string'))
  test('is frozen',            () => expect(Object.isFrozen(PLAYER_KEYS)).toBe(true))
})

// ─── PlayerError ─────────────────────────────────────────────────────────────

describe('PlayerError', () => {
  test('InvalidPlayerError extends PlayerError',  () => expect(new InvalidPlayerError('r', null)).toBeInstanceOf(PlayerError))
  test('DuplicateItemError extends PlayerError',  () => expect(new DuplicateItemError('x')).toBeInstanceOf(PlayerError))
  test('ItemNotFoundError extends PlayerError',   () => expect(new ItemNotFoundError('x')).toBeInstanceOf(PlayerError))
  test('InvalidStatsError extends PlayerError',   () => expect(new InvalidStatsError('r', null)).toBeInstanceOf(PlayerError))

  test('DuplicateItemError stores id',            () => expect(new DuplicateItemError('item1').id).toBe('item1'))
  test('ItemNotFoundError stores id',             () => expect(new ItemNotFoundError('item1').id).toBe('item1'))
  test('InvalidPlayerError stores reason/value',  () => { const e = new InvalidPlayerError('bad', null); expect(e.reason).toBe('bad'); expect(e.value).toBeNull() })
  test('InvalidStatsError stores reason/value',   () => { const e = new InvalidStatsError('bad', -1); expect(e.reason).toBe('bad'); expect(e.value).toBe(-1) })
})

// ─── PlayerValidator ─────────────────────────────────────────────────────────

describe('PlayerValidator', () => {
  describe('validatePlayerName', () => {
    test('accepts non-empty string',   () => expect(() => validatePlayerName('Hero')).not.toThrow())
    test('rejects empty string',       () => expect(() => validatePlayerName('')).toThrow(InvalidPlayerError))
    test('rejects null',               () => expect(() => validatePlayerName(null)).toThrow(InvalidPlayerError))
    test('rejects number',             () => expect(() => validatePlayerName(42)).toThrow(InvalidPlayerError))
  })

  describe('validatePlayer', () => {
    test('accepts valid object',       () => expect(() => validatePlayer({ id: 'p1', name: 'Hero' })).not.toThrow())
    test('rejects null',               () => expect(() => validatePlayer(null)).toThrow(InvalidPlayerError))
    test('rejects missing id',         () => expect(() => validatePlayer({ name: 'Hero' })).toThrow(InvalidPlayerError))
    test('rejects empty id',           () => expect(() => validatePlayer({ id: '', name: 'Hero' })).toThrow(InvalidPlayerError))
    test('rejects missing name',       () => expect(() => validatePlayer({ id: 'p1' })).toThrow(InvalidPlayerError))
  })

  describe('validateStats', () => {
    test('accepts valid stats',        () => expect(() => validateStats({ level: 1, experience: 0 })).not.toThrow())
    test('rejects null',               () => expect(() => validateStats(null)).toThrow(InvalidStatsError))
    test('rejects negative level',     () => expect(() => validateStats({ level: -1, experience: 0 })).toThrow(InvalidStatsError))
    test('rejects float level',        () => expect(() => validateStats({ level: 1.5, experience: 0 })).toThrow(InvalidStatsError))
    test('rejects negative experience',() => expect(() => validateStats({ level: 1, experience: -10 })).toThrow(InvalidStatsError))
    test('rejects NaN experience',     () => expect(() => validateStats({ level: 1, experience: NaN })).toThrow(InvalidStatsError))
  })

  describe('validateInventory', () => {
    test('accepts empty array',        () => expect(() => validateInventory([])).not.toThrow())
    test('accepts array of items',     () => expect(() => validateInventory([{ id: 'x' }])).not.toThrow())
    test('rejects non-array',          () => expect(() => validateInventory(null)).toThrow(InvalidPlayerError))
    test('rejects item without id',    () => expect(() => validateInventory([{ name: 'Sword' }])).toThrow(InvalidPlayerError))
    test('rejects item with empty id', () => expect(() => validateInventory([{ id: '' }])).toThrow(InvalidPlayerError))
  })

  describe('validateFlags', () => {
    test('accepts empty object',       () => expect(() => validateFlags({})).not.toThrow())
    test('accepts object with values', () => expect(() => validateFlags({ hasKey: true })).not.toThrow())
    test('rejects null',               () => expect(() => validateFlags(null)).toThrow(InvalidPlayerError))
    test('rejects array',              () => expect(() => validateFlags([])).toThrow(InvalidPlayerError))
    test('rejects primitive',          () => expect(() => validateFlags('flags')).toThrow(InvalidPlayerError))
  })
})

// ─── PlayerStats ─────────────────────────────────────────────────────────────

describe('PlayerStats', () => {
  test('constructs with defaults',       () => expect(() => new PlayerStats()).not.toThrow())
  test('default level is 1',             () => expect(new PlayerStats().level).toBe(1))
  test('default experience is 0',        () => expect(new PlayerStats().experience).toBe(0))
  test('is frozen',                      () => expect(Object.isFrozen(new PlayerStats())).toBe(true))
  test('attributes are frozen',          () => expect(Object.isFrozen(new PlayerStats({ attributes: { str: 10 } }).attributes)).toBe(true))
  test('metadata is frozen',             () => expect(Object.isFrozen(new PlayerStats().metadata)).toBe(true))
  test('accepts level 0',                () => expect(new PlayerStats({ level: 0 }).level).toBe(0))
  test('accepts custom experience',      () => expect(new PlayerStats({ experience: 250 }).experience).toBe(250))
  test('rejects negative level',         () => expect(() => new PlayerStats({ level: -1 })).toThrow(InvalidStatsError))
  test('rejects float level',            () => expect(() => new PlayerStats({ level: 2.5 })).toThrow(InvalidStatsError))
  test('rejects negative experience',    () => expect(() => new PlayerStats({ experience: -1 })).toThrow(InvalidStatsError))
})

// ─── PlayerFlags ─────────────────────────────────────────────────────────────

describe('PlayerFlags', () => {
  let flags

  beforeEach(() => { flags = new PlayerFlags() })

  test('starts empty',            () => expect(flags.size()).toBe(0))
  test('is frozen',               () => expect(Object.isFrozen(flags)).toBe(true))

  describe('set()', () => {
    test('returns new PlayerFlags',  () => expect(flags.set('x', true)).not.toBe(flags))
    test('new flags has value',      () => expect(flags.set('x', true).get('x')).toBe(true))
    test('original unchanged',       () => { flags.set('x', true); expect(flags.has('x')).toBe(false) })
    test('overwrites existing key',  () => expect(flags.set('x', 1).set('x', 2).get('x')).toBe(2))
    test('accepts false value',      () => expect(flags.set('x', false).get('x')).toBe(false))
    test('accepts null value',       () => expect(flags.set('x', null).get('x')).toBeNull())
    test('rejects empty key',        () => expect(() => flags.set('', true)).toThrow(InvalidPlayerError))
    test('rejects undefined value',  () => expect(() => flags.set('x', undefined)).toThrow(InvalidPlayerError))
  })

  describe('remove()', () => {
    test('returns new PlayerFlags without key', () => expect(flags.set('x', 1).remove('x').has('x')).toBe(false))
    test('silent on absent key',               () => expect(() => flags.remove('nope')).not.toThrow())
    test('original unchanged',                 () => {
      const f = flags.set('x', 1)
      f.remove('x')
      expect(f.has('x')).toBe(true)
    })
  })

  describe('read API', () => {
    test('has() true for existing',   () => expect(flags.set('x', 1).has('x')).toBe(true))
    test('has() false for absent',    () => expect(flags.has('x')).toBe(false))
    test('get() undefined if absent', () => expect(flags.get('x')).toBeUndefined())
    test('keys() is frozen',          () => expect(Object.isFrozen(flags.set('x', 1).keys())).toBe(true))
    test('values() is frozen',        () => expect(Object.isFrozen(flags.values())).toBe(true))
    test('entries() is frozen',       () => expect(Object.isFrozen(flags.entries())).toBe(true))
    test('size() counts correctly',   () => expect(flags.set('a', 1).set('b', 2).size()).toBe(2))
  })
})

// ─── PlayerInventory ─────────────────────────────────────────────────────────

describe('PlayerInventory', () => {
  let inv

  beforeEach(() => { inv = new PlayerInventory() })

  test('starts empty',     () => expect(inv.size()).toBe(0))
  test('is frozen',        () => expect(Object.isFrozen(inv)).toBe(true))

  describe('add()', () => {
    test('returns new inventory',         () => expect(inv.add(makeItem())).not.toBe(inv))
    test('new inventory has item',        () => expect(inv.add(makeItem()).has('item1')).toBe(true))
    test('original unchanged',            () => { inv.add(makeItem()); expect(inv.size()).toBe(0) })
    test('throws DuplicateItemError',     () => expect(() => inv.add(makeItem()).add(makeItem())).toThrow(DuplicateItemError))
    test('rejects item without id',       () => expect(() => inv.add({ name: 'Sword' })).toThrow(InvalidPlayerError))
    test('rejects item with empty id',    () => expect(() => inv.add({ id: '' })).toThrow(InvalidPlayerError))
    test('rejects null',                  () => expect(() => inv.add(null)).toThrow(InvalidPlayerError))
  })

  describe('remove()', () => {
    test('returns new inventory without item', () => expect(inv.add(makeItem()).remove('item1').has('item1')).toBe(false))
    test('throws ItemNotFoundError',           () => expect(() => inv.remove('nope')).toThrow(ItemNotFoundError))
    test('original unchanged',                 () => {
      const i = inv.add(makeItem())
      i.remove('item1')
      expect(i.has('item1')).toBe(true)
    })
  })

  describe('get()', () => {
    test('returns item for known id',    () => expect(inv.add(makeItem()).get('item1')).toEqual(makeItem()))
    test('returns undefined for absent', () => expect(inv.get('x')).toBeUndefined())
  })

  describe('getAll()', () => {
    test('returns frozen array',         () => expect(Object.isFrozen(inv.getAll())).toBe(true))
    test('preserves insertion order',    () => {
      const i1 = makeItem({ id: 'a' })
      const i2 = makeItem({ id: 'b' })
      expect(inv.add(i1).add(i2).getAll().map(i => i.id)).toEqual(['a', 'b'])
    })
  })

  describe('filter()', () => {
    test('returns frozen filtered array', () => {
      const i1 = makeItem({ id: 'a', type: 'weapon' })
      const i2 = makeItem({ id: 'b', type: 'potion' })
      const f  = inv.add(i1).add(i2).filter(i => i.type === 'weapon')
      expect(f.length).toBe(1)
      expect(Object.isFrozen(f)).toBe(true)
    })
  })

  describe('map()', () => {
    test('returns frozen mapped array', () => {
      const ids = inv.add(makeItem()).map(i => i.id)
      expect(ids).toEqual(['item1'])
      expect(Object.isFrozen(ids)).toBe(true)
    })
  })

  describe('sort()', () => {
    test('returns frozen sorted copy', () => {
      const i1 = makeItem({ id: 'b' })
      const i2 = makeItem({ id: 'a' })
      const s  = inv.add(i1).add(i2).sort((a, b) => a.id.localeCompare(b.id))
      expect(s[0].id).toBe('a')
      expect(Object.isFrozen(s)).toBe(true)
    })
    test('does not mutate internal order', () => {
      const i1 = makeItem({ id: 'b' })
      const i2 = makeItem({ id: 'a' })
      const c  = inv.add(i1).add(i2)
      c.sort((a, b) => a.id.localeCompare(b.id))
      expect(c.getAll()[0].id).toBe('b')
    })
  })
})

// ─── Player ───────────────────────────────────────────────────────────────────

describe('Player', () => {
  test('creates via createPlayer',       () => expect(() => makePlayer()).not.toThrow())
  test('is frozen',                      () => expect(Object.isFrozen(makePlayer())).toBe(true))
  test('exposes id and name',            () => { const p = makePlayer(); expect(p.id).toBe('p1'); expect(p.name).toBe('Hero') })
  test('description defaults to empty',  () => expect(makePlayer().description).toBe(''))
  test('role defaults to null',          () => expect(makePlayer().role).toBeNull())
  test('tags defaults to frozen []',     () => { const t = makePlayer().tags; expect(t).toEqual([]); expect(Object.isFrozen(t)).toBe(true) })
  test('stats is PlayerStats',           () => expect(makePlayer().stats).toBeInstanceOf(PlayerStats))
  test('inventory is PlayerInventory',   () => expect(makePlayer().inventory).toBeInstanceOf(PlayerInventory))
  test('flags is PlayerFlags',           () => expect(makePlayer().flags).toBeInstanceOf(PlayerFlags))

  test('rejects invalid stats',          () => expect(() => new Player({ id: 'p', name: 'X' }, {}, new PlayerInventory(), new PlayerFlags())).toThrow(InvalidPlayerError))
  test('rejects invalid inventory',      () => expect(() => new Player({ id: 'p', name: 'X' }, new PlayerStats(), {}, new PlayerFlags())).toThrow(InvalidPlayerError))
  test('rejects invalid flags',          () => expect(() => new Player({ id: 'p', name: 'X' }, new PlayerStats(), new PlayerInventory(), {})).toThrow(InvalidPlayerError))

  describe('addItem()', () => {
    test('returns new Player with item',    () => expect(makePlayer().addItem(makeItem()).inventory.has('item1')).toBe(true))
    test('original unchanged',              () => { const p = makePlayer(); p.addItem(makeItem()); expect(p.inventory.size()).toBe(0) })
    test('throws DuplicateItemError',       () => expect(() => makePlayer().addItem(makeItem()).addItem(makeItem())).toThrow(DuplicateItemError))
  })

  describe('removeItem()', () => {
    test('removes item',                    () => expect(makePlayer().addItem(makeItem()).removeItem('item1').inventory.has('item1')).toBe(false))
    test('throws ItemNotFoundError',        () => expect(() => makePlayer().removeItem('nope')).toThrow(ItemNotFoundError))
    test('original unchanged',              () => {
      const p = makePlayer().addItem(makeItem())
      p.removeItem('item1')
      expect(p.inventory.has('item1')).toBe(true)
    })
  })

  describe('updateStats()', () => {
    test('returns new Player with stats',   () => {
      const s = new PlayerStats({ level: 5 })
      expect(makePlayer().updateStats(s).stats.level).toBe(5)
    })
    test('rejects invalid stats',           () => expect(() => makePlayer().updateStats({})).toThrow(InvalidPlayerError))
    test('original unchanged',              () => {
      const p = makePlayer()
      p.updateStats(new PlayerStats({ level: 5 }))
      expect(p.stats.level).toBe(1)
    })
  })

  describe('setFlag()', () => {
    test('returns new Player with flag',    () => expect(makePlayer().setFlag('visited', true).flags.get('visited')).toBe(true))
    test('original unchanged',              () => { const p = makePlayer(); p.setFlag('x', 1); expect(p.flags.has('x')).toBe(false) })
    test('rejects invalid flag key',        () => expect(() => makePlayer().setFlag('', true)).toThrow(InvalidPlayerError))
  })

  describe('removeFlag()', () => {
    test('removes flag',                    () => expect(makePlayer().setFlag('x', 1).removeFlag('x').flags.has('x')).toBe(false))
    test('silent on absent flag',           () => expect(() => makePlayer().removeFlag('nope')).not.toThrow())
  })

  describe('snapshot()', () => {
    test('returns frozen plain object',     () => expect(Object.isFrozen(makePlayer().snapshot())).toBe(true))
    test('contains id, name, stats, inventory, flags', () => {
      const snap = makePlayer().snapshot()
      expect(snap.id).toBe('p1')
      expect(snap.name).toBe('Hero')
      expect(snap.stats.level).toBe(1)
      expect(snap.inventory).toEqual([])
      expect(snap.flags).toEqual({})
    })
    test('includes item data',              () => {
      const snap = makePlayer().addItem(makeItem()).snapshot()
      expect(snap.inventory[0].id).toBe('item1')
    })
    test('includes flag data',              () => {
      const snap = makePlayer().setFlag('hero', true).snapshot()
      expect(snap.flags.hero).toBe(true)
    })
    test('inventory array is frozen',       () => expect(Object.isFrozen(makePlayer().snapshot().inventory)).toBe(true))
    test('flags object is frozen',          () => expect(Object.isFrozen(makePlayer().snapshot().flags)).toBe(true))
  })

  describe('immutability', () => {
    test('chain of add/remove/setFlag is correct', () => {
      const p = makePlayer()
        .addItem(makeItem())
        .addItem(makeItem({ id: 'item2' }))
        .removeItem('item1')
        .setFlag('active', true)
      expect(p.inventory.has('item1')).toBe(false)
      expect(p.inventory.has('item2')).toBe(true)
      expect(p.flags.get('active')).toBe(true)
    })
    test('cannot assign to Player directly', () => {
      expect(() => { makePlayer().foo = 'bar' }).toThrow()
    })
  })
})
