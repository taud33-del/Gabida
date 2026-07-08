/**
 * core/adventure/__tests__/Adventure.test.js
 *
 * Exhaustive tests for the Adventure system.
 *
 * Coverage:
 *   - ADVENTURE_KEYS / ADVENTURE_STATUS : constants, frozen
 *   - AdventureError   : typed hierarchy, properties
 *   - AdventureValidator : validateAdventure, validateAdventureName, validateObjective, validateStatus
 *   - AdventureObjective : construction, complete(), frozen, invalid inputs
 *   - AdventureState     : construction, frozen, defaults, invalid status
 *   - AdventureCollection: add, remove, complete, get, has, size, getAll, filter, map, sort, immutability
 *   - Adventure          : createAdventure, accessors, addObjective, removeObjective,
 *                          completeObjective, updateState, snapshot, immutability, errors
 */

import { ADVENTURE_KEYS, ADVENTURE_STATUS } from '../AdventureKeys.js'
import {
  AdventureError,
  InvalidAdventureError,
  DuplicateObjectiveError,
  ObjectiveNotFoundError,
  InvalidStatusError,
}                                           from '../AdventureError.js'
import {
  validateAdventure,
  validateAdventureName,
  validateObjective,
  validateStatus,
}                                           from '../AdventureValidator.js'
import { AdventureObjective }               from '../AdventureObjective.js'
import { AdventureState }                   from '../AdventureState.js'
import { AdventureCollection }              from '../AdventureCollection.js'
import { Adventure, createAdventure }       from '../Adventure.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeObjective = (overrides = {}) =>
  new AdventureObjective({ id: 'obj1', title: 'Find the artifact', ...overrides })

const makeAdventure = (overrides = {}) =>
  createAdventure({ id: 'adv1', name: 'The Quest', ...overrides })

// ─── ADVENTURE_KEYS / ADVENTURE_STATUS ───────────────────────────────────────

describe('ADVENTURE_KEYS', () => {
  test('declares ID',           () => expect(typeof ADVENTURE_KEYS.ID).toBe('string'))
  test('declares NAME',         () => expect(typeof ADVENTURE_KEYS.NAME).toBe('string'))
  test('declares DESCRIPTION',  () => expect(typeof ADVENTURE_KEYS.DESCRIPTION).toBe('string'))
  test('declares STATUS',       () => expect(typeof ADVENTURE_KEYS.STATUS).toBe('string'))
  test('declares OBJECTIVES',   () => expect(typeof ADVENTURE_KEYS.OBJECTIVES).toBe('string'))
  test('declares VARIABLES',    () => expect(typeof ADVENTURE_KEYS.VARIABLES).toBe('string'))
  test('declares FLAGS',        () => expect(typeof ADVENTURE_KEYS.FLAGS).toBe('string'))
  test('declares CURRENT_STEP', () => expect(typeof ADVENTURE_KEYS.CURRENT_STEP).toBe('string'))
  test('declares COMPLETED',    () => expect(typeof ADVENTURE_KEYS.COMPLETED).toBe('string'))
  test('declares FAILED',       () => expect(typeof ADVENTURE_KEYS.FAILED).toBe('string'))
  test('declares SUCCESS',      () => expect(typeof ADVENTURE_KEYS.SUCCESS).toBe('string'))
  test('declares METADATA',     () => expect(typeof ADVENTURE_KEYS.METADATA).toBe('string'))
  test('is frozen',             () => expect(Object.isFrozen(ADVENTURE_KEYS)).toBe(true))
})

describe('ADVENTURE_STATUS', () => {
  test('declares IDLE',      () => expect(typeof ADVENTURE_STATUS.IDLE).toBe('string'))
  test('declares ACTIVE',    () => expect(typeof ADVENTURE_STATUS.ACTIVE).toBe('string'))
  test('declares PAUSED',    () => expect(typeof ADVENTURE_STATUS.PAUSED).toBe('string'))
  test('declares COMPLETED', () => expect(typeof ADVENTURE_STATUS.COMPLETED).toBe('string'))
  test('declares FAILED',    () => expect(typeof ADVENTURE_STATUS.FAILED).toBe('string'))
  test('is frozen',          () => expect(Object.isFrozen(ADVENTURE_STATUS)).toBe(true))
})

