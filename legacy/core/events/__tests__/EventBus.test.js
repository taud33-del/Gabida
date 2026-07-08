/**
 * core/events/__tests__/EventBus.test.js
 *
 * Tests exhaustifs du bus d'evenements Gabida.
 *
 * Couverture :
 *   - EventTypes    : constantes presentes et gelees
 *   - EventError    : erreurs typees et hierarchie
 *   - EventValidator: validation, fonctions pures
 *   - EventSubscription : creation, isActive, dispose, idempotence
 *   - EventBus      : subscribe, unsubscribe, emit, once, clear,
 *                     listenerCount, hasListeners, ordre, doublons,
 *                     suppression pendant emit, ajout pendant emit,
 *                     listener jetant une erreur, payload immutabilite,
 *                     emit sans listeners, emit imbrique
 */

import { EVENT_TYPES }              from '../EventTypes.js'
import {
  EventBusError,
  InvalidEventNameError,
  InvalidCallbackError,
  ListenerNotFoundError,
  DuplicateSubscriptionError,
}                                   from '../EventError.js'
import {
  validateEventName,
  validateCallback,
  isValidEventName,
  isValidCallback,
}                                   from '../EventValidator.js'
import { EventSubscription }        from '../EventSubscription.js'
import { EventBus }                 from '../EventBus.js'
import { jest }                     from '@jest/globals'

const EV = 'test.event'

// ─── EVENT_TYPES ──────────────────────────────────────────────────────────────

describe('EVENT_TYPES', () => {
  test('declare MODULE_INITIALIZED', () => expect(typeof EVENT_TYPES.MODULE_INITIALIZED).toBe('string'))
  test('declare MODULE_STARTED',     () => expect(typeof EVENT_TYPES.MODULE_STARTED).toBe('string'))
  test('declare MODULE_STOPPED',     () => expect(typeof EVENT_TYPES.MODULE_STOPPED).toBe('string'))
  test('declare MODULE_DISPOSED',    () => expect(typeof EVENT_TYPES.MODULE_DISPOSED).toBe('string'))
  test('declare MODULE_ERROR',       () => expect(typeof EVENT_TYPES.MODULE_ERROR).toBe('string'))
  test('declare RUNTIME_STARTED',    () => expect(typeof EVENT_TYPES.RUNTIME_STARTED).toBe('string'))
  test('declare RUNTIME_STOPPED',    () => expect(typeof EVENT_TYPES.RUNTIME_STOPPED).toBe('string'))
  test('declare RUNTIME_PAUSED',     () => expect(typeof EVENT_TYPES.RUNTIME_PAUSED).toBe('string'))
  test('declare RUNTIME_RESUMED',    () => expect(typeof EVENT_TYPES.RUNTIME_RESUMED).toBe('string'))
  test('est gele',                   () => expect(Object.isFrozen(EVENT_TYPES)).toBe(true))
})

// ─── EventError ───────────────────────────────────────────────────────────────

describe('EventError', () => {
  test('InvalidEventNameError est une EventBusError', () => {
    expect(new InvalidEventNameError('')).toBeInstanceOf(EventBusError)
  })

  test('InvalidCallbackError est une EventBusError', () => {
    expect(new InvalidCallbackError(42)).toBeInstanceOf(EventBusError)
  })

  test('ListenerNotFoundError est une EventBusError', () => {
    expect(new ListenerNotFoundError('ev', () => {})).toBeInstanceOf(EventBusError)
  })

  test('DuplicateSubscriptionError est une EventBusError', () => {
    expect(new DuplicateSubscriptionError('ev', () => {})).toBeInstanceOf(EventBusError)
  })

  test('InvalidEventNameError stocke value', () => {
    const err = new InvalidEventNameError(null)
    expect(err.value).toBeNull()
  })

  test('InvalidCallbackError stocke value', () => {
    const err = new InvalidCallbackError(42)
    expect(err.value).toBe(42)
  })

  test('ListenerNotFoundError stocke event et callback', () => {
    const cb  = () => {}
    const err = new ListenerNotFoundError('ev', cb)
    expect(err.event).toBe('ev')
    expect(err.callback).toBe(cb)
  })

  test('DuplicateSubscriptionError stocke event et callback', () => {
    const cb  = () => {}
    const err = new DuplicateSubscriptionError('ev', cb)
    expect(err.event).toBe('ev')
    expect(err.callback).toBe(cb)
  })
})

