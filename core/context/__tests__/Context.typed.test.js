/**
 * core/context/__tests__/Context.typed.test.js
 *
 * Sprint 12 — Exhaustive tests for the typed Context API.
 *
 * Coverage:
 *   - Typed getters          : getPlayer, getCharacter, getUniverse, getAdventure, getMemory
 *   - Typed setters          : withPlayer, withCharacter, withUniverse, withAdventure, withMemory
 *   - set() with typed keys  : delegates to typed path, validates instanceof
 *   - remove() typed keys    : clears typed slot, original unchanged
 *   - Validation             : each typed setter rejects wrong class
 *   - Snapshot               : calls each domain's snapshot(), JSON.stringify safe
 *   - Immutability           : every write returns a NEW Context
 *   - Backward compatibility : generic set/get/has/keys/values/entries/size/remove/merge/clone/toObject
 *   - Mixed API              : generic + typed keys coexist correctly
 *   - CONTEXT_KEYS           : declares ADVENTURE
 *   - Regression             : all original Context behaviours pass
 */

import { Context }             from '../Context.js'
import { CONTEXT_KEYS }        from '../ContextKeys.js'
import { InvalidContextKeyError, InvalidContextValueError } from '../ContextError.js'
import { InvalidPlayerError }    from '../../player/PlayerError.js'
import { InvalidCharacterError } from '../../character/CharacterError.js'
import { InvalidUniverseError }  from '../../universe/UniverseError.js'
import { InvalidAdventureError } from '../../adventure/AdventureError.js'
import { InvalidMemoryError }    from '../../memory/MemoryError.js'

import { createPlayer }    from '../../player/Player.js'
import { Character }       from '../../character/Character.js'
import { CharacterState }  from '../../character/CharacterState.js'
import { CharacterTraits } from '../../character/CharacterTraits.js'
import { CharacterRelations } from '../../character/CharacterRelations.js'
import { Memory }          from '../../memory/Memory.js'
import { createUniverse }  from '../../universe/Universe.js'
import { createAdventure } from '../../adventure/Adventure.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makePlayer    = () => createPlayer({ id: 'p1', name: 'Hero' })
const makeCharacter = () => new Character(
  { id: 'c1', name: 'Alice' },
  new CharacterState(),
  new CharacterTraits(),
  new CharacterRelations(),
  new Memory(),
)
const makeUniverse  = () => createUniverse({ id: 'u1', name: 'Middle Earth' })
const makeAdventure = () => createAdventure({ id: 'adv1', name: 'The Quest' })
const makeMemory    = () => new Memory()

// ─── CONTEXT_KEYS (regression + ADVENTURE addition) ──────────────────────────

describe('CONTEXT_KEYS', () => {
  test('declares PLAYER',    () => expect(typeof CONTEXT_KEYS.PLAYER).toBe('string'))
  test('declares CHARACTER', () => expect(typeof CONTEXT_KEYS.CHARACTER).toBe('string'))
  test('declares UNIVERSE',  () => expect(typeof CONTEXT_KEYS.UNIVERSE).toBe('string'))
  test('declares ADVENTURE', () => expect(typeof CONTEXT_KEYS.ADVENTURE).toBe('string'))
  test('declares MEMORY',    () => expect(typeof CONTEXT_KEYS.MEMORY).toBe('string'))
  test('is frozen',          () => expect(Object.isFrozen(CONTEXT_KEYS)).toBe(true))
})

// ─── Typed getters (empty state) ─────────────────────────────────────────────

describe('Typed getters — empty context', () => {
  const ctx = new Context()
  test('getPlayer() → undefined',    () => expect(ctx.getPlayer()).toBeUndefined())
  test('getCharacter() → undefined', () => expect(ctx.getCharacter()).toBeUndefined())
  test('getUniverse() → undefined',  () => expect(ctx.getUniverse()).toBeUndefined())
  test('getAdventure() → undefined', () => expect(ctx.getAdventure()).toBeUndefined())
  test('getMemory() → undefined',    () => expect(ctx.getMemory()).toBeUndefined())
})

// ─── Typed setters ────────────────────────────────────────────────────────────

