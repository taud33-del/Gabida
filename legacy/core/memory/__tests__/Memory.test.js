/**
 * core/memory/__tests__/Memory.test.js
 *
 * Exhaustive tests for the Memory system.
 *
 * Coverage:
 *   - MEMORY_KEYS       : constants, frozen
 *   - MemoryError       : typed hierarchy, properties
 *   - MemoryValidator   : validateKey, validateEntry, validateImportance, validateTimestamp
 *   - MemoryEntry       : construction, frozen, invalid inputs
 *   - MemoryCollection  : add, remove, get, has, size, getAll, filter, map, sort
 *   - Memory            : remember, forget, recall, recallAll, has, size, snapshot
 */

import { MEMORY_KEYS }         from '../MemoryKeys.js'
import {
  MemoryError,
  InvalidMemoryError,
  DuplicateMemoryError,
  MemoryNotFoundError,
  InvalidMemoryKeyError,
}                              from '../MemoryError.js'
import {
  validateKey,
  validateEntry,
  validateImportance,
  validateTimestamp,
}                              from '../MemoryValidator.js'
import { MemoryEntry }         from '../MemoryEntry.js'
import { MemoryCollection }    from '../MemoryCollection.js'
import { Memory }              from '../Memory.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEntry = (overrides = {}) => new MemoryEntry({
  id         : 'e1',
  key        : MEMORY_KEYS.FACT,
  value      : 'the sky is blue',
  timestamp  : 1000,
  importance : 0.5,
  ...overrides,
})

// ─── MEMORY_KEYS ─────────────────────────────────────────────────────────────

describe('MEMORY_KEYS', () => {
  test('declares FACT',         () => expect(typeof MEMORY_KEYS.FACT).toBe('string'))
  test('declares EVENT',        () => expect(typeof MEMORY_KEYS.EVENT).toBe('string'))
  test('declares DECISION',     () => expect(typeof MEMORY_KEYS.DECISION).toBe('string'))
  test('declares RELATIONSHIP', () => expect(typeof MEMORY_KEYS.RELATIONSHIP).toBe('string'))
  test('declares EMOTION',      () => expect(typeof MEMORY_KEYS.EMOTION).toBe('string'))
  test('declares LOCATION',     () => expect(typeof MEMORY_KEYS.LOCATION).toBe('string'))
  test('declares ITEM',         () => expect(typeof MEMORY_KEYS.ITEM).toBe('string'))
  test('declares DIALOGUE',     () => expect(typeof MEMORY_KEYS.DIALOGUE).toBe('string'))
  test('declares GOAL',         () => expect(typeof MEMORY_KEYS.GOAL).toBe('string'))
  test('declares BELIEF',       () => expect(typeof MEMORY_KEYS.BELIEF).toBe('string'))
  test('is frozen',             () => expect(Object.isFrozen(MEMORY_KEYS)).toBe(true))
})

// ─── MemoryError ──────────────────────────────────────────────────────────────

describe('MemoryError', () => {
  test('InvalidMemoryError extends MemoryError',     () => expect(new InvalidMemoryError('r', null)).toBeInstanceOf(MemoryError))
  test('DuplicateMemoryError extends MemoryError',   () => expect(new DuplicateMemoryError('id')).toBeInstanceOf(MemoryError))
  test('MemoryNotFoundError extends MemoryError',    () => expect(new MemoryNotFoundError('id')).toBeInstanceOf(MemoryError))
  test('InvalidMemoryKeyError extends MemoryError',  () => expect(new InvalidMemoryKeyError('k')).toBeInstanceOf(MemoryError))

  test('DuplicateMemoryError stores id',   () => expect(new DuplicateMemoryError('x').id).toBe('x'))
  test('MemoryNotFoundError stores id',    () => expect(new MemoryNotFoundError('x').id).toBe('x'))
  test('InvalidMemoryKeyError stores key', () => expect(new InvalidMemoryKeyError(42).key).toBe(42))
  test('InvalidMemoryError stores reason and value', () => {
    const err = new InvalidMemoryError('bad', null)
    expect(err.reason).toBe('bad')
    expect(err.value).toBeNull()
  })
})

// ─── MemoryValidator ──────────────────────────────────────────────────────────

