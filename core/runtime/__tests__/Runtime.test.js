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

import { Module }               from '../../modules/Module.js'
import { ModuleRegistry }       from '../../modules/ModuleRegistry.js'
import { ErreurModuleManager }  from '../../modules/ModuleManager.js'
import { MODULE_STATES }        from '../../modules/ModuleState.js'
import { EventBus }             from '../../events/EventBus.js'

// ─── Modules de test ────────────────────────────────────────────────────────
//
// Sous-classes concretes de l'abstraction Module, definies uniquement pour les
// tests. Elles n'ajoutent aucune logique metier : elles se contentent de tracer
// l'ordre des appels du cycle de vie.

/** Module qui enregistre l'ordre de ses transitions dans un journal partage. */
class TracingModule extends Module {
  constructor(name, journal) {
    super(name)
    this._journal = journal
  }
  async _initialize() { this._journal.push(`${this.name}:initialize`) }
  async _start()      { this._journal.push(`${this.name}:start`) }
  async _stop()       { this._journal.push(`${this.name}:stop`) }
  async _dispose()    { this._journal.push(`${this.name}:dispose`) }
}

/** Module dont le demarrage echoue toujours. */
class FailingStartModule extends Module {
  async _initialize() {}
  async _start()      { throw new Error('demarrage impossible') }
  async _stop()       {}
  async _dispose()    {}
}

/** Construit un registre pre-rempli des modules fournis. */
function makeRegistry(...modules) {
  const registry = new ModuleRegistry()
  for (const module of modules) registry.register(module)
  return registry
}

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

// ─── Runtime — integration du systeme de modules ────────────────────────────

describe('Runtime — integration des modules', () => {
  test('accepte un registre injecte sans lever', () => {
    const registry = makeRegistry(new TracingModule('a', []))
    expect(() => new Runtime({ registry })).not.toThrow()
  })

  test('start() initialise puis demarre chaque module', async () => {
    const journal = []
    const runtime = new Runtime({ registry: makeRegistry(new TracingModule('a', journal)) })
    await runtime.start()
    expect(journal).toEqual(['a:initialize', 'a:start'])
  })

  test('start() amene chaque module a RUNNING', async () => {
    const module  = new TracingModule('a', [])
    const runtime = new Runtime({ registry: makeRegistry(module) })
    await runtime.start()
    expect(module.getState()).toBe(MODULE_STATES.RUNNING)
  })

  test('start() respecte l ordre d insertion des modules', async () => {
    const journal = []
    const runtime = new Runtime({
      registry: makeRegistry(new TracingModule('a', journal), new TracingModule('b', journal)),
    })
    await runtime.start()
    expect(journal).toEqual(['a:initialize', 'b:initialize', 'a:start', 'b:start'])
  })

  test('stop() arrete puis libere chaque module', async () => {
    const journal = []
    const runtime = new Runtime({ registry: makeRegistry(new TracingModule('a', journal)) })
    await runtime.start()
    journal.length = 0
    await runtime.stop()
    expect(journal).toEqual(['a:stop', 'a:dispose'])
  })

  test('stop() amene chaque module a DISPOSED', async () => {
    const module  = new TracingModule('a', [])
    const runtime = new Runtime({ registry: makeRegistry(module) })
    await runtime.start()
    await runtime.stop()
    expect(module.getState()).toBe(MODULE_STATES.DISPOSED)
  })

  test('stop() libere les modules en ordre inverse d insertion', async () => {
    const journal = []
    const runtime = new Runtime({
      registry: makeRegistry(new TracingModule('a', journal), new TracingModule('b', journal)),
    })
    await runtime.start()
    journal.length = 0
    await runtime.stop()
    expect(journal).toEqual(['b:stop', 'a:stop', 'b:dispose', 'a:dispose'])
  })

  test('cycle complet start → stop reste coherent pour l etat du runtime', async () => {
    const runtime = new Runtime({ registry: makeRegistry(new TracingModule('a', [])) })
    await runtime.start()
    expect(runtime.getState()).toBe(RUNTIME_STATES.RUNNING)
    await runtime.stop()
    expect(runtime.getState()).toBe(RUNTIME_STATES.STOPPED)
  })

  test('un runtime sans module demarre et s arrete normalement', async () => {
    const runtime = new Runtime()
    await runtime.start()
    expect(runtime.getState()).toBe(RUNTIME_STATES.RUNNING)
    await runtime.stop()
    expect(runtime.getState()).toBe(RUNTIME_STATES.STOPPED)
  })
})

// ─── Runtime — propagation des erreurs de modules ───────────────────────────

describe('Runtime — erreurs de modules', () => {
  test('start() propage une ErreurModuleManager si un module echoue', async () => {
    const runtime = new Runtime({ registry: makeRegistry(new FailingStartModule('fail')) })
    await expect(runtime.start()).rejects.toThrow(ErreurModuleManager)
  })

  test('start() n atteint pas RUNNING si un module echoue', async () => {
    const runtime = new Runtime({ registry: makeRegistry(new FailingStartModule('fail')) })
    await expect(runtime.start()).rejects.toThrow()
    expect(runtime.getState()).not.toBe(RUNTIME_STATES.RUNNING)
  })

  test('start() emet RUNTIME_EVENTS.ERROR avec l erreur en payload', async () => {
    const runtime = new Runtime({ registry: makeRegistry(new FailingStartModule('fail')) })
    let captured
    runtime.events.subscribe(RUNTIME_EVENTS.ERROR, (err) => { captured = err })
    await expect(runtime.start()).rejects.toThrow()
    expect(captured).toBeInstanceOf(ErreurModuleManager)
    expect(captured.moduleName).toBe('fail')
  })
})

// ─── Runtime — evenements de cycle de vie ───────────────────────────────────

describe('Runtime — evenements de cycle de vie', () => {
  test('expose le bus d evenements via events', () => {
    expect(new Runtime().events).toBeInstanceOf(EventBus)
  })

  test('utilise le bus injecte', () => {
    const bus = new EventBus()
    expect(new Runtime({ eventBus: bus }).events).toBe(bus)
  })

  test('emet STARTED apres un demarrage reussi', async () => {
    const runtime = new Runtime()
    let vu = false
    runtime.events.subscribe(RUNTIME_EVENTS.STARTED, () => { vu = true })
    await runtime.start()
    expect(vu).toBe(true)
  })

  test('emet STOPPED apres un arret reussi', async () => {
    const runtime = new Runtime()
    let vu = false
    runtime.events.subscribe(RUNTIME_EVENTS.STOPPED, () => { vu = true })
    await runtime.start()
    await runtime.stop()
    expect(vu).toBe(true)
  })

  test('emet PAUSED apres une mise en pause', async () => {
    const runtime = new Runtime()
    let vu = false
    runtime.events.subscribe(RUNTIME_EVENTS.PAUSED, () => { vu = true })
    await runtime.start()
    await runtime.pause()
    expect(vu).toBe(true)
  })

  test('emet RESUMED apres une reprise', async () => {
    const runtime = new Runtime()
    let vu = false
    runtime.events.subscribe(RUNTIME_EVENTS.RESUMED, () => { vu = true })
    await runtime.start()
    await runtime.pause()
    await runtime.resume()
    expect(vu).toBe(true)
  })

  test('n emet pas STARTED si le demarrage echoue', async () => {
    const runtime = new Runtime({ registry: makeRegistry(new FailingStartModule('fail')) })
    let vu = false
    runtime.events.subscribe(RUNTIME_EVENTS.STARTED, () => { vu = true })
    await expect(runtime.start()).rejects.toThrow()
    expect(vu).toBe(false)
  })
})