// ─── AdventureError ───────────────────────────────────────────────────────────

describe('AdventureError', () => {
  test('InvalidAdventureError extends AdventureError',  () => expect(new InvalidAdventureError('r', null)).toBeInstanceOf(AdventureError))
  test('DuplicateObjectiveError extends AdventureError',() => expect(new DuplicateObjectiveError('x')).toBeInstanceOf(AdventureError))
  test('ObjectiveNotFoundError extends AdventureError', () => expect(new ObjectiveNotFoundError('x')).toBeInstanceOf(AdventureError))
  test('InvalidStatusError extends AdventureError',     () => expect(new InvalidStatusError('bad')).toBeInstanceOf(AdventureError))

  test('DuplicateObjectiveError stores id',  () => expect(new DuplicateObjectiveError('obj1').id).toBe('obj1'))
  test('ObjectiveNotFoundError stores id',   () => expect(new ObjectiveNotFoundError('obj1').id).toBe('obj1'))
  test('InvalidStatusError stores status',   () => expect(new InvalidStatusError('bad').status).toBe('bad'))
  test('InvalidAdventureError stores reason and value', () => {
    const err = new InvalidAdventureError('bad', null)
    expect(err.reason).toBe('bad')
    expect(err.value).toBeNull()
  })
})

// ─── AdventureValidator ───────────────────────────────────────────────────────

describe('AdventureValidator', () => {
  describe('validateAdventureName', () => {
    test('accepts non-empty string',   () => expect(() => validateAdventureName('Quest')).not.toThrow())
    test('rejects empty string',       () => expect(() => validateAdventureName('')).toThrow(InvalidAdventureError))
    test('rejects null',               () => expect(() => validateAdventureName(null)).toThrow(InvalidAdventureError))
    test('rejects number',             () => expect(() => validateAdventureName(42)).toThrow(InvalidAdventureError))
  })

  describe('validateStatus', () => {
    test('accepts IDLE',      () => expect(() => validateStatus(ADVENTURE_STATUS.IDLE)).not.toThrow())
    test('accepts ACTIVE',    () => expect(() => validateStatus(ADVENTURE_STATUS.ACTIVE)).not.toThrow())
    test('accepts COMPLETED', () => expect(() => validateStatus(ADVENTURE_STATUS.COMPLETED)).not.toThrow())
    test('rejects unknown',   () => expect(() => validateStatus('running')).toThrow(InvalidStatusError))
    test('rejects null',      () => expect(() => validateStatus(null)).toThrow(InvalidStatusError))
  })

  describe('validateAdventure', () => {
    test('accepts valid object',   () => expect(() => validateAdventure({ id: 'a1', name: 'Quest' })).not.toThrow())
    test('rejects null',           () => expect(() => validateAdventure(null)).toThrow(InvalidAdventureError))
    test('rejects missing id',     () => expect(() => validateAdventure({ name: 'Quest' })).toThrow(InvalidAdventureError))
    test('rejects empty id',       () => expect(() => validateAdventure({ id: '', name: 'Quest' })).toThrow(InvalidAdventureError))
    test('rejects missing name',   () => expect(() => validateAdventure({ id: 'a1' })).toThrow(InvalidAdventureError))
  })

  describe('validateObjective', () => {
    test('accepts valid object',   () => expect(() => validateObjective({ id: 'o1', title: 'Find it' })).not.toThrow())
    test('rejects null',           () => expect(() => validateObjective(null)).toThrow(InvalidAdventureError))
    test('rejects empty id',       () => expect(() => validateObjective({ id: '', title: 'Find it' })).toThrow(InvalidAdventureError))
    test('rejects empty title',    () => expect(() => validateObjective({ id: 'o1', title: '' })).toThrow(InvalidAdventureError))
  })
})

// ─── AdventureObjective ───────────────────────────────────────────────────────

