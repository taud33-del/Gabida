/**
 * core/character/__tests__/Character.test.js
 *
 * Exhaustive tests for the Character system.
 *
 * Coverage:
 *   - CHARACTER_KEYS        : constants, frozen
 *   - CharacterError        : typed hierarchy, properties
 *   - CharacterValidator    : validateId, validateName, validateTrait, validateRelation, validateCharacter
 *   - CharacterState        : construction, frozen, invalid status
 *   - CharacterTraits       : set, update, remove, get, has, keys, values, entries, size, toObject, immutability
 *   - CharacterRelations    : set, remove, get, has, size, getAll, immutability, errors
 *   - Character             : construction, accessors, remember, forget, setTrait, removeTrait,
 *                             setRelation, removeRelation, withState, snapshot, immutability
 */

import { CHARACTER_KEYS }       from '../CharacterKeys.js'
import {
  CharacterError,
  InvalidCharacterError,
  DuplicateTraitError,
  RelationNotFoundError,
  InvalidCharacterStateError,
}                               from '../CharacterError.js'
import {
  validateId,
  validateName,
  validateTrait,
  validateRelation,
  validateCharacter,
}                               from '../CharacterValidator.js'
import { CharacterState }       from '../CharacterState.js'
import { CharacterTraits }      from '../CharacterTraits.js'
import { CharacterRelations }   from '../CharacterRelations.js'
import { Character }            from '../Character.js'
import { Memory }               from '../../memory/Memory.js'
import { MemoryEntry }          from '../../memory/MemoryEntry.js'
import { MEMORY_KEYS }          from '../../memory/MemoryKeys.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeCharacter = (overrides = {}) => new Character(
  { id: 'c1', name: 'Alice', ...overrides.identity },
  overrides.state     ?? new CharacterState(),
  overrides.traits    ?? new CharacterTraits(),
  overrides.relations ?? new CharacterRelations(),
  overrides.memory    ?? new Memory(),
)

const makeEntry = (id = 'e1') => new MemoryEntry({
  id,
  key        : MEMORY_KEYS.FACT,
  value      : 'test memory',
  timestamp  : 1000,
  importance : 0.5,
})

// ─── CHARACTER_KEYS ───────────────────────────────────────────────────────────

describe('CHARACTER_KEYS', () => {
  test('declares ID',          () => expect(typeof CHARACTER_KEYS.ID).toBe('string'))
  test('declares NAME',        () => expect(typeof CHARACTER_KEYS.NAME).toBe('string'))
  test('declares DESCRIPTION', () => expect(typeof CHARACTER_KEYS.DESCRIPTION).toBe('string'))
  test('declares AGE',         () => expect(typeof CHARACTER_KEYS.AGE).toBe('string'))
  test('declares ROLE',        () => expect(typeof CHARACTER_KEYS.ROLE).toBe('string'))
  test('declares PERSONALITY', () => expect(typeof CHARACTER_KEYS.PERSONALITY).toBe('string'))
  test('declares TRAITS',      () => expect(typeof CHARACTER_KEYS.TRAITS).toBe('string'))
  test('declares MEMORY',      () => expect(typeof CHARACTER_KEYS.MEMORY).toBe('string'))
  test('declares RELATIONS',   () => expect(typeof CHARACTER_KEYS.RELATIONS).toBe('string'))
  test('declares STATUS',      () => expect(typeof CHARACTER_KEYS.STATUS).toBe('string'))
  test('declares METADATA',    () => expect(typeof CHARACTER_KEYS.METADATA).toBe('string'))
  test('declares TAGS',        () => expect(typeof CHARACTER_KEYS.TAGS).toBe('string'))
  test('is frozen',            () => expect(Object.isFrozen(CHARACTER_KEYS)).toBe(true))
})

// ─── CharacterError ───────────────────────────────────────────────────────────

describe('CharacterError', () => {
  test('InvalidCharacterError extends CharacterError',      () => expect(new InvalidCharacterError('r', null)).toBeInstanceOf(CharacterError))
  test('DuplicateTraitError extends CharacterError',        () => expect(new DuplicateTraitError('t')).toBeInstanceOf(CharacterError))
  test('RelationNotFoundError extends CharacterError',      () => expect(new RelationNotFoundError('id')).toBeInstanceOf(CharacterError))
  test('InvalidCharacterStateError extends CharacterError', () => expect(new InvalidCharacterStateError('r', null)).toBeInstanceOf(CharacterError))

  test('DuplicateTraitError stores traitName',   () => expect(new DuplicateTraitError('brave').traitName).toBe('brave'))
  test('RelationNotFoundError stores id',        () => expect(new RelationNotFoundError('x').id).toBe('x'))
  test('InvalidCharacterError stores reason',    () => expect(new InvalidCharacterError('bad', null).reason).toBe('bad'))
  test('InvalidCharacterStateError stores reason', () => expect(new InvalidCharacterStateError('bad', null).reason).toBe('bad'))
})