describe('MemoryValidator', () => {
  describe('validateKey', () => {
    test('accepts non-empty string',   () => expect(() => validateKey('fact')).not.toThrow())
    test('rejects empty string',       () => expect(() => validateKey('')).toThrow(InvalidMemoryKeyError))
    test('rejects whitespace',         () => expect(() => validateKey('  ')).toThrow(InvalidMemoryKeyError))
    test('rejects null',               () => expect(() => validateKey(null)).toThrow(InvalidMemoryKeyError))
    test('rejects number',             () => expect(() => validateKey(0)).toThrow(InvalidMemoryKeyError))
  })

  describe('validateImportance', () => {
    test('accepts 0',                  () => expect(() => validateImportance(0)).not.toThrow())
    test('accepts 1',                  () => expect(() => validateImportance(1)).not.toThrow())
    test('accepts 0.5',                () => expect(() => validateImportance(0.5)).not.toThrow())
    test('rejects -0.1',               () => expect(() => validateImportance(-0.1)).toThrow(InvalidMemoryError))
    test('rejects 1.1',                () => expect(() => validateImportance(1.1)).toThrow(InvalidMemoryError))
    test('rejects NaN',                () => expect(() => validateImportance(NaN)).toThrow(InvalidMemoryError))
    test('rejects string',             () => expect(() => validateImportance('high')).toThrow(InvalidMemoryError))
  })

  describe('validateTimestamp', () => {
    test('accepts 0',                  () => expect(() => validateTimestamp(0)).not.toThrow())
    test('accepts positive integer',   () => expect(() => validateTimestamp(1000)).not.toThrow())
    test('rejects negative',           () => expect(() => validateTimestamp(-1)).toThrow(InvalidMemoryError))
    test('rejects float',              () => expect(() => validateTimestamp(1.5)).toThrow(InvalidMemoryError))
    test('rejects string',             () => expect(() => validateTimestamp('now')).toThrow(InvalidMemoryError))
  })

  describe('validateEntry', () => {
    test('accepts a valid entry object', () => expect(() => validateEntry(makeEntry())).not.toThrow())
    test('rejects null',               () => expect(() => validateEntry(null)).toThrow(InvalidMemoryError))
    test('rejects missing id',         () => expect(() => validateEntry({ key: 'k', value: 'v', timestamp: 0, importance: 0 })).toThrow(InvalidMemoryError))
    test('rejects invalid key',        () => expect(() => validateEntry({ id: 'x', key: '', value: 'v', timestamp: 0, importance: 0 })).toThrow(InvalidMemoryKeyError))
    test('rejects undefined value',    () => expect(() => validateEntry({ id: 'x', key: 'k', value: undefined, timestamp: 0, importance: 0 })).toThrow(InvalidMemoryError))
    test('rejects invalid timestamp',  () => expect(() => validateEntry({ id: 'x', key: 'k', value: 'v', timestamp: -1, importance: 0 })).toThrow(InvalidMemoryError))
    test('rejects invalid importance', () => expect(() => validateEntry({ id: 'x', key: 'k', value: 'v', timestamp: 0, importance: 2 })).toThrow(InvalidMemoryError))
  })
})

// ─── MemoryEntry ─────────────────────────────────────────────────────────────

describe('MemoryEntry', () => {
  test('constructs successfully with valid data', () =>
    expect(() => makeEntry()).not.toThrow())

  test('exposes id, key, value, timestamp, importance', () => {
    const e = makeEntry()
    expect(e.id).toBe('e1')
    expect(e.key).toBe(MEMORY_KEYS.FACT)
    expect(e.value).toBe('the sky is blue')
    expect(e.timestamp).toBe(1000)
    expect(e.importance).toBe(0.5)
  })

  test('is frozen after construction', () => {
    expect(Object.isFrozen(makeEntry())).toBe(true)
  })

  test('metadata defaults to frozen empty object', () => {
    const e = makeEntry()
    expect(e.metadata).toEqual({})
    expect(Object.isFrozen(e.metadata)).toBe(true)
  })

  test('metadata is frozen when provided', () => {
    const e = makeEntry({ metadata: { source: 'narrator' } })
    expect(Object.isFrozen(e.metadata)).toBe(true)
    expect(e.metadata.source).toBe('narrator')
  })

  test('rejects empty id',           () => expect(() => makeEntry({ id: '' })).toThrow(InvalidMemoryError))
  test('rejects invalid key',        () => expect(() => makeEntry({ key: '' })).toThrow(InvalidMemoryKeyError))
  test('rejects undefined value',    () => expect(() => makeEntry({ value: undefined })).toThrow(InvalidMemoryError))
  test('rejects bad importance',     () => expect(() => makeEntry({ importance: 2 })).toThrow(InvalidMemoryError))
  test('rejects bad timestamp',      () => expect(() => makeEntry({ timestamp: -5 })).toThrow(InvalidMemoryError))

  test('accepts null as value',      () => expect(() => makeEntry({ value: null })).not.toThrow())
  test('accepts false as value',     () => expect(() => makeEntry({ value: false })).not.toThrow())
  test('accepts 0 as value',         () => expect(() => makeEntry({ value: 0 })).not.toThrow())
})

