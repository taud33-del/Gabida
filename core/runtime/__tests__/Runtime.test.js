/**
 * core/runtime/__tests__/Runtime.test.js
 *
 * Tests de la fondation runtime de Gabida.
 *
 * Ces tests verifient uniquement :
 *   - l'instantiation du Runtime
 *   - l'etat initial
 *   - la presence des methodes publiques
 *   - les transitions de base du cycle de vie
 *   - le rejet des transitions illegales
 *
 * Aucun test de comportement narratif.
 * Aucun appel a un provider.
 */

import { Runtime, ErreurTransitionRuntime } from '../Runtime.js'
import { RuntimeState }                     from '../RuntimeState.js'
import { RUNTIME_EVENTS }                   from '../RuntimeEvents.js'
import { isTransitionAllowed, getAllowedTransitions } from '../RuntimeLifecycle.js'
import { RUNTIME_STATES }                   from '../../../constants/RuntimeStates.js'

// ─── Runtime ──────────────────────────────────────────────────────────────────

describe('Runtime', () => {
  test('peut etre instancie sans argument', () => {
    expect(() => new Runtime()).not.toThrow()
  })

  test("l'etat initial est STOPPED", () => {
    const runtime = new Runtime()
    expect(runtime.getState()).toBe(RUNTIME_STATES.STOPPED)
  })

  test('expose la methode start()', () => {
    const runtime = new Runtime()
    expect(typeof runtime.start).toBe('function')
  })

  test('expose la methode stop()', () => {
    const runtime = new Runtime()
    expect(typeof runtime.stop).toBe('function')
  })

  test('expose la methode pause()', () => {
    const runtime = new Runtime()
    expect(typeof runtime.pause).toBe('function')
  })

  test('expose la methode resume()', () => {
    const runtime = new Runtime()
    expect(typeof runtime.resume).toBe('function')
  })

  test('expose la methode getState()', () => {
    const runtime = new Runtime()
    expect(typeof runtime.getState).toBe('function')
  })

  test('passe a RUNNING apres start()', async () => {
    const runtime = new Runtime()
    await runtime.start()
    expect(runtime.getState()).toBe(RUNTIME_STATES.RUNNING)
  })

  test('passe a STOPPED apres start() puis stop()', async () => {
    const runtime = new Runtime()
    await runtime.start()
    await runtime.stop()
    expect(runtime.getState()).toBe(RUNTIME_STATES.STOPPED)
  })

  test('passe a PAUSED apres start() puis pause()', async () => {
    const runtime = new Runtime()
    await runtime.start()
    await runtime.pause()
    expect(runtime.getState()).toBe(RUNTIME_STATES.PAUSED)
  })

  test('passe a RUNNING apres pause() puis resume()', async () => {
    const runtime = new Runtime()
    await runtime.start()
    await runtime.pause()
    await runtime.resume()
    expect(runtime.getState()).toBe(RUNTIME_STATES.RUNNING)
  })
})

// ─── RuntimeState ─────────────────────────────────────────────────────────────

describe('RuntimeState', () => {
  test("l'etat initial est STOPPED", () => {
    const state = new RuntimeState()
    expect(state.current).toBe(RUNTIME_STATES.STOPPED)
  })

  test('lance ErreurTransitionRuntime pour une transition illegale', () => {
    const state = new RuntimeState()
    expect(() => state.transition(RUNTIME_STATES.RUNNING)).toThrow(ErreurTransitionRuntime)
  })
})

// ─── RuntimeLifecycle ─────────────────────────────────────────────────────────

describe('RuntimeLifecycle', () => {
  test('STOPPED → STARTING est autorise', () => {
    expect(isTransitionAllowed(RUNTIME_STATES.STOPPED, RUNTIME_STATES.STARTING)).toBe(true)
  })

  test('STOPPED → RUNNING est interdit', () => {
    expect(isTransitionAllowed(RUNTIME_STATES.STOPPED, RUNTIME_STATES.RUNNING)).toBe(false)
  })

  test('getAllowedTransitions retourne un tableau', () => {
    expect(Array.isArray(getAllowedTransitions(RUNTIME_STATES.RUNNING))).toBe(true)
  })
})

// ─── RuntimeEvents ────────────────────────────────────────────────────────────

describe('RUNTIME_EVENTS', () => {
  test('declare STARTED', () => {
    expect(typeof RUNTIME_EVENTS.STARTED).toBe('string')
  })

  test('declare STOPPED', () => {
    expect(typeof RUNTIME_EVENTS.STOPPED).toBe('string')
  })

  test('declare PAUSED', () => {
    expect(typeof RUNTIME_EVENTS.PAUSED).toBe('string')
  })

  test('declare RESUMED', () => {
    expect(typeof RUNTIME_EVENTS.RESUMED).toBe('string')
  })

  test('declare ERROR', () => {
    expect(typeof RUNTIME_EVENTS.ERROR).toBe('string')
  })
})