describe('withPlayer()', () => {
  test('returns a new Context',           () => expect(new Context().withPlayer(makePlayer())).not.toBe(new Context()))
  test('getPlayer() returns the instance',() => {
    const p = makePlayer()
    expect(new Context().withPlayer(p).getPlayer()).toBe(p)
  })
  test('original unchanged',              () => { const c = new Context(); c.withPlayer(makePlayer()); expect(c.getPlayer()).toBeUndefined() })
  test('has(PLAYER) is true',             () => expect(new Context().withPlayer(makePlayer()).has(CONTEXT_KEYS.PLAYER)).toBe(true))
  test('get(PLAYER) returns the instance',() => {
    const p = makePlayer()
    expect(new Context().withPlayer(p).get(CONTEXT_KEYS.PLAYER)).toBe(p)
  })
})

describe('withCharacter()', () => {
  test('returns a new Context',              () => expect(new Context().withCharacter(makeCharacter())).not.toBe(new Context()))
  test('getCharacter() returns the instance',() => {
    const c = makeCharacter()
    expect(new Context().withCharacter(c).getCharacter()).toBe(c)
  })
  test('original unchanged',                 () => { const ctx = new Context(); ctx.withCharacter(makeCharacter()); expect(ctx.getCharacter()).toBeUndefined() })
  test('has(CHARACTER) is true',             () => expect(new Context().withCharacter(makeCharacter()).has(CONTEXT_KEYS.CHARACTER)).toBe(true))
})

describe('withUniverse()', () => {
  test('returns a new Context',             () => expect(new Context().withUniverse(makeUniverse())).not.toBe(new Context()))
  test('getUniverse() returns the instance',() => {
    const u = makeUniverse()
    expect(new Context().withUniverse(u).getUniverse()).toBe(u)
  })
  test('original unchanged',                () => { const ctx = new Context(); ctx.withUniverse(makeUniverse()); expect(ctx.getUniverse()).toBeUndefined() })
  test('has(UNIVERSE) is true',             () => expect(new Context().withUniverse(makeUniverse()).has(CONTEXT_KEYS.UNIVERSE)).toBe(true))
})

describe('withAdventure()', () => {
  test('returns a new Context',              () => expect(new Context().withAdventure(makeAdventure())).not.toBe(new Context()))
  test('getAdventure() returns the instance',() => {
    const a = makeAdventure()
    expect(new Context().withAdventure(a).getAdventure()).toBe(a)
  })
  test('original unchanged',                 () => { const ctx = new Context(); ctx.withAdventure(makeAdventure()); expect(ctx.getAdventure()).toBeUndefined() })
  test('has(ADVENTURE) is true',             () => expect(new Context().withAdventure(makeAdventure()).has(CONTEXT_KEYS.ADVENTURE)).toBe(true))
})

describe('withMemory()', () => {
  test('returns a new Context',           () => expect(new Context().withMemory(makeMemory())).not.toBe(new Context()))
  test('getMemory() returns the instance',() => {
    const m = makeMemory()
    expect(new Context().withMemory(m).getMemory()).toBe(m)
  })
  test('original unchanged',              () => { const ctx = new Context(); ctx.withMemory(makeMemory()); expect(ctx.getMemory()).toBeUndefined() })
  test('has(MEMORY) is true',             () => expect(new Context().withMemory(makeMemory()).has(CONTEXT_KEYS.MEMORY)).toBe(true))
})

// ─── Validation ───────────────────────────────────────────────────────────────

describe('Typed setter validation', () => {
  test('withPlayer({}) throws InvalidPlayerError',       () => expect(() => new Context().withPlayer({})).toThrow(InvalidPlayerError))
  test('withPlayer(null) throws',                        () => expect(() => new Context().withPlayer(null)).toThrow(InvalidPlayerError))
  test('withCharacter({}) throws InvalidCharacterError', () => expect(() => new Context().withCharacter({})).toThrow(InvalidCharacterError))
  test('withUniverse({}) throws InvalidUniverseError',   () => expect(() => new Context().withUniverse({})).toThrow(InvalidUniverseError))
  test('withAdventure({}) throws InvalidAdventureError', () => expect(() => new Context().withAdventure({})).toThrow(InvalidAdventureError))
  test('withMemory({}) throws InvalidMemoryError',       () => expect(() => new Context().withMemory({})).toThrow(InvalidMemoryError))
})

