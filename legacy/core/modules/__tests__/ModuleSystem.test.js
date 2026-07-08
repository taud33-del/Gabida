/**
 * core/modules/__tests__/ModuleSystem.test.js
 *
 * Tests exhaustifs du systeme de modules Gabida.
 *
 * Couverture :
 *   - ModuleState     : constantes presentes
 *   - ModuleEvents    : identifiants presents
 *   - ModuleLifecycle : transitions valides et invalides
 *   - Module          : instanciation, cycle de vie, transitions illegales,
 *                       double-initialize, double-start, double-stop, dispose
 *   - ModuleRegistry  : enregistrement, doublon, inconnu, getAll, clear
 *   - ModuleManager   : cycle complet, erreur propagee, operations collectives,
 *                       ordre inverse pour stop/dispose, plusieurs modules
 */

import { MODULE_STATES }                         from '../ModuleState.js'
import { MODULE_EVENTS }                         from '../ModuleEvents.js'
import { isTransitionAllowed, getAllowedTransitions } from '../ModuleLifecycle.js'
import {
  Module,
  ErreurTransitionModule,
  ErreurModuleAbstrait,
}                                                from '../Module.js'
import {
  ModuleRegistry,
  ErreurModuleDejaPresentDansRegistre,
  ErreurModuleInconnu,
}                                                from '../ModuleRegistry.js'
import { ModuleManager, ErreurModuleManager }    from '../ModuleManager.js'
import { EventBus }                              from '../../events/EventBus.js'

// ─── Stub concret minimal ─────────────────────────────────────────────────────

/**
 * Sous-classe concrete de Module utilisee uniquement dans les tests.
 * Enregistre les appels pour verifier l'ordre des operations.
 */
class StubModule extends Module {
  constructor(name = 'stub') {
    super(name)
    this.calls = []
  }
  async _initialize() { this.calls.push('initialize') }
  async _start()      { this.calls.push('start') }
  async _stop()       { this.calls.push('stop') }
  async _dispose()    { this.calls.push('dispose') }
}

/**
 * Sous-classe qui echoue intentionnellement lors de _start().
 */
class StubModuleEchouant extends Module {
  constructor(name = 'stub-echouant') { super(name) }
  async _initialize() {}
  async _start()      { throw new Error('echec intentionnel') }
  async _stop()       {}
  async _dispose()    {}
}

// ─── MODULE_STATES ────────────────────────────────────────────────────────────

describe('MODULE_STATES', () => {
  test('declare CREATED',     () => expect(typeof MODULE_STATES.CREATED).toBe('string'))
  test('declare INITIALIZED', () => expect(typeof MODULE_STATES.INITIALIZED).toBe('string'))
  test('declare STARTING',    () => expect(typeof MODULE_STATES.STARTING).toBe('string'))
  test('declare RUNNING',     () => expect(typeof MODULE_STATES.RUNNING).toBe('string'))
  test('declare STOPPING',    () => expect(typeof MODULE_STATES.STOPPING).toBe('string'))
  test('declare STOPPED',     () => expect(typeof MODULE_STATES.STOPPED).toBe('string'))
  test('declare DISPOSED',    () => expect(typeof MODULE_STATES.DISPOSED).toBe('string'))
  test('declare ERROR',       () => expect(typeof MODULE_STATES.ERROR).toBe('string'))
  test('est gele (frozen)',   () => expect(Object.isFrozen(MODULE_STATES)).toBe(true))
})

// ─── MODULE_EVENTS ────────────────────────────────────────────────────────────

describe('MODULE_EVENTS', () => {
  test('declare INITIALIZED', () => expect(typeof MODULE_EVENTS.INITIALIZED).toBe('string'))
  test('declare STARTED',     () => expect(typeof MODULE_EVENTS.STARTED).toBe('string'))
  test('declare STOPPED',     () => expect(typeof MODULE_EVENTS.STOPPED).toBe('string'))
  test('declare DISPOSED',    () => expect(typeof MODULE_EVENTS.DISPOSED).toBe('string'))
  test('declare ERROR',       () => expect(typeof MODULE_EVENTS.ERROR).toBe('string'))
  test('est gele (frozen)',   () => expect(Object.isFrozen(MODULE_EVENTS)).toBe(true))
})