// ─── MemoryCollection ────────────────────────────────────────────────────────

describe('MemoryCollection', () => {
  let empty

  beforeEach(() => { empty = new MemoryCollection() })

  test('starts empty', () => expect(empty.size()).toBe(0))
  test('is frozen',    () => expect(Object.isFrozen(empty)).toBe(true))

  describe('add()', () => {
    test('returns a new collection',           () => {
      const c = empty.add(makeEntry())
      expect(c).not.toBe(empty)
      expect(c).toBeInstanceOf(MemoryCollection)
    })
    test('original is unchanged',             () => { empty.add(makeEntry()); expect(empty.size()).toBe(0) })
    test('new collection has the entry',      () => expect(empty.add(makeEntry()).has('e1')).toBe(true))
    test('rejects duplicate id',              () => {
      const c = empty.add(makeEntry())
      expect(() => c.add(makeEntry())).toThrow(DuplicateMemoryError)
    })
    test('rejects non-MemoryEntry',           () => expect(() => empty.add({ id: 'x' })).toThrow(InvalidMemoryError))
  })

  describe('remove()', () => {
    test('returns new collection without entry', () => {
      const c = empty.add(makeEntry()).remove('e1')
      expect(c.has('e1')).toBe(false)
    })
    test('original is unchanged', () => {
      const c = empty.add(makeEntry())
      c.remove('e1')
      expect(c.has('e1')).toBe(true)
    })
    test('throws MemoryNotFoundError for unknown id', () =>
      expect(() => empty.remove('nope')).toThrow(MemoryNotFoundError))
  })

  describe('get()', () => {
    test('returns entry for known id',   () => expect(empty.add(makeEntry()).get('e1')).toBeInstanceOf(MemoryEntry))
    test('returns undefined for unknown id', () => expect(empty.get('x')).toBeUndefined())
  })

  describe('has()', () => {
    test('true after add',   () => expect(empty.add(makeEntry()).has('e1')).toBe(true))
    test('false when absent',() => expect(empty.has('e1')).toBe(false))
  })

  describe('size()', () => {
    test('0 initially',     () => expect(empty.size()).toBe(0))
    test('1 after one add', () => expect(empty.add(makeEntry()).size()).toBe(1))
    test('decrements after remove', () => {
      expect(empty.add(makeEntry()).remove('e1').size()).toBe(0)
    })
  })

  describe('getAll()', () => {
    test('returns frozen array', () => expect(Object.isFrozen(empty.getAll())).toBe(true))
    test('preserves insertion order', () => {
      const e1 = makeEntry({ id: 'a' })
      const e2 = makeEntry({ id: 'b' })
      const c  = empty.add(e1).add(e2)
      expect(c.getAll().map(e => e.id)).toEqual(['a', 'b'])
    })
  })

  describe('filter()', () => {
    test('returns frozen filtered copy', () => {
      const e1 = makeEntry({ id: 'a', importance: 0.8 })
      const e2 = makeEntry({ id: 'b', importance: 0.2 })
      const c  = empty.add(e1).add(e2)
      const hi = c.filter(e => e.importance >= 0.5)
      expect(hi.length).toBe(1)
      expect(Object.isFrozen(hi)).toBe(true)
    })
  })

  describe('map()', () => {
    test('returns frozen mapped copy', () => {
      const c   = empty.add(makeEntry())
      const ids = c.map(e => e.id)
      expect(ids).toEqual(['e1'])
      expect(Object.isFrozen(ids)).toBe(true)
    })
  })

  describe('sort()', () => {
    test('returns frozen sorted copy by importance desc', () => {
      const e1 = makeEntry({ id: 'a', importance: 0.2 })
      const e2 = makeEntry({ id: 'b', importance: 0.9 })
      const c  = empty.add(e1).add(e2)
      const sorted = c.sort((a, b) => b.importance - a.importance)
      expect(sorted[0].id).toBe('b')
      expect(Object.isFrozen(sorted)).toBe(true)
    })
    test('does not mutate internal order', () => {
      const e1 = makeEntry({ id: 'a', importance: 0.2 })
      const e2 = makeEntry({ id: 'b', importance: 0.9 })
      const c  = empty.add(e1).add(e2)
      c.sort((a, b) => b.importance - a.importance)
      expect(c.getAll()[0].id).toBe('a')
    })
  })
})