// ─── EventValidator ───────────────────────────────────────────────────────────

describe('EventValidator', () => {
  describe('validateEventName', () => {
    test('accepte une chaine non vide',     () => expect(() => validateEventName('ok')).not.toThrow())
    test('rejette une chaine vide',         () => expect(() => validateEventName('')).toThrow(InvalidEventNameError))
    test('rejette une chaine d espaces',    () => expect(() => validateEventName('   ')).toThrow(InvalidEventNameError))
    test('rejette null',                    () => expect(() => validateEventName(null)).toThrow(InvalidEventNameError))
    test('rejette un nombre',               () => expect(() => validateEventName(42)).toThrow(InvalidEventNameError))
  })

  describe('validateCallback', () => {
    test('accepte une fonction',   () => expect(() => validateCallback(() => {})).not.toThrow())
    test('rejette null',           () => expect(() => validateCallback(null)).toThrow(InvalidCallbackError))
    test('rejette une chaine',     () => expect(() => validateCallback('fn')).toThrow(InvalidCallbackError))
    test('rejette un nombre',      () => expect(() => validateCallback(42)).toThrow(InvalidCallbackError))
  })

  describe('isValidEventName', () => {
    test('true pour chaine non vide',   () => expect(isValidEventName('ev')).toBe(true))
    test('false pour chaine vide',      () => expect(isValidEventName('')).toBe(false))
    test('false pour null',             () => expect(isValidEventName(null)).toBe(false))
  })

  describe('isValidCallback', () => {
    test('true pour une fonction',  () => expect(isValidCallback(() => {})).toBe(true))
    test('false pour null',         () => expect(isValidCallback(null)).toBe(false))
    test('false pour une chaine',   () => expect(isValidCallback('fn')).toBe(false))
  })
})

// ─── EventSubscription ────────────────────────────────────────────────────────

describe('EventSubscription', () => {
  test('isActive() est true a la creation', () => {
    const sub = new EventSubscription(EV, () => {}, false, () => {})
    expect(sub.isActive()).toBe(true)
  })

  test('dispose() desactive l abonnement', () => {
    const sub = new EventSubscription(EV, () => {}, false, () => {})
    sub.dispose()
    expect(sub.isActive()).toBe(false)
  })

  test('dispose() appelle onDispose', () => {
    const onDispose = jest.fn()
    const sub = new EventSubscription(EV, () => {}, false, onDispose)
    sub.dispose()
    expect(onDispose).toHaveBeenCalledWith(sub)
  })

  test('dispose() est idempotent — onDispose appele une seule fois', () => {
    const onDispose = jest.fn()
    const sub = new EventSubscription(EV, () => {}, false, onDispose)
    sub.dispose()
    sub.dispose()
    expect(onDispose).toHaveBeenCalledTimes(1)
  })

  test('expose event, callback, once', () => {
    const cb  = () => {}
    const sub = new EventSubscription(EV, cb, true, () => {})
    expect(sub.event).toBe(EV)
    expect(sub.callback).toBe(cb)
    expect(sub.once).toBe(true)
  })
})

// ─── EventBus ─────────────────────────────────────────────────────────────────