// ─── ModuleLifecycle ──────────────────────────────────────────────────────────

describe('ModuleLifecycle', () => {
  describe('isTransitionAllowed', () => {
    test('CREATED → INITIALIZED est autorise',   () =>
      expect(isTransitionAllowed(MODULE_STATES.CREATED, MODULE_STATES.INITIALIZED)).toBe(true))
    test('INITIALIZED → STARTING est autorise',  () =>
      expect(isTransitionAllowed(MODULE_STATES.INITIALIZED, MODULE_STATES.STARTING)).toBe(true))
    test('STARTING → RUNNING est autorise',      () =>
      expect(isTransitionAllowed(MODULE_STATES.STARTING, MODULE_STATES.RUNNING)).toBe(true))
    test('RUNNING → STOPPING est autorise',      () =>
      expect(isTransitionAllowed(MODULE_STATES.RUNNING, MODULE_STATES.STOPPING)).toBe(true))
    test('STOPPING → STOPPED est autorise',      () =>
      expect(isTransitionAllowed(MODULE_STATES.STOPPING, MODULE_STATES.STOPPED)).toBe(true))
    test('STOPPED → DISPOSED est autorise',      () =>
      expect(isTransitionAllowed(MODULE_STATES.STOPPED, MODULE_STATES.DISPOSED)).toBe(true))
    test('tout etat → ERROR est autorise (sauf DISPOSED)', () =>
      expect(isTransitionAllowed(MODULE_STATES.RUNNING, MODULE_STATES.ERROR)).toBe(true))
    test('DISPOSED → tout est interdit',         () =>
      expect(isTransitionAllowed(MODULE_STATES.DISPOSED, MODULE_STATES.RUNNING)).toBe(false))
    test('CREATED → RUNNING est interdit',       () =>
      expect(isTransitionAllowed(MODULE_STATES.CREATED, MODULE_STATES.RUNNING)).toBe(false))
    test('RUNNING → INITIALIZED est interdit',   () =>
      expect(isTransitionAllowed(MODULE_STATES.RUNNING, MODULE_STATES.INITIALIZED)).toBe(false))
  })

  describe('getAllowedTransitions', () => {
    test('retourne un tableau pour RUNNING',  () =>
      expect(Array.isArray(getAllowedTransitions(MODULE_STATES.RUNNING))).toBe(true))
    test('retourne tableau vide pour DISPOSED', () =>
      expect(getAllowedTransitions(MODULE_STATES.DISPOSED)).toEqual([]))
    test('retourne tableau vide pour etat inconnu', () =>
      expect(getAllowedTransitions('inexistant')).toEqual([]))
  })
})

// ─── Module ───────────────────────────────────────────────────────────────────