describe('AdventureObjective', () => {
  test('constructs successfully',        () => expect(() => makeObjective()).not.toThrow())
  test('is frozen',                      () => expect(Object.isFrozen(makeObjective())).toBe(true))
  test('exposes id and title',           () => { const o = makeObjective(); expect(o.id).toBe('obj1'); expect(o.title).toBe('Find the artifact') })
  test('completed defaults to false',    () => expect(makeObjective().completed).toBe(false))
  test('optional defaults to false',     () => expect(makeObjective().optional).toBe(false))
  test('description defaults to empty',  () => expect(makeObjective().description).toBe(''))
  test('metadata is frozen',             () => expect(Object.isFrozen(makeObjective().metadata)).toBe(true))
  test('rejects empty id',               () => expect(() => makeObjective({ id: '' })).toThrow(InvalidAdventureError))
  test('rejects empty title',            () => expect(() => makeObjective({ title: '' })).toThrow(InvalidAdventureError))

  describe('complete()', () => {
    test('returns new objective with completed true', () => {
      expect(makeObjective().complete().completed).toBe(true)
    })
    test('original is unchanged',        () => {
      const o = makeObjective()
      o.complete()
      expect(o.completed).toBe(false)
    })
    test('returned objective is frozen', () => expect(Object.isFrozen(makeObjective().complete())).toBe(true))
    test('preserves other fields',       () => {
      const o = makeObjective({ optional: true })
      expect(o.complete().optional).toBe(true)
    })
  })
})

// ─── AdventureState ───────────────────────────────────────────────────────────

describe('AdventureState', () => {
  test('constructs with defaults',       () => expect(() => new AdventureState()).not.toThrow())
  test('default status is idle',         () => expect(new AdventureState().status).toBe(ADVENTURE_STATUS.IDLE))
  test('currentStep defaults to empty',  () => expect(new AdventureState().currentStep).toBe(''))
  test('is frozen',                      () => expect(Object.isFrozen(new AdventureState())).toBe(true))
  test('flags are frozen',               () => expect(Object.isFrozen(new AdventureState({ flags: { x: true } }).flags)).toBe(true))
  test('variables are frozen',           () => expect(Object.isFrozen(new AdventureState({ variables: { score: 0 } }).variables)).toBe(true))
  test('metadata is frozen',             () => expect(Object.isFrozen(new AdventureState().metadata)).toBe(true))
  test('accepts active status',          () => expect(new AdventureState({ status: ADVENTURE_STATUS.ACTIVE }).status).toBe(ADVENTURE_STATUS.ACTIVE))
  test('rejects unknown status',         () => expect(() => new AdventureState({ status: 'running' })).toThrow(InvalidStatusError))
  test('accepts currentStep',            () => expect(new AdventureState({ currentStep: 'step-2' }).currentStep).toBe('step-2'))
})

// ─── AdventureCollection ──────────────────────────────────────────────────────