// ─── CharacterValidator ───────────────────────────────────────────────────────

describe('CharacterValidator', () => {
  describe('validateId', () => {
    test('accepts non-empty string',   () => expect(() => validateId('c1')).not.toThrow())
    test('rejects empty string',       () => expect(() => validateId('')).toThrow(InvalidCharacterError))
    test('rejects null',               () => expect(() => validateId(null)).toThrow(InvalidCharacterError))
  })

  describe('validateName', () => {
    test('accepts non-empty string',   () => expect(() => validateName('Alice')).not.toThrow())
    test('rejects empty string',       () => expect(() => validateName('')).toThrow(InvalidCharacterError))
    test('rejects number',             () => expect(() => validateName(42)).toThrow(InvalidCharacterError))
  })

  describe('validateTrait', () => {
    test('accepts valid name and value', () => expect(() => validateTrait('brave', true)).not.toThrow())
    test('rejects empty trait name',    () => expect(() => validateTrait('', true)).toThrow(InvalidCharacterError))
    test('rejects undefined value',     () => expect(() => validateTrait('brave', undefined)).toThrow(InvalidCharacterError))
    test('accepts null value',          () => expect(() => validateTrait('brave', null)).not.toThrow())
  })

  describe('validateRelation', () => {
    test('accepts valid id and relation', () => expect(() => validateRelation('r1', { type: 'friend' })).not.toThrow())
    test('rejects empty id',             () => expect(() => validateRelation('', {})).toThrow(InvalidCharacterError))
    test('rejects null relation',        () => expect(() => validateRelation('r1', null)).toThrow(InvalidCharacterError))
    test('rejects non-object relation',  () => expect(() => validateRelation('r1', 'friend')).toThrow(InvalidCharacterError))
  })

  describe('validateCharacter', () => {
    test('accepts valid object',   () => expect(() => validateCharacter({ id: 'c1', name: 'Alice' })).not.toThrow())
    test('rejects null',           () => expect(() => validateCharacter(null)).toThrow(InvalidCharacterError))
    test('rejects missing id',     () => expect(() => validateCharacter({ name: 'Alice' })).toThrow(InvalidCharacterError))
    test('rejects missing name',   () => expect(() => validateCharacter({ id: 'c1' })).toThrow(InvalidCharacterError))
  })
})

// ─── CharacterState ───────────────────────────────────────────────────────────

describe('CharacterState', () => {
  test('constructs with defaults',         () => expect(() => new CharacterState()).not.toThrow())
  test('default status is idle',           () => expect(new CharacterState().status).toBe('idle'))
  test('is frozen',                        () => expect(Object.isFrozen(new CharacterState())).toBe(true))
  test('flags are frozen',                 () => expect(Object.isFrozen(new CharacterState({ flags: { x: 1 } }).flags)).toBe(true))
  test('metadata is frozen',               () => expect(Object.isFrozen(new CharacterState().metadata)).toBe(true))
  test('accepts custom status',            () => expect(new CharacterState({ status: 'active' }).status).toBe('active'))
  test('rejects empty status',             () => expect(() => new CharacterState({ status: '' })).toThrow(InvalidCharacterStateError))
  test('rejects non-string status',        () => expect(() => new CharacterState({ status: 42 })).toThrow(InvalidCharacterStateError))
})

// ─── CharacterTraits ──────────────────────────────────────────────────────────