describe('Module', () => {
  test('ne peut pas etre instancie directement', () => {
    expect(() => new Module('direct')).toThrow(ErreurModuleAbstrait)
  })

  test('peut etre instancie via une sous-classe', () => {
    expect(() => new StubModule()).not.toThrow()
  })

  test("l'etat initial est CREATED", () => {
    const m = new StubModule()
    expect(m.getState()).toBe(MODULE_STATES.CREATED)
  })

  test('expose name correctement', () => {
    const m = new StubModule('mon-module')
    expect(m.name).toBe('mon-module')
  })

  describe('cycle de vie complet', () => {
    test('initialize() → etat INITIALIZED', async () => {
      const m = new StubModule()
      await m.initialize()
      expect(m.getState()).toBe(MODULE_STATES.INITIALIZED)
    })

    test('start() → etat RUNNING', async () => {
      const m = new StubModule()
      await m.initialize()
      await m.start()
      expect(m.getState()).toBe(MODULE_STATES.RUNNING)
    })

    test('stop() → etat STOPPED', async () => {
      const m = new StubModule()
      await m.initialize()
      await m.start()
      await m.stop()
      expect(m.getState()).toBe(MODULE_STATES.STOPPED)
    })

    test('dispose() → etat DISPOSED', async () => {
      const m = new StubModule()
      await m.initialize()
      await m.start()
      await m.stop()
      await m.dispose()
      expect(m.getState()).toBe(MODULE_STATES.DISPOSED)
    })

    test('les methodes du stub sont appelees dans le bon ordre', async () => {
      const m = new StubModule()
      await m.initialize()
      await m.start()
      await m.stop()
      await m.dispose()
      expect(m.calls).toEqual(['initialize', 'start', 'stop', 'dispose'])
    })
  })

  describe('transitions illegales', () => {
    test('double initialize() lance ErreurTransitionModule', async () => {
      const m = new StubModule()
      await m.initialize()
      await expect(m.initialize()).rejects.toThrow(ErreurTransitionModule)
    })

    test('start() sans initialize() lance ErreurTransitionModule', async () => {
      const m = new StubModule()
      await expect(m.start()).rejects.toThrow(ErreurTransitionModule)
    })

    test('double start() lance ErreurTransitionModule', async () => {
      const m = new StubModule()
      await m.initialize()
      await m.start()
      await expect(m.start()).rejects.toThrow(ErreurTransitionModule)
    })

    test('stop() sans start() lance ErreurTransitionModule', async () => {
      const m = new StubModule()
      await m.initialize()
      await expect(m.stop()).rejects.toThrow(ErreurTransitionModule)
    })

    test('double stop() lance ErreurTransitionModule', async () => {
      const m = new StubModule()
      await m.initialize()
      await m.start()
      await m.stop()
      await expect(m.stop()).rejects.toThrow(ErreurTransitionModule)
    })

    test('dispose() depuis RUNNING lance ErreurTransitionModule', async () => {
      const m = new StubModule()
      await m.initialize()
      await m.start()
      await expect(m.dispose()).rejects.toThrow(ErreurTransitionModule)
    })

    test('double dispose() lance ErreurTransitionModule', async () => {
      const m = new StubModule()
      await m.initialize()
      await m.start()
      await m.stop()
      await m.dispose()
      await expect(m.dispose()).rejects.toThrow(ErreurTransitionModule)
    })
  })

  describe('ErreurTransitionModule', () => {
    test('contient from, to, moduleName', async () => {
      const m = new StubModule('test-module')
      let err
      try { await m.start() } catch (e) { err = e }
      expect(err).toBeInstanceOf(ErreurTransitionModule)
      expect(err.from).toBe(MODULE_STATES.CREATED)
      expect(err.to).toBe(MODULE_STATES.STARTING)
      expect(err.moduleName).toBe('test-module')
    })
  })
})

// ─── ModuleRegistry ───────────────────────────────────────────────────────────

describe('ModuleRegistry', () => {
  let registry

  beforeEach(() => { registry = new ModuleRegistry() })

  test('demarre vide', () => {
    expect(registry.getAll()).toHaveLength(0)
  })

  test('enregistre un module', () => {
    const m = new StubModule('alpha')
    registry.register(m)
    expect(registry.has('alpha')).toBe(true)
  })

  test('get() retourne le module enregistre', () => {
    const m = new StubModule('alpha')
    registry.register(m)
    expect(registry.get('alpha')).toBe(m)
  })

  test('has() retourne false pour un module absent', () => {
    expect(registry.has('inconnu')).toBe(false)
  })

  test('doublon lance ErreurModuleDejaPresentDansRegistre', () => {
    const m = new StubModule('alpha')
    registry.register(m)
    expect(() => registry.register(new StubModule('alpha')))
      .toThrow(ErreurModuleDejaPresentDansRegistre)
  })

  test('get() pour module inconnu lance ErreurModuleInconnu', () => {
    expect(() => registry.get('inexistant')).toThrow(ErreurModuleInconnu)
  })

  test('unregister() supprime le module', () => {
    const m = new StubModule('alpha')
    registry.register(m)
    registry.unregister('alpha')
    expect(registry.has('alpha')).toBe(false)
  })

  test('unregister() pour module inconnu lance ErreurModuleInconnu', () => {
    expect(() => registry.unregister('inexistant')).toThrow(ErreurModuleInconnu)
  })

  test('getAll() retourne tous les modules dans l ordre d insertion', () => {
    const a = new StubModule('a')
    const b = new StubModule('b')
    const c = new StubModule('c')
    registry.register(a)
    registry.register(b)
    registry.register(c)
    expect(registry.getAll()).toEqual([a, b, c])
  })

  test('clear() vide le registre', () => {
    registry.register(new StubModule('a'))
    registry.register(new StubModule('b'))
    registry.clear()
    expect(registry.getAll()).toHaveLength(0)
  })
})