describe('set() with typed keys validates instanceof', () => {
  test('set(PLAYER, Player) succeeds',        () => expect(() => new Context().set(CONTEXT_KEYS.PLAYER, makePlayer())).not.toThrow())
  test('set(PLAYER, {}) throws',              () => expect(() => new Context().set(CONTEXT_KEYS.PLAYER, {})).toThrow(InvalidPlayerError))
  test('set(CHARACTER, Character) succeeds',  () => expect(() => new Context().set(CONTEXT_KEYS.CHARACTER, makeCharacter())).not.toThrow())
  test('set(UNIVERSE, Universe) succeeds',    () => expect(() => new Context().set(CONTEXT_KEYS.UNIVERSE, makeUniverse())).not.toThrow())
  test('set(ADVENTURE, Adventure) succeeds',  () => expect(() => new Context().set(CONTEXT_KEYS.ADVENTURE, makeAdventure())).not.toThrow())
  test('set(MEMORY, Memory) succeeds',        () => expect(() => new Context().set(CONTEXT_KEYS.MEMORY, makeMemory())).not.toThrow())
})

// ─── remove() for typed keys ─────────────────────────────────────────────────

describe('remove() typed keys', () => {
  test('removes player slot',            () => {
    const ctx = new Context().withPlayer(makePlayer()).remove(CONTEXT_KEYS.PLAYER)
    expect(ctx.getPlayer()).toBeUndefined()
    expect(ctx.has(CONTEXT_KEYS.PLAYER)).toBe(false)
  })
  test('original unchanged after remove',() => {
    const ctx = new Context().withPlayer(makePlayer())
    ctx.remove(CONTEXT_KEYS.PLAYER)
    expect(ctx.has(CONTEXT_KEYS.PLAYER)).toBe(true)
  })
  test('removes adventure slot',         () => {
    const ctx = new Context().withAdventure(makeAdventure()).remove(CONTEXT_KEYS.ADVENTURE)
    expect(ctx.getAdventure()).toBeUndefined()
  })
})

// ─── Snapshot ─────────────────────────────────────────────────────────────────

describe('Context snapshot()', () => {
  test('returns frozen object',           () => expect(Object.isFrozen(new Context().snapshot())).toBe(true))
  test('empty context snapshot is {}',    () => expect(new Context().snapshot()).toEqual({}))

  test('player slot uses Player.snapshot()', () => {
    const p    = makePlayer()
    const snap = new Context().withPlayer(p).snapshot()
    expect(snap.player).toBeDefined()
    expect(snap.player.id).toBe('p1')
    expect(snap.player.name).toBe('Hero')
    expect(Object.isFrozen(snap.player)).toBe(true)
  })

  test('character slot uses Character.snapshot()', () => {
    const snap = new Context().withCharacter(makeCharacter()).snapshot()
    expect(snap.character.id).toBe('c1')
  })

  test('universe slot uses Universe.snapshot()', () => {
    const snap = new Context().withUniverse(makeUniverse()).snapshot()
    expect(snap.universe.id).toBe('u1')
    expect(snap.universe.name).toBe('Middle Earth')
  })

  test('adventure slot uses Adventure.snapshot()', () => {
    const snap = new Context().withAdventure(makeAdventure()).snapshot()
    expect(snap.adventure.id).toBe('adv1')
  })

  test('memory slot uses Memory.snapshot()', () => {
    const snap = new Context().withMemory(makeMemory()).snapshot()
    expect(Array.isArray(snap.memory)).toBe(true)
  })

  test('generic keys appear alongside typed keys', () => {
    const snap = new Context()
      .set('score', 42)
      .withPlayer(makePlayer())
      .snapshot()
    expect(snap.score).toBe(42)
    expect(snap.player.id).toBe('p1')
  })

  test('no domain instance reference escapes snapshot', () => {
    const p    = makePlayer()
    const snap = new Context().withPlayer(p).snapshot()
    expect(snap.player).not.toBe(p)
  })
})

// ─── JSON serialization ───────────────────────────────────────────────────────

describe('Context serialization', () => {
  test('empty snapshot is JSON-safe',           () => expect(() => JSON.stringify(new Context().snapshot())).not.toThrow())
  test('snapshot with all domains is JSON-safe', () => {
    const snap = new Context()
      .withPlayer(makePlayer())
      .withCharacter(makeCharacter())
      .withUniverse(makeUniverse())
      .withAdventure(makeAdventure())
      .withMemory(makeMemory())
      .snapshot()
    expect(() => JSON.stringify(snap)).not.toThrow()
  })
  test('snapshot with generic keys is JSON-safe', () => {
    const snap = new Context().set('x', { nested: [1, 2, 3] }).snapshot()
    expect(() => JSON.stringify(snap)).not.toThrow()
  })
})