describe('CharacterTraits', () => {
  let traits

  beforeEach(() => { traits = new CharacterTraits() })

  test('starts empty',              () => expect(traits.size()).toBe(0))
  test('is frozen',                 () => expect(Object.isFrozen(traits)).toBe(true))

  describe('set()', () => {
    test('returns new CharacterTraits', () => expect(traits.set('brave', true)).not.toBe(traits))
    test('new traits has value',       () => expect(traits.set('brave', true).get('brave')).toBe(true))
    test('original is unchanged',      () => { traits.set('brave', true); expect(traits.has('brave')).toBe(false) })
    test('throws DuplicateTraitError on duplicate', () => {
      expect(() => traits.set('brave', true).set('brave', false)).toThrow(DuplicateTraitError)
    })
    test('rejects undefined value',    () => expect(() => traits.set('x', undefined)).toThrow(InvalidCharacterError))
  })

  describe('update()', () => {
    test('adds new trait',      () => expect(traits.update('brave', true).has('brave')).toBe(true))
    test('overwrites existing', () => expect(traits.set('brave', true).update('brave', false).get('brave')).toBe(false))
  })

  describe('remove()', () => {
    test('returns new traits without key', () => expect(traits.set('brave', true).remove('brave').has('brave')).toBe(false))
    test('silent when key absent',         () => expect(() => traits.remove('nope')).not.toThrow())
    test('original is unchanged',          () => {
      const t2 = traits.set('brave', true)
      t2.remove('brave')
      expect(t2.has('brave')).toBe(true)
    })
  })

  describe('read API', () => {
    test('has() true for existing',        () => expect(traits.set('x', 1).has('x')).toBe(true))
    test('has() false for absent',         () => expect(traits.has('x')).toBe(false))
    test('get() returns undefined if absent', () => expect(traits.get('x')).toBeUndefined())
    test('keys() is frozen',               () => expect(Object.isFrozen(traits.keys())).toBe(true))
    test('values() is frozen',             () => expect(Object.isFrozen(traits.values())).toBe(true))
    test('entries() is frozen',            () => expect(Object.isFrozen(traits.entries())).toBe(true))
    test('toObject() is frozen',           () => expect(Object.isFrozen(traits.set('x', 1).toObject())).toBe(true))
    test('toObject() contains traits',     () => expect(traits.set('x', 1).toObject()).toEqual({ x: 1 }))
    test('size() counts correctly',        () => expect(traits.set('a', 1).set('b', 2).size()).toBe(2))
  })
})

// ─── CharacterRelations ───────────────────────────────────────────────────────

describe('CharacterRelations', () => {
  let rels

  beforeEach(() => { rels = new CharacterRelations() })

  test('starts empty',     () => expect(rels.size()).toBe(0))
  test('is frozen',        () => expect(Object.isFrozen(rels)).toBe(true))

  describe('set()', () => {
    test('returns new CharacterRelations', () => expect(rels.set('r1', { type: 'friend' })).not.toBe(rels))
    test('new relations has entry',        () => expect(rels.set('r1', { type: 'friend' }).has('r1')).toBe(true))
    test('original unchanged',             () => { rels.set('r1', {}); expect(rels.has('r1')).toBe(false) })
    test('overwrites existing id',         () => {
      const r = rels.set('r1', { type: 'friend' }).set('r1', { type: 'rival' })
      expect(r.get('r1').type).toBe('rival')
    })
  })

  describe('remove()', () => {
    test('removes entry',                  () => expect(rels.set('r1', {}).remove('r1').has('r1')).toBe(false))
    test('throws RelationNotFoundError',   () => expect(() => rels.remove('nope')).toThrow(RelationNotFoundError))
    test('original unchanged',             () => {
      const r = rels.set('r1', {})
      r.remove('r1')
      expect(r.has('r1')).toBe(true)
    })
  })

  describe('get()', () => {
    test('returns frozen copy',    () => {
      const r = rels.set('r1', { type: 'friend' })
      expect(Object.isFrozen(r.get('r1'))).toBe(true)
    })
    test('returns undefined for absent', () => expect(rels.get('x')).toBeUndefined())
  })

  describe('getAll()', () => {
    test('returns frozen map',     () => expect(Object.isFrozen(rels.getAll())).toBe(true))
    test('contains set entries',   () => {
      const r = rels.set('r1', { type: 'friend' })
      expect(r.getAll()['r1'].type).toBe('friend')
    })
  })

  test('size() counts correctly', () => expect(rels.set('a', {}).set('b', {}).size()).toBe(2))
})

// ─── Character ────────────────────────────────────────────────────────────────