// ─── ModuleManager ────────────────────────────────────────────────────────────

describe('ModuleManager', () => {
  let registry
  let manager

  beforeEach(() => {
    registry = new ModuleRegistry()
    manager  = new ModuleManager(registry)
  })

  describe('operations individuelles', () => {
    test('initialize(module) initialise un module', async () => {
      const m = new StubModule()
      await manager.initialize(m)
      expect(m.getState()).toBe(MODULE_STATES.INITIALIZED)
    })

    test('start(module) demarre un module initialise', async () => {
      const m = new StubModule()
      await manager.initialize(m)
      await manager.start(m)
      expect(m.getState()).toBe(MODULE_STATES.RUNNING)
    })

    test('stop(module) arrete un module en cours', async () => {
      const m = new StubModule()
      await manager.initialize(m)
      await manager.start(m)
      await manager.stop(m)
      expect(m.getState()).toBe(MODULE_STATES.STOPPED)
    })

    test('dispose(module) libere un module arrete', async () => {
      const m = new StubModule()
      await manager.initialize(m)
      await manager.start(m)
      await manager.stop(m)
      await manager.dispose(m)
      expect(m.getState()).toBe(MODULE_STATES.DISPOSED)
    })

    test('start() sur module non initialise propage ErreurModuleManager', async () => {
      const m = new StubModule()
      await expect(manager.start(m)).rejects.toThrow(ErreurModuleManager)
    })

    test('ErreurModuleManager contient operation et moduleName', async () => {
      const m = new StubModule('target')
      let err
      try { await manager.start(m) } catch (e) { err = e }
      expect(err).toBeInstanceOf(ErreurModuleManager)
      expect(err.operation).toBe('start')
      expect(err.moduleName).toBe('target')
      expect(err.cause).toBeInstanceOf(ErreurTransitionModule)
    })
  })

  describe('operations collectives', () => {
    test('initializeAll() initialise tous les modules', async () => {
      const a = new StubModule('a')
      const b = new StubModule('b')
      registry.register(a)
      registry.register(b)
      await manager.initializeAll()
      expect(a.getState()).toBe(MODULE_STATES.INITIALIZED)
      expect(b.getState()).toBe(MODULE_STATES.INITIALIZED)
    })

    test('startAll() demarre tous les modules apres initialisation', async () => {
      const a = new StubModule('a')
      const b = new StubModule('b')
      registry.register(a)
      registry.register(b)
      await manager.initializeAll()
      await manager.startAll()
      expect(a.getState()).toBe(MODULE_STATES.RUNNING)
      expect(b.getState()).toBe(MODULE_STATES.RUNNING)
    })

    test('stopAll() arrete dans l ordre inverse', async () => {
      const order = []
      class OrderedStub extends Module {
        constructor(name) { super(name) }
        async _initialize() {}
        async _start()      {}
        async _stop()       { order.push(this.name) }
        async _dispose()    {}
      }
      const a = new OrderedStub('a')
      const b = new OrderedStub('b')
      const c = new OrderedStub('c')
      registry.register(a)
      registry.register(b)
      registry.register(c)
      await manager.initializeAll()
      await manager.startAll()
      await manager.stopAll()
      expect(order).toEqual(['c', 'b', 'a'])
    })

    test('disposeAll() libere dans l ordre inverse', async () => {
      const order = []
      class OrderedStub extends Module {
        constructor(name) { super(name) }
        async _initialize() {}
        async _start()      {}
        async _stop()       {}
        async _dispose()    { order.push(this.name) }
      }
      const a = new OrderedStub('a')
      const b = new OrderedStub('b')
      registry.register(a)
      registry.register(b)
      await manager.initializeAll()
      await manager.startAll()
      await manager.stopAll()
      await manager.disposeAll()
      expect(order).toEqual(['b', 'a'])
    })

    test('startAll() s arrete et propage la premiere erreur', async () => {
      const ok     = new StubModule('ok')
      const broken = new StubModuleEchouant('broken')
      registry.register(ok)
      registry.register(broken)
      await manager.initializeAll()
      await expect(manager.startAll()).rejects.toThrow(ErreurModuleManager)
      expect(ok.getState()).toBe(MODULE_STATES.RUNNING)
    })

    test('cycle complet sur plusieurs modules', async () => {
      const modules = ['x', 'y', 'z'].map(n => new StubModule(n))
      modules.forEach(m => registry.register(m))
      await manager.initializeAll()
      await manager.startAll()
      await manager.stopAll()
      await manager.disposeAll()
      for (const m of modules) {
        expect(m.getState()).toBe(MODULE_STATES.DISPOSED)
      }
    })
  })

  // ─── ModuleManager — emission des MODULE_EVENTS ────────────────────────────

  describe('ModuleManager — emission des MODULE_EVENTS', () => {
    let bus
    let registry
    let manager

    beforeEach(() => {
      bus      = new EventBus()
      registry = new ModuleRegistry()
      manager  = new ModuleManager(registry, { eventBus: bus })
    })

    test('emet INITIALIZED avec le nom du module', async () => {
      let recu
      bus.subscribe(MODULE_EVENTS.INITIALIZED, name => { recu = name })
      await manager.initialize(new StubModule('m'))
      expect(recu).toBe('m')
    })

    test('emet STARTED, STOPPED, DISPOSED avec le nom du module', async () => {
      const recus = {}
      bus.subscribe(MODULE_EVENTS.STARTED,  n => { recus.started  = n })
      bus.subscribe(MODULE_EVENTS.STOPPED,  n => { recus.stopped  = n })
      bus.subscribe(MODULE_EVENTS.DISPOSED, n => { recus.disposed = n })
      const module = new StubModule('m')
      await manager.initialize(module)
      await manager.start(module)
      await manager.stop(module)
      await manager.dispose(module)
      expect(recus).toEqual({ started: 'm', stopped: 'm', disposed: 'm' })
    })

    test('emet ERROR avec une ErreurModuleManager puis propage', async () => {
      let recu
      bus.subscribe(MODULE_EVENTS.ERROR, err => { recu = err })
      const module = new StubModuleEchouant('ko')
      await manager.initialize(module)
      await expect(manager.start(module)).rejects.toBeInstanceOf(ErreurModuleManager)
      expect(recu).toBeInstanceOf(ErreurModuleManager)
      expect(recu.operation).toBe('start')
      expect(recu.moduleName).toBe('ko')
      expect(recu.cause).toBeInstanceOf(Error)
    })

    test("n'emet pas d'evenement de succes en cas d'echec", async () => {
      let started = false
      bus.subscribe(MODULE_EVENTS.STARTED, () => { started = true })
      const module = new StubModuleEchouant('ko')
      await manager.initialize(module)
      await manager.start(module).catch(() => {})
      expect(started).toBe(false)
    })

    test('sans bus injecte : aucune emission, aucun throw', async () => {
      const sansBus = new ModuleManager(new ModuleRegistry())
      await expect(sansBus.initialize(new StubModule('m'))).resolves.toBeUndefined()
    })

    test('les operations collectives emettent un evenement par module', async () => {
      const noms = []
      bus.subscribe(MODULE_EVENTS.INITIALIZED, n => noms.push(n))
      ;['a', 'b', 'c'].forEach(n => registry.register(new StubModule(n)))
      await manager.initializeAll()
      expect(noms).toEqual(['a', 'b', 'c'])
    })
  })
})