describe('AdventureCollection', () => {
  let col

  beforeEach(() => { col = new AdventureCollection() })

  test('starts empty',     () => expect(col.size()).toBe(0))
  test('is frozen',        () => expect(Object.isFrozen(col)).toBe(true))

  describe('add()', () => {
    test('returns new collection',          () => expect(col.add(makeObjective())).not.toBe(col))
    test('new collection has item',         () => expect(col.add(makeObjective()).has('obj1')).toBe(true))
    test('original unchanged',              () => { col.add(makeObjective()); expect(col.size()).toBe(0) })
    test('throws DuplicateObjectiveError',  () => expect(() => col.add(makeObjective()).add(makeObjective())).toThrow(DuplicateObjectiveError))
    test('rejects non-AdventureObjective',  () => expect(() => col.add({ id: 'x' })).toThrow(InvalidAdventureError))
  })

  describe('remove()', () => {
    test('returns new collection without item', () => expect(col.add(makeObjective()).remove('obj1').has('obj1')).toBe(false))
    test('throws ObjectiveNotFoundError',       () => expect(() => col.remove('nope')).toThrow(ObjectiveNotFoundError))
    test('original unchanged',                  () => {
      const c = col.add(makeObjective())
      c.remove('obj1')
      expect(c.has('obj1')).toBe(true)
    })
  })

  describe('complete()', () => {
    test('marks objective as completed',    () => expect(col.add(makeObjective()).complete('obj1').get('obj1').completed).toBe(true))
    test('returns new collection',          () => {
      const c = col.add(makeObjective())
      expect(c.complete('obj1')).not.toBe(c)
    })
    test('original objective unchanged',    () => {
      const c = col.add(makeObjective())
      c.complete('obj1')
      expect(c.get('obj1').completed).toBe(false)
    })
    test('throws ObjectiveNotFoundError',   () => expect(() => col.complete('nope')).toThrow(ObjectiveNotFoundError))
  })

  describe('get()', () => {
    test('returns item for known id',       () => expect(col.add(makeObjective()).get('obj1')).toBeInstanceOf(AdventureObjective))
    test('returns undefined for absent',    () => expect(col.get('x')).toBeUndefined())
  })

  describe('getAll()', () => {
    test('returns frozen array',            () => expect(Object.isFrozen(col.getAll())).toBe(true))
    test('preserves insertion order',       () => {
      const o1 = makeObjective({ id: 'a', title: 'A' })
      const o2 = makeObjective({ id: 'b', title: 'B' })
      expect(col.add(o1).add(o2).getAll().map(o => o.id)).toEqual(['a', 'b'])
    })
  })

  describe('filter()', () => {
    test('returns frozen filtered array',   () => {
      const o1 = makeObjective({ id: 'a', title: 'A' })
      const o2 = makeObjective({ id: 'b', title: 'B', optional: true })
      const f  = col.add(o1).add(o2).filter(o => o.optional)
      expect(f.length).toBe(1)
      expect(Object.isFrozen(f)).toBe(true)
    })
  })

  describe('map()', () => {
    test('returns frozen mapped array',     () => {
      const ids = col.add(makeObjective()).map(o => o.id)
      expect(ids).toEqual(['obj1'])
      expect(Object.isFrozen(ids)).toBe(true)
    })
  })

  describe('sort()', () => {
    test('returns frozen sorted copy',      () => {
      const o1 = makeObjective({ id: 'b', title: 'B' })
      const o2 = makeObjective({ id: 'a', title: 'A' })
      const s  = col.add(o1).add(o2).sort((a, b) => a.id.localeCompare(b.id))
      expect(s[0].id).toBe('a')
      expect(Object.isFrozen(s)).toBe(true)
    })
    test('does not mutate internal order',  () => {
      const o1 = makeObjective({ id: 'b', title: 'B' })
      const o2 = makeObjective({ id: 'a', title: 'A' })
      const c  = col.add(o1).add(o2)
      c.sort((a, b) => a.id.localeCompare(b.id))
      expect(c.getAll()[0].id).toBe('b')
    })
  })
})

// ─── Adventure ────────────────────────────────────────────────────────────────

