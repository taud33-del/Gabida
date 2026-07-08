/**
 * core/context/__tests__/Context.test.js
 *
 * Exhaustive tests for the Context system.
 *
 * Coverage:
 *   - CONTEXT_KEYS      : constants, frozen
 *   - ContextError      : typed hierarchy, properties
 *   - ContextValidator  : validateKey, validateValue, hasKey, isContextObject
 *   - ContextSnapshot   : clone, freeze, snapshot — isolation, deep behaviour
 *   - Context           : get, has, set, remove, merge, keys, values, entries,
 *                         toObject, clone, size, immutability, reference safety,
 *                         empty context, nested objects, large context,
 *                         typed error propagation
 */

import { CONTEXT_KEYS }            from '../ContextKeys.js'
import {
  ContextError,
  InvalidContextKeyError,
  ContextFrozenError,
  InvalidContextValueError,
  ContextValidationError,
}                                  from '../ContextError.js'
import {
  validateKey,
  validateValue,
  hasKey,
  isContextObject,
}                                  from '../ContextValidator.js'
import { clone, freeze, snapshot } from '../ContextSnapshot.js'
import { Context }                 from '../Context.js'

// ─── CONTEXT_KEYS ─────────────────────────────────────────────────────────────

describe('CONTEXT_KEYS', () => {
  test('declares PLAYER',    () => expect(typeof CONTEXT_KEYS.PLAYER).toBe('string'))
  test('declares CHARACTER', () => expect(typeof CONTEXT_KEYS.CHARACTER).toBe('string'))
  test('declares UNIVERSE',  () => expect(typeof CONTEXT_KEYS.UNIVERSE).toBe('string'))
  test('declares MEMORY',    () => expect(typeof CONTEXT_KEYS.MEMORY).toBe('string'))
  test('declares VARIABLES', () => expect(typeof CONTEXT_KEYS.VARIABLES).toBe('string'))
  test('declares FLAGS',     () => expect(typeof CONTEXT_KEYS.FLAGS).toBe('string'))
  test('declares SERVICES',  () => expect(typeof CONTEXT_KEYS.SERVICES).toBe('string'))
  test('declares SESSION',   () => expect(typeof CONTEXT_KEYS.SESSION).toBe('string'))
  test('declares RUNTIME',   () => expect(typeof CONTEXT_KEYS.RUNTIME).toBe('string'))
  test('declares METADATA',  () => expect(typeof CONTEXT_KEYS.METADATA).toBe('string'))
  test('is frozen',          () => expect(Object.isFrozen(CONTEXT_KEYS)).toBe(true))
})

// ─── ContextError ─────────────────────────────────────────────────────────────

describe('ContextError', () => {
  test('InvalidContextKeyError extends ContextError', () =>
    expect(new InvalidContextKeyError('')).toBeInstanceOf(ContextError))
  test('ContextFrozenError extends ContextError', () =>
    expect(new ContextFrozenError()).toBeInstanceOf(ContextError))
  test('InvalidContextValueError extends ContextError', () =>
    expect(new InvalidContextValueError('k', undefined)).toBeInstanceOf(ContextError))
  test('ContextValidationError extends ContextError', () =>
    expect(new ContextValidationError('r', null)).toBeInstanceOf(ContextError))

  test('InvalidContextKeyError stores key', () => {
    const err = new InvalidContextKeyError(42)
    expect(err.key).toBe(42)
  })
  test('InvalidContextValueError stores key and value', () => {
    const err = new InvalidContextValueError('k', undefined)
    expect(err.key).toBe('k')
    expect(err.value).toBeUndefined()
  })
  test('ContextValidationError stores reason and value', () => {
    const err = new ContextValidationError('reason', null)
    expect(err.reason).toBe('reason')
    expect(err.value).toBeNull()
  })
})

// ─── ContextValidator ─────────────────────────────────────────────────────────