describe('EventBus', () => {
  let bus

  beforeEach(() => { bus = new EventBus() })

  // ── subscribe ────────────────────────────────────────────────────────────────

  describe('subscribe()', () => {
    test('retourne un EventSubscription', () => {
      const sub = bus.subscribe(EV, () => {})
      expect(sub).toBeInstanceOf(EventSubscription)
    })

    test('le listener est actif apres subscribe', () => {
      const sub = bus.subscribe(EV, () => {})
      expect(sub.isActive()).toBe(true)
    })

    test('rejette un nom invalide', () => {
      expect(() => bus.subscribe('', () => {})).toThrow(InvalidEventNameError)
    })

    test('rejette un callback invalide', () => {
      expect(() => bus.subscribe(EV, null)).toThrow(InvalidCallbackError)
    })

    test('rejette un doublon', () => {
      const cb = () => {}
      bus.subscribe(EV, cb)
      expect(() => bus.subscribe(EV, cb)).toThrow(DuplicateSubscriptionError)
    })

    test('accepte des callbacks differents pour le meme evenement', () => {
      expect(() => {
        bus.subscribe(EV, () => {})
        bus.subscribe(EV, () => {})
      }).not.toThrow()
    })
  })

  // ── unsubscribe ───────────────────────────────────────────────────────────────

  describe('unsubscribe()', () => {
    test('retire le listener', () => {
      const cb = () => {}
      bus.subscribe(EV, cb)
      bus.unsubscribe(EV, cb)
      expect(bus.listenerCount(EV)).toBe(0)
    })

    test('lance ListenerNotFoundError si le listener est absent', () => {
      expect(() => bus.unsubscribe(EV, () => {})).toThrow(ListenerNotFoundError)
    })

    test('rejette un nom invalide', () => {
      expect(() => bus.unsubscribe('', () => {})).toThrow(InvalidEventNameError)
    })

    test('rejette un callback invalide', () => {
      expect(() => bus.unsubscribe(EV, null)).toThrow(InvalidCallbackError)
    })
  })

  // ── emit ─────────────────────────────────────────────────────────────────────

  describe('emit()', () => {
    test('appelle le listener avec le payload', () => {
      const received = []
      bus.subscribe(EV, p => received.push(p))
      bus.emit(EV, 42)
      expect(received).toEqual([42])
    })

    test('appelle plusieurs listeners dans leur ordre d enregistrement', () => {
      const order = []
      bus.subscribe(EV, () => order.push(1))
      bus.subscribe(EV, () => order.push(2))
      bus.subscribe(EV, () => order.push(3))
      bus.emit(EV, null)
      expect(order).toEqual([1, 2, 3])
    })

    test('n appelle pas les listeners d un autre evenement', () => {
      const called = jest.fn()
      bus.subscribe('other.event', called)
      bus.emit(EV, null)
      expect(called).not.toHaveBeenCalled()
    })

    test('emit sans listeners ne lance pas d erreur', () => {
      expect(() => bus.emit(EV, null)).not.toThrow()
    })

    test('rejette un nom invalide', () => {
      expect(() => bus.emit('', null)).toThrow(InvalidEventNameError)
    })

    test('transmet le payload sans le modifier', () => {
      const payload = Object.freeze({ x: 1 })
      let received
      bus.subscribe(EV, p => { received = p })
      bus.emit(EV, payload)
      expect(received).toBe(payload)
    })

    test('un listener qui lance une erreur la propage', () => {
      bus.subscribe(EV, () => { throw new Error('listener error') })
      expect(() => bus.emit(EV, null)).toThrow('listener error')
    })

    test('suppression d un listener pendant emit ne brise pas l iteration', () => {
      const order = []
      const cb2 = () => order.push(2)
      bus.subscribe(EV, () => { order.push(1); bus.unsubscribe(EV, cb2) })
      bus.subscribe(EV, cb2)
      bus.subscribe(EV, () => order.push(3))
      bus.emit(EV, null)
      expect(order).toEqual([1, 3])
    })

    test('ajout d un listener pendant emit n affecte pas l emission en cours', () => {
      const order = []
      const extra = jest.fn()
      bus.subscribe(EV, () => { order.push(1); bus.subscribe(EV, extra) })
      bus.subscribe(EV, () => order.push(2))
      bus.emit(EV, null)
      expect(order).toEqual([1, 2])
      expect(extra).not.toHaveBeenCalled()
    })

    test('emit imbrique : un listener peut emettre un autre evenement', () => {
      const innerOrder = []
      bus.subscribe('inner', () => innerOrder.push('inner'))
      bus.subscribe(EV, () => bus.emit('inner', null))
      bus.emit(EV, null)
      expect(innerOrder).toEqual(['inner'])
    })
  })

  // ── once ─────────────────────────────────────────────────────────────────────

  describe('once()', () => {
    test('le listener est appele une seule fois', () => {
      const fn = jest.fn()
      bus.once(EV, fn)
      bus.emit(EV, null)
      bus.emit(EV, null)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    test('le listener est desactive apres le premier appel', () => {
      const sub = bus.once(EV, () => {})
      bus.emit(EV, null)
      expect(sub.isActive()).toBe(false)
    })

    test('rejette un doublon', () => {
      const cb = () => {}
      bus.once(EV, cb)
      expect(() => bus.once(EV, cb)).toThrow(DuplicateSubscriptionError)
    })

    test('retourne un EventSubscription avec once === true', () => {
      const sub = bus.once(EV, () => {})
      expect(sub.once).toBe(true)
    })

    test('rejette un nom invalide', () => {
      expect(() => bus.once('', () => {})).toThrow(InvalidEventNameError)
    })

    test('rejette un callback invalide', () => {
      expect(() => bus.once(EV, null)).toThrow(InvalidCallbackError)
    })
  })

  // ── clear ─────────────────────────────────────────────────────────────────────

  describe('clear()', () => {
    test('retire tous les listeners de tous les evenements', () => {
      bus.subscribe(EV,       () => {})
      bus.subscribe('ev2',    () => {})
      bus.clear()
      expect(bus.listenerCount(EV)).toBe(0)
      expect(bus.listenerCount('ev2')).toBe(0)
    })

    test('les abonnements disposes par clear() sont inactifs', () => {
      const sub = bus.subscribe(EV, () => {})
      bus.clear()
      expect(sub.isActive()).toBe(false)
    })

    test('clear() sur un bus vide ne lance pas d erreur', () => {
      expect(() => bus.clear()).not.toThrow()
    })
  })

  // ── listenerCount / hasListeners ──────────────────────────────────────────────

  describe('listenerCount()', () => {
    test('retourne 0 pour un evenement sans listeners', () => {
      expect(bus.listenerCount(EV)).toBe(0)
    })

    test('retourne le nombre correct apres subscribe', () => {
      bus.subscribe(EV, () => {})
      bus.subscribe(EV, () => {})
      expect(bus.listenerCount(EV)).toBe(2)
    })

    test('diminue apres unsubscribe', () => {
      const cb = () => {}
      bus.subscribe(EV, cb)
      bus.subscribe(EV, () => {})
      bus.unsubscribe(EV, cb)
      expect(bus.listenerCount(EV)).toBe(1)
    })

    test('rejette un nom invalide', () => {
      expect(() => bus.listenerCount('')).toThrow(InvalidEventNameError)
    })
  })

  describe('hasListeners()', () => {
    test('retourne false sans listeners', () => {
      expect(bus.hasListeners(EV)).toBe(false)
    })

    test('retourne true apres subscribe', () => {
      bus.subscribe(EV, () => {})
      expect(bus.hasListeners(EV)).toBe(true)
    })

    test('retourne false apres clear', () => {
      bus.subscribe(EV, () => {})
      bus.clear()
      expect(bus.hasListeners(EV)).toBe(false)
    })

    test('rejette un nom invalide', () => {
      expect(() => bus.hasListeners('')).toThrow(InvalidEventNameError)
    })
  })

  // ── dispose via subscription ──────────────────────────────────────────────────

  describe('dispose via subscription', () => {
    test('sub.dispose() retire le listener du bus', () => {
      const sub = bus.subscribe(EV, () => {})
      sub.dispose()
      expect(bus.listenerCount(EV)).toBe(0)
    })

    test('sub.dispose() est idempotent', () => {
      const sub = bus.subscribe(EV, () => {})
      sub.dispose()
      expect(() => sub.dispose()).not.toThrow()
      expect(bus.listenerCount(EV)).toBe(0)
    })
  })
})