describe('Adventure', () => {
  test('creates via createAdventure',        () => expect(() => makeAdventure()).not.toThrow())
  test('is frozen',                          () => expect(Object.isFrozen(makeAdventure())).toBe(true))
  test('exposes id and name',                () => { const a = makeAdventure(); expect(a.id).toBe('adv1'); expect(a.name).toBe('The Quest') })
  test('description defaults to empty',      () => expect(makeAdventure().description).toBe(''))
  test('metadata defaults to frozen {}',     () => expect(Object.isFrozen(makeAdventure().metadata)).toBe(true))
  test('state is AdventureState',            () => expect(makeAdventure().state).toBeInstanceOf(AdventureState))
  test('objectives is AdventureCollection',  () => expect(makeAdventure().objectives).toBeInstanceOf(AdventureCollection))

  test('rejects invalid state',              () => expect(() => new Adventure({ id: 'a', name: 'Q' }, {}, new AdventureCollection())).toThrow(InvalidAdventureError))
  test('rejects invalid objectives',         () => expect(() => new Adventure({ id: 'a', name: 'Q' }, new AdventureState(), {})).toThrow(InvalidAdventureError))

  describe('addObjective()', () => {
    test('returns new Adventure with objective', () => expect(makeAdventure().addObjective(makeObjective()).objectives.has('obj1')).toBe(true))
    test('original unchanged',                   () => { const a = makeAdventure(); a.addObjective(makeObjective()); expect(a.objectives.size()).toBe(0) })
    test('throws DuplicateObjectiveError',        () => {
      const a = makeAdventure().addObjective(makeObjective())
      expect(() => a.addObjective(makeObjective())).toThrow(DuplicateObjectiveError)
    })
    test('rejects non-AdventureObjective',        () => expect(() => makeAdventure().addObjective({ id: 'x' })).toThrow(InvalidAdventureError))
  })

  describe('removeObjective()', () => {
    test('removes objective',                 () => expect(makeAdventure().addObjective(makeObjective()).removeObjective('obj1').objectives.has('obj1')).toBe(false))
    test('throws ObjectiveNotFoundError',     () => expect(() => makeAdventure().removeObjective('nope')).toThrow(ObjectiveNotFoundError))
    test('original unchanged',               () => {
      const a = makeAdventure().addObjective(makeObjective())
      a.removeObjective('obj1')
      expect(a.objectives.has('obj1')).toBe(true)
    })
  })

  describe('completeObjective()', () => {
    test('marks objective completed',         () => {
      const a = makeAdventure().addObjective(makeObjective()).completeObjective('obj1')
      expect(a.objectives.get('obj1').completed).toBe(true)
    })
    test('returns new Adventure',             () => {
      const a = makeAdventure().addObjective(makeObjective())
      expect(a.completeObjective('obj1')).not.toBe(a)
    })
    test('throws ObjectiveNotFoundError',     () => expect(() => makeAdventure().completeObjective('nope')).toThrow(ObjectiveNotFoundError))
  })

  describe('updateState()', () => {
    test('returns new Adventure with state',  () => {
      const s = new AdventureState({ status: ADVENTURE_STATUS.ACTIVE })
      expect(makeAdventure().updateState(s).state.status).toBe(ADVENTURE_STATUS.ACTIVE)
    })
    test('rejects invalid state',             () => expect(() => makeAdventure().updateState({})).toThrow(InvalidAdventureError))
    test('original unchanged',                () => {
      const a = makeAdventure()
      a.updateState(new AdventureState({ status: ADVENTURE_STATUS.ACTIVE }))
      expect(a.state.status).toBe(ADVENTURE_STATUS.IDLE)
    })
  })

  describe('snapshot()', () => {
    test('returns frozen plain object',       () => expect(Object.isFrozen(makeAdventure().snapshot())).toBe(true))
    test('contains id, name, state, objectives', () => {
      const snap = makeAdventure().snapshot()
      expect(snap.id).toBe('adv1')
      expect(snap.name).toBe('The Quest')
      expect(snap.state.status).toBe(ADVENTURE_STATUS.IDLE)
      expect(snap.objectives).toEqual([])
    })
    test('includes objective data',           () => {
      const snap = makeAdventure().addObjective(makeObjective()).snapshot()
      expect(snap.objectives[0].id).toBe('obj1')
      expect(snap.objectives[0].completed).toBe(false)
    })
    test('objectives array is frozen',        () => expect(Object.isFrozen(makeAdventure().snapshot().objectives)).toBe(true))
    test('state object is frozen',            () => expect(Object.isFrozen(makeAdventure().snapshot().state)).toBe(true))
  })

  describe('immutability', () => {
    test('chain of add/complete/remove is correct', () => {
      const o2 = makeObjective({ id: 'obj2', title: 'Escape' })
      const a  = makeAdventure()
        .addObjective(makeObjective())
        .addObjective(o2)
        .completeObjective('obj1')
        .removeObjective('obj1')
      expect(a.objectives.has('obj1')).toBe(false)
      expect(a.objectives.has('obj2')).toBe(true)
    })
    test('cannot assign to Adventure directly', () => {
      expect(() => { makeAdventure().foo = 'bar' }).toThrow()
    })
  })
})