// ─── Immutability ─────────────────────────────────────────────────────────────

describe('Context immutability', () => {
  test('Context is frozen',                () => expect(Object.isFrozen(new Context())).toBe(true))
  test('withPlayer returns different ref', () => {
    const c = new Context()
    expect(c.withPlayer(makePlayer())).not.toBe(c)
  })
  test('chaining all typed setters',       () => {
    const ctx = new Context()
      .withPlayer(makePlayer())
      .withCharacter(makeCharacter())
      .withUniverse(makeUniverse())
      .withAdventure(makeAdventure())
      .withMemory(makeMemory())
    expect(ctx.getPlayer()).toBeDefined()
    expect(ctx.getCharacter()).toBeDefined()
    expect(ctx.getUniverse()).toBeDefined()
    expect(ctx.getAdventure()).toBeDefined()
    expect(ctx.getMemory()).toBeDefined()
  })
  test('original context unchanged after chain', () => {
    const base = new Context()
    base.withPlayer(makePlayer()).withMemory(makeMemory())
    expect(base.getPlayer()).toBeUndefined()
    expect(base.getMemory()).toBeUndefined()
  })
})

// ─── Mixed generic + typed API ────────────────────────────────────────────────

describe('Mixed generic + typed API', () => {
  test('size() counts both bags',        () => {
    const ctx = new Context().set('x', 1).withPlayer(makePlayer())
    expect(ctx.size()).toBe(2)
  })
  test('keys() lists both bags',         () => {
    const ctx = new Context().set('score', 1).withPlayer(makePlayer())
    expect(ctx.keys()).toContain('score')
    expect(ctx.keys()).toContain(CONTEXT_KEYS.PLAYER)
  })
  test('entries() lists both bags',      () => {
    const ctx   = new Context().set('x', 1).withMemory(makeMemory())
    const keys  = ctx.entries().map(([k]) => k)
    expect(keys).toContain('x')
    expect(keys).toContain(CONTEXT_KEYS.MEMORY)
  })
  test('clone() preserves typed slots',  () => {
    const p   = makePlayer()
    const ctx = new Context().withPlayer(p).clone()
    expect(ctx.getPlayer()).toBe(p)
  })
  test('merge() does not overwrite typed slots', () => {
    const p   = makePlayer()
    const ctx = new Context().withPlayer(p).merge({ player: { id: 'x', name: 'Fake' } })
    expect(ctx.getPlayer()).toBe(p)
  })
})

// ─── Backward compatibility ───────────────────────────────────────────────────

describe('Backward compatibility — generic API', () => {
  test('set/get round-trip',              () => expect(new Context().set('k', 42).get('k')).toBe(42))
  test('has() true after set',            () => expect(new Context().set('k', 1).has('k')).toBe(true))
  test('has() false when absent',         () => expect(new Context().has('k')).toBe(false))
  test('remove() drops key',              () => expect(new Context().set('k', 1).remove('k').has('k')).toBe(false))
  test('merge() adds keys',               () => expect(new Context().merge({ a: 1, b: 2 }).size()).toBe(2))
  test('clone() produces independent ctx',() => {
    const a = new Context().set('x', 1)
    const b = a.clone()
    expect(b.get('x')).toBe(1)
    expect(b).not.toBe(a)
  })
  test('toObject() returns frozen plain object', () => {
    const obj = new Context().set('x', 1).toObject()
    expect(obj.x).toBe(1)
    expect(Object.isFrozen(obj)).toBe(true)
  })
  test('keys() returns frozen array',     () => expect(Object.isFrozen(new Context().set('k', 1).keys())).toBe(true))
  test('values() returns frozen array',   () => expect(Object.isFrozen(new Context().set('k', 1).values())).toBe(true))
  test('entries() returns frozen array',  () => expect(Object.isFrozen(new Context().set('k', 1).entries())).toBe(true))
  test('set with undefined value throws', () => expect(() => new Context().set('k', undefined)).toThrow(InvalidContextValueError))
  test('set with invalid key throws',     () => expect(() => new Context().set('', 1)).toThrow(InvalidContextKeyError))
  test('get returns deep-frozen copy',    () => {
    const obj = { a: { b: 1 } }
    const val = new Context().set('x', obj).get('x')
    expect(Object.isFrozen(val)).toBe(true)
    expect(Object.isFrozen(val.a)).toBe(true)
  })
})