describe('ContextValidator', () => {
  describe('validateKey', () => {
    test('accepts non-empty string',     () => expect(() => validateKey('k')).not.toThrow())
    test('rejects empty string',         () => expect(() => validateKey('')).toThrow(InvalidContextKeyError))
    test('rejects whitespace string',    () => expect(() => validateKey('  ')).toThrow(InvalidContextKeyError))
    test('rejects null',                 () => expect(() => validateKey(null)).toThrow(InvalidContextKeyError))
    test('rejects number',               () => expect(() => validateKey(42)).toThrow(InvalidContextKeyError))
  })

  describe('validateValue', () => {
    test('accepts null',                 () => expect(() => validateValue('k', null)).not.toThrow())
    test('accepts object',               () => expect(() => validateValue('k', {})).not.toThrow())
    test('accepts string',               () => expect(() => validateValue('k', 'v')).not.toThrow())
    test('accepts zero',                 () => expect(() => validateValue('k', 0)).not.toThrow())
    test('accepts false',                () => expect(() => validateValue('k', false)).not.toThrow())
    test('rejects undefined',            () => expect(() => validateValue('k', undefined)).toThrow(InvalidContextValueError))
  })

  describe('hasKey', () => {
    test('true when key exists',         () => expect(hasKey({ a: 1 }, 'a')).toBe(true))
    test('false when key absent',        () => expect(hasKey({ a: 1 }, 'b')).toBe(false))
    test('false for inherited keys',     () => expect(hasKey({}, 'toString')).toBe(false))
  })

  describe('isContextObject', () => {
    test('true for plain object',        () => expect(isContextObject({})).toBe(true))
    test('false for null',               () => expect(isContextObject(null)).toBe(false))
    test('false for array',              () => expect(isContextObject([])).toBe(false))
    test('false for string',             () => expect(isContextObject('s')).toBe(false))
    test('false for number',             () => expect(isContextObject(42)).toBe(false))
  })
})

// ─── ContextSnapshot ──────────────────────────────────────────────────────────

describe('ContextSnapshot', () => {
  describe('clone', () => {
    test('clones primitives as-is',      () => expect(clone(42)).toBe(42))
    test('clones null as null',          () => expect(clone(null)).toBeNull())
    test('clones objects deeply',        () => {
      const obj = { a: { b: 1 } }
      const c   = clone(obj)
      expect(c).toEqual(obj)
      expect(c).not.toBe(obj)
      expect(c.a).not.toBe(obj.a)
    })
    test('clones arrays deeply', () => {
      const arr = [{ x: 1 }, { x: 2 }]
      const c   = clone(arr)
      expect(c).toEqual(arr)
      expect(c[0]).not.toBe(arr[0])
    })
  })

  describe('freeze', () => {
    test('freezes a plain object',       () => {
      const obj = freeze({ a: 1 })
      expect(Object.isFrozen(obj)).toBe(true)
    })
    test('freezes nested objects',       () => {
      const obj = freeze({ a: { b: 2 } })
      expect(Object.isFrozen(obj.a)).toBe(true)
    })
    test('is idempotent on frozen input', () => {
      const obj = Object.freeze({ x: 1 })
      expect(() => freeze(obj)).not.toThrow()
    })
    test('returns primitives unchanged', () => {
      expect(freeze(42)).toBe(42)
      expect(freeze(null)).toBeNull()
    })
  })

  describe('snapshot', () => {
    test('returns deep-frozen clone', () => {
      const obj  = { a: { b: 3 } }
      const snap = snapshot(obj)
      expect(Object.isFrozen(snap)).toBe(true)
      expect(Object.isFrozen(snap.a)).toBe(true)
      expect(snap).not.toBe(obj)
    })
    test('shares no references with input', () => {
      const obj  = { a: { b: 4 } }
      const snap = snapshot(obj)
      obj.a.b = 999
      expect(snap.a.b).toBe(4)
    })
  })
})

// ─── Context ──────────────────────────────────────────────────────────────────