describe('Character', () => {
  test('constructs successfully',   () => expect(() => makeCharacter()).not.toThrow())
  test('is frozen',                 () => expect(Object.isFrozen(makeCharacter())).toBe(true))
  test('exposes id and name',       () => { const c = makeCharacter(); expect(c.id).toBe('c1'); expect(c.name).toBe('Alice') })
  test('description defaults null', () => expect(makeCharacter().description).toBeNull())
  test('tags defaults to frozen []',() => { const t = makeCharacter().tags; expect(t).toEqual([]); expect(Object.isFrozen(t)).toBe(true) })
  test('rejects invalid state',     () => expect(() => makeCharacter({ state: {} })).toThrow(InvalidCharacterError))
  test('rejects invalid traits',    () => expect(() => makeCharacter({ traits: {} })).toThrow(InvalidCharacterError))
  test('rejects invalid relations', () => expect(() => makeCharacter({ relations: {} })).toThrow(InvalidCharacterError))
  test('rejects invalid memory',    () => expect(() => makeCharacter({ memory: {} })).toThrow(InvalidCharacterError))

  describe('remember()', () => {
    test('returns new Character',    () => expect(makeCharacter().remember(makeEntry())).not.toBe(makeCharacter()))
    test('memory contains entry',    () => expect(makeCharacter().remember(makeEntry()).memory.has('e1')).toBe(true))
    test('original unchanged',       () => { const c = makeCharacter(); c.remember(makeEntry()); expect(c.memory.size()).toBe(0) })
  })

  describe('forget()', () => {
    test('removes from memory',      () => {
      const c = makeCharacter().remember(makeEntry()).forget('e1')
      expect(c.memory.has('e1')).toBe(false)
    })
  })

  describe('setTrait()', () => {
    test('returns new Character with trait', () => {
      const c = makeCharacter().setTrait('brave', true)
      expect(c.traits.get('brave')).toBe(true)
    })
    test('original unchanged',              () => {
      const c = makeCharacter(); c.setTrait('brave', true)
      expect(c.traits.has('brave')).toBe(false)
    })
    test('throws DuplicateTraitError on duplicate', () => {
      expect(() => makeCharacter().setTrait('brave', true).setTrait('brave', false)).toThrow(DuplicateTraitError)
    })
  })

  describe('removeTrait()', () => {
    test('removes existing trait',   () => {
      const c = makeCharacter().setTrait('brave', true).removeTrait('brave')
      expect(c.traits.has('brave')).toBe(false)
    })
    test('silent on absent trait',   () => {
      expect(() => makeCharacter().removeTrait('nope')).not.toThrow()
    })
  })

  describe('setRelation()', () => {
    test('returns new Character with relation', () => {
      const c = makeCharacter().setRelation('r1', { type: 'friend' })
      expect(c.relations.has('r1')).toBe(true)
    })
    test('original unchanged', () => {
      const c = makeCharacter(); c.setRelation('r1', { type: 'friend' })
      expect(c.relations.has('r1')).toBe(false)
    })
  })

  describe('removeRelation()', () => {
    test('removes relation',         () => {
      const c = makeCharacter().setRelation('r1', {}).removeRelation('r1')
      expect(c.relations.has('r1')).toBe(false)
    })
    test('throws when absent',       () => {
      expect(() => makeCharacter().removeRelation('nope')).toThrow(RelationNotFoundError)
    })
  })

  describe('withState()', () => {
    test('returns new Character with new state', () => {
      const s = new CharacterState({ status: 'active' })
      expect(makeCharacter().withState(s).state.status).toBe('active')
    })
    test('rejects invalid state',    () => expect(() => makeCharacter().withState({})).toThrow(InvalidCharacterError))
    test('original unchanged',       () => {
      const c = makeCharacter()
      c.withState(new CharacterState({ status: 'active' }))
      expect(c.state.status).toBe('idle')
    })
  })

  describe('snapshot()', () => {
    test('returns frozen plain object', () => {
      const snap = makeCharacter().snapshot()
      expect(Object.isFrozen(snap)).toBe(true)
    })
    test('contains id, name, state, traits, relations, memory', () => {
      const snap = makeCharacter().snapshot()
      expect(snap.id).toBe('c1')
      expect(snap.name).toBe('Alice')
      expect(snap.state.status).toBe('idle')
      expect(snap.traits).toEqual({})
      expect(snap.memory).toEqual([])
    })
    test('includes traits correctly', () => {
      const snap = makeCharacter().setTrait('brave', true).snapshot()
      expect(snap.traits.brave).toBe(true)
    })
    test('includes memory entries', () => {
      const snap = makeCharacter().remember(makeEntry()).snapshot()
      expect(snap.memory.length).toBe(1)
      expect(snap.memory[0].id).toBe('e1')
    })
  })
})