// ─── Memory ───────────────────────────────────────────────────────────────────

describe('Memory', () => {
  let mem

  beforeEach(() => { mem = new Memory() })

  test('starts empty',  () => expect(mem.size()).toBe(0))
  test('is frozen',     () => expect(Object.isFrozen(mem)).toBe(true))

  describe('remember()', () => {
    test('returns a new Memory',          () => expect(mem.remember(makeEntry())).not.toBe(mem))
    test('new Memory has the entry',      () => expect(mem.remember(makeEntry()).has('e1')).toBe(true))
    test('original is unchanged',         () => { mem.remember(makeEntry()); expect(mem.size()).toBe(0) })
    test('rejects duplicate',             () => {
      const m = mem.remember(makeEntry())
      expect(() => m.remember(makeEntry())).toThrow(DuplicateMemoryError)
    })
  })

  describe('forget()', () => {
    test('returns new Memory without entry', () => {
      const m2 = mem.remember(makeEntry()).forget('e1')
      expect(m2.has('e1')).toBe(false)
    })
    test('throws MemoryNotFoundError for unknown id', () =>
      expect(() => mem.forget('nope')).toThrow(MemoryNotFoundError))
    test('original is unchanged', () => {
      const m1 = mem.remember(makeEntry())
      m1.forget('e1')
      expect(m1.has('e1')).toBe(true)
    })
  })

  describe('recall()', () => {
    test('returns entry for known id',   () => expect(mem.remember(makeEntry()).recall('e1')).toBeInstanceOf(MemoryEntry))
    test('returns undefined for unknown', () => expect(mem.recall('nope')).toBeUndefined())
  })

  describe('recallAll()', () => {
    test('returns frozen array',        () => expect(Object.isFrozen(mem.recallAll())).toBe(true))
    test('returns all entries',         () => {
      const e1 = makeEntry({ id: 'a' })
      const e2 = makeEntry({ id: 'b' })
      const m  = mem.remember(e1).remember(e2)
      expect(m.recallAll().length).toBe(2)
    })
  })

  describe('has()', () => {
    test('true after remember',   () => expect(mem.remember(makeEntry()).has('e1')).toBe(true))
    test('false when not present',() => expect(mem.has('e1')).toBe(false))
  })

  describe('size()', () => {
    test('0 initially',           () => expect(mem.size()).toBe(0))
    test('grows with remember()', () => {
      const m = mem.remember(makeEntry({ id: 'a' })).remember(makeEntry({ id: 'b' }))
      expect(m.size()).toBe(2)
    })
    test('shrinks with forget()',  () => {
      expect(mem.remember(makeEntry()).forget('e1').size()).toBe(0)
    })
  })

  describe('snapshot()', () => {
    test('returns frozen array',         () => expect(Object.isFrozen(mem.snapshot())).toBe(true))
    test('entries in snapshot are frozen', () => {
      const snap = mem.remember(makeEntry()).snapshot()
      expect(Object.isFrozen(snap[0])).toBe(true)
    })
    test('snapshot contains all fields', () => {
      const snap = mem.remember(makeEntry()).snapshot()
      expect(snap[0].id).toBe('e1')
      expect(snap[0].key).toBe(MEMORY_KEYS.FACT)
      expect(snap[0].value).toBe('the sky is blue')
      expect(snap[0].timestamp).toBe(1000)
      expect(snap[0].importance).toBe(0.5)
    })
    test('empty memory snapshot is empty array', () => {
      expect(mem.snapshot()).toEqual([])
    })
  })

  describe('immutability', () => {
    test('chain of remember/forget is correct', () => {
      const e1 = makeEntry({ id: 'a' })
      const e2 = makeEntry({ id: 'b' })
      const m  = mem.remember(e1).remember(e2).forget('a')
      expect(m.has('a')).toBe(false)
      expect(m.has('b')).toBe(true)
      expect(mem.size()).toBe(0)
    })
    test('cannot assign to Memory directly', () => {
      expect(() => { mem.foo = 'bar' }).toThrow()
    })
  })
})