describe('Context', () => {
  describe('constructor', () => {
    test('creates an empty context',     () => expect(new Context().size()).toBe(0))
    test('accepts initial object',       () => {
      const ctx = new Context({ player: 'Alice' })
      expect(ctx.get('player')).toBe('Alice')
    })
    test('does not share reference with initial', () => {
      const init = { x: { y: 1 } }
      const ctx  = new Context(init)
      init.x.y = 999
      expect(ctx.get('x')).toEqual({ y: 1 })
    })
    test('context itself is frozen',     () => {
      expect(Object.isFrozen(new Context())).toBe(true)
    })
  })

  describe('get()', () => {
    test('returns stored value',         () => expect(new Context({ a: 1 }).get('a')).toBe(1))
    test('returns undefined for absent key', () => expect(new Context().get('missing')).toBeUndefined())
    test('returns deep-frozen value for objects', () => {
      const ctx = new Context({ obj: { x: 1 } })
      expect(Object.isFrozen(ctx.get('obj'))).toBe(true)
    })
    test('returned object shares no reference', () => {
      const ctx = new Context({ obj: { x: 1 } })
      const val = ctx.get('obj')
      expect(val).toEqual({ x: 1 })
    })
    test('rejects invalid key',          () => expect(() => new Context().get('')).toThrow(InvalidContextKeyError))
  })

  describe('has()', () => {
    test('true for existing key',        () => expect(new Context({ a: 1 }).has('a')).toBe(true))
    test('false for absent key',         () => expect(new Context().has('missing')).toBe(false))
    test('rejects invalid key',          () => expect(() => new Context().has('')).toThrow(InvalidContextKeyError))
  })

  describe('set()', () => {
    test('returns a new Context',        () => {
      const ctx  = new Context()
      const ctx2 = ctx.set('a', 1)
      expect(ctx2).not.toBe(ctx)
      expect(ctx2).toBeInstanceOf(Context)
    })
    test('original is unchanged',        () => {
      const ctx = new Context({ a: 1 })
      ctx.set('a', 2)
      expect(ctx.get('a')).toBe(1)
    })
    test('new context has the new value', () => {
      const ctx2 = new Context().set('x', 42)
      expect(ctx2.get('x')).toBe(42)
    })
    test('value is deep-cloned on set',  () => {
      const obj  = { n: 1 }
      const ctx  = new Context().set('obj', obj)
      obj.n = 999
      expect(ctx.get('obj')).toEqual({ n: 1 })
    })
    test('rejects invalid key',          () => expect(() => new Context().set('', 1)).toThrow(InvalidContextKeyError))
    test('rejects undefined value',      () => expect(() => new Context().set('k', undefined)).toThrow(InvalidContextValueError))
  })

  describe('remove()', () => {
    test('returns a new Context',        () => {
      const ctx = new Context({ a: 1 })
      expect(ctx.remove('a')).not.toBe(ctx)
    })
    test('new context lacks the key',    () => {
      const ctx2 = new Context({ a: 1 }).remove('a')
      expect(ctx2.has('a')).toBe(false)
    })
    test('original is unchanged',        () => {
      const ctx = new Context({ a: 1 })
      ctx.remove('a')
      expect(ctx.has('a')).toBe(true)
    })
    test('removing absent key is safe',  () => {
      expect(() => new Context().remove('missing')).not.toThrow()
    })
    test('rejects invalid key',          () => expect(() => new Context().remove('')).toThrow(InvalidContextKeyError))
  })

  describe('merge()', () => {
    test('returns a new Context',        () => {
      const ctx = new Context({ a: 1 })
      expect(ctx.merge({ b: 2 })).not.toBe(ctx)
    })
    test('merges keys into new context', () => {
      const ctx2 = new Context({ a: 1 }).merge({ b: 2 })
      expect(ctx2.get('a')).toBe(1)
      expect(ctx2.get('b')).toBe(2)
    })
    test('overwrites existing keys',     () => {
      const ctx2 = new Context({ a: 1 }).merge({ a: 99 })
      expect(ctx2.get('a')).toBe(99)
    })
    test('original is unchanged',        () => {
      const ctx = new Context({ a: 1 })
      ctx.merge({ a: 99 })
      expect(ctx.get('a')).toBe(1)
    })
    test('input object is deep-cloned',  () => {
      const obj  = { n: 1 }
      const ctx  = new Context().merge({ obj })
      obj.n = 999
      expect(ctx.get('obj')).toEqual({ n: 1 })
    })
  })

  describe('clone()', () => {
    test('returns a new Context',        () => {
      const ctx = new Context({ a: 1 })
      expect(ctx.clone()).not.toBe(ctx)
    })
    test('clone has identical data',     () => {
      const ctx = new Context({ a: 1, b: 2 })
      expect(ctx.clone().toObject()).toEqual(ctx.toObject())
    })
    test('clone shares no references',   () => {
      const ctx  = new Context({ obj: { x: 1 } })
      const ctx2 = ctx.clone()
      expect(ctx.get('obj')).not.toBe(ctx2.get('obj'))
    })
  })

  describe('keys() / values() / entries()', () => {
    test('keys() returns all keys',      () => {
      const ctx = new Context({ a: 1, b: 2 })
      expect([...ctx.keys()].sort()).toEqual(['a', 'b'])
    })
    test('values() returns frozen values', () => {
      const ctx = new Context({ obj: { x: 1 } })
      const vals = ctx.values()
      expect(Object.isFrozen(vals[0])).toBe(true)
    })
    test('entries() returns [key, value] pairs', () => {
      const ctx = new Context({ a: 1 })
      const entries = ctx.entries()
      expect(entries[0][0]).toBe('a')
      expect(entries[0][1]).toBe(1)
    })
    test('keys() result is frozen',      () => expect(Object.isFrozen(new Context().keys())).toBe(true))
    test('values() result is frozen',    () => expect(Object.isFrozen(new Context().values())).toBe(true))
    test('entries() result is frozen',   () => expect(Object.isFrozen(new Context().entries())).toBe(true))
  })

  describe('size()', () => {
    test('0 for empty context',          () => expect(new Context().size()).toBe(0))
    test('counts keys correctly',        () => expect(new Context({ a: 1, b: 2, c: 3 }).size()).toBe(3))
    test('decreases after remove',       () => expect(new Context({ a: 1 }).remove('a').size()).toBe(0))
  })

  describe('toObject()', () => {
    test('returns a plain frozen object', () => {
      const obj = new Context({ a: 1 }).toObject()
      expect(obj).toEqual({ a: 1 })
      expect(Object.isFrozen(obj)).toBe(true)
    })
    test('shares no reference with internal data', () => {
      const ctx = new Context({ obj: { x: 1 } })
      const obj = ctx.toObject()
      expect(obj.obj).not.toBe(ctx.get('obj'))
    })
  })

  describe('nested objects', () => {
    test('nested objects are stored correctly', () => {
      const ctx = new Context({ a: { b: { c: 42 } } })
      expect(ctx.get('a')).toEqual({ b: { c: 42 } })
    })
    test('nested get returns frozen snapshot', () => {
      const ctx = new Context({ a: { b: 1 } })
      expect(Object.isFrozen(ctx.get('a'))).toBe(true)
    })
  })

  describe('large context', () => {
    test('handles many keys', () => {
      let ctx = new Context()
      for (let i = 0; i < 50; i++) ctx = ctx.set(`key${i}`, i)
      expect(ctx.size()).toBe(50)
      expect(ctx.get('key49')).toBe(49)
    })
  })

  describe('immutability — reference safety', () => {
    test('cannot assign directly to context', () => {
      const ctx = new Context({ a: 1 })
      expect(() => { ctx.a = 2 }).toThrow()
    })
    test('set() on different keys produces independent contexts', () => {
      const base = new Context({ a: 1 })
      const c1   = base.set('b', 2)
      const c2   = base.set('c', 3)
      expect(c1.has('c')).toBe(false)
      expect(c2.has('b')).toBe(false)
    })
    test('chain of set() produces correct final value', () => {
      const ctx = new Context()
        .set('a', 1)
        .set('b', 2)
        .set('a', 99)
      expect(ctx.get('a')).toBe(99)
      expect(ctx.get('b')).toBe(2)
    })
  })
})

// ─── Context — slots d'infrastructure (variables / flags / metadata) ──────────

describe('Context — slots d\'infrastructure', () => {
  const cases = [
    ['variables', CONTEXT_KEYS.VARIABLES, 'getVariables', 'withVariables'],
    ['flags',     CONTEXT_KEYS.FLAGS,     'getFlags',     'withFlags'],
    ['metadata',  CONTEXT_KEYS.METADATA,  'getMetadata',  'withMetadata'],
  ]

  describe.each(cases)('%s', (_label, key, getter, setter) => {
    test(`${getter}() vaut undefined en l'absence de valeur`, () => {
      expect(new Context()[getter]()).toBeUndefined()
    })

    test(`${setter}() retourne un nouveau Context`, () => {
      const base = new Context()
      const next = base[setter]({ a: 1 })
      expect(next).toBeInstanceOf(Context)
      expect(next).not.toBe(base)
    })

    test(`${getter}() relit la valeur ecrite par ${setter}()`, () => {
      const ctx = new Context()[setter]({ a: 1, b: 2 })
      expect(ctx[getter]()).toEqual({ a: 1, b: 2 })
    })

    test(`${getter}() renvoie un snapshot gele`, () => {
      const ctx = new Context()[setter]({ a: 1 })
      expect(Object.isFrozen(ctx[getter]())).toBe(true)
    })

    test(`${setter}() n'altere pas le Context d'origine`, () => {
      const base = new Context()
      base[setter]({ a: 1 })
      expect(base.has(key)).toBe(false)
    })

    test(`${setter}() isole la reference d'entree`, () => {
      const input = { a: 1 }
      const ctx = new Context()[setter](input)
      input.a = 99
      expect(ctx[getter]()).toEqual({ a: 1 })
    })

    test(`le slot apparait dans keys() et size()`, () => {
      const ctx = new Context()[setter]({ a: 1 })
      expect(ctx.keys()).toContain(key)
      expect(ctx.size()).toBe(1)
    })

    test.each([null, undefined, 42, 'x', [1, 2]])(
      `${setter}() rejette une valeur non-objet (%p)`,
      (bad) => {
        expect(() => new Context()[setter](bad)).toThrow(InvalidContextValueError)
      },
    )
  })

  test('les trois slots coexistent independamment', () => {
    const ctx = new Context()
      .withVariables({ v: 1 })
      .withFlags({ f: true })
      .withMetadata({ m: 'x' })
    expect(ctx.getVariables()).toEqual({ v: 1 })
    expect(ctx.getFlags()).toEqual({ f: true })
    expect(ctx.getMetadata()).toEqual({ m: 'x' })
    expect(ctx.size()).toBe(3)
  })

  test('withVariables() reste coherent avec get() generique', () => {
    const ctx = new Context().withVariables({ a: 1 })
    expect(ctx.get(CONTEXT_KEYS.VARIABLES)).toEqual({ a: 1 })
  })
})
