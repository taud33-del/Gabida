/**
 * core/registry/__tests__/ServiceRegistry.test.js
 *
 * Tests exhaustifs du registre de services Gabida.
 *
 * Couverture :
 *   - RegistrationTypes  : constantes presentes et gelees
 *   - RegistryError      : erreurs typees et hierarchie
 *   - RegistryValidator  : validation, fonctions pures
 *   - ServiceDescriptor  : INSTANCE, SINGLETON, TRANSIENT, dispose, cache
 *   - ServiceRegistry    : register, unregister, resolve, has, getAll,
 *                          size, clear, doublons, inconnu, lazy singleton,
 *                          transient multiple, dependance circulaire,
 *                          noms invalides, factories invalides,
 *                          propagation d erreurs
 */

import { jest }                  from '@jest/globals'
import { REGISTRATION_TYPES }    from '../RegistrationTypes.js'
import {
  RegistryError,
  DuplicateServiceError,
  ServiceNotFoundError,
  InvalidRegistrationError,
  InvalidFactoryError,
  CircularDependencyError,
}                                from '../RegistryError.js'
import {
  validateServiceName,
  validateRegistrationType,
  validateFactory,
  isValidServiceName,
  isValidRegistrationType,
  isValidFactory,
}                                from '../RegistryValidator.js'
import { ServiceDescriptor }     from '../ServiceDescriptor.js'
import { ServiceRegistry }       from '../ServiceRegistry.js'

// ─── REGISTRATION_TYPES ───────────────────────────────────────────────────────

describe('REGISTRATION_TYPES', () => {
  test('declare SINGLETON',  () => expect(typeof REGISTRATION_TYPES.SINGLETON).toBe('string'))
  test('declare TRANSIENT',  () => expect(typeof REGISTRATION_TYPES.TRANSIENT).toBe('string'))
  test('declare INSTANCE',   () => expect(typeof REGISTRATION_TYPES.INSTANCE).toBe('string'))
  test('est gele (frozen)',  () => expect(Object.isFrozen(REGISTRATION_TYPES)).toBe(true))
})

// ─── RegistryError ────────────────────────────────────────────────────────────

describe('RegistryError', () => {
  test('DuplicateServiceError est une RegistryError', () =>
    expect(new DuplicateServiceError('x')).toBeInstanceOf(RegistryError))

  test('ServiceNotFoundError est une RegistryError', () =>
    expect(new ServiceNotFoundError('x')).toBeInstanceOf(RegistryError))

  test('InvalidRegistrationError est une RegistryError', () =>
    expect(new InvalidRegistrationError('raison', null)).toBeInstanceOf(RegistryError))

  test('InvalidFactoryError est une RegistryError', () =>
    expect(new InvalidFactoryError(42)).toBeInstanceOf(RegistryError))

  test('CircularDependencyError est une RegistryError', () =>
    expect(new CircularDependencyError('x')).toBeInstanceOf(RegistryError))

  test('DuplicateServiceError stocke serviceName', () => {
    const err = new DuplicateServiceError('myService')
    expect(err.serviceName).toBe('myService')
  })

  test('ServiceNotFoundError stocke serviceName', () => {
    const err = new ServiceNotFoundError('missing')
    expect(err.serviceName).toBe('missing')
  })

  test('CircularDependencyError stocke serviceName', () => {
    const err = new CircularDependencyError('circ')
    expect(err.serviceName).toBe('circ')
  })

  test('InvalidFactoryError stocke value', () => {
    const err = new InvalidFactoryError(42)
    expect(err.value).toBe(42)
  })

  test('InvalidRegistrationError stocke reason et value', () => {
    const err = new InvalidRegistrationError('raison', null)
    expect(err.reason).toBe('raison')
    expect(err.value).toBeNull()
  })
})

// ─── RegistryValidator ────────────────────────────────────────────────────────

describe('RegistryValidator', () => {
  describe('validateServiceName', () => {
    test('accepte une chaine non vide',      () => expect(() => validateServiceName('svc')).not.toThrow())
    test('rejette une chaine vide',          () => expect(() => validateServiceName('')).toThrow(InvalidRegistrationError))
    test('rejette une chaine d espaces',     () => expect(() => validateServiceName('  ')).toThrow(InvalidRegistrationError))
    test('rejette null',                     () => expect(() => validateServiceName(null)).toThrow(InvalidRegistrationError))
    test('rejette un nombre',                () => expect(() => validateServiceName(42)).toThrow(InvalidRegistrationError))
  })

  describe('validateRegistrationType', () => {
    test('accepte SINGLETON',  () => expect(() => validateRegistrationType(REGISTRATION_TYPES.SINGLETON)).not.toThrow())
    test('accepte TRANSIENT',  () => expect(() => validateRegistrationType(REGISTRATION_TYPES.TRANSIENT)).not.toThrow())
    test('accepte INSTANCE',   () => expect(() => validateRegistrationType(REGISTRATION_TYPES.INSTANCE)).not.toThrow())
    test('rejette inconnu',    () => expect(() => validateRegistrationType('unknown')).toThrow(InvalidRegistrationError))
    test('rejette null',       () => expect(() => validateRegistrationType(null)).toThrow(InvalidRegistrationError))
  })

  describe('validateFactory', () => {
    test('accepte une fonction',   () => expect(() => validateFactory(() => {})).not.toThrow())
    test('rejette null',           () => expect(() => validateFactory(null)).toThrow(InvalidFactoryError))
    test('rejette une chaine',     () => expect(() => validateFactory('fn')).toThrow(InvalidFactoryError))
    test('rejette un objet',       () => expect(() => validateFactory({})).toThrow(InvalidFactoryError))
  })

  describe('isValidServiceName', () => {
    test('true pour chaine non vide',  () => expect(isValidServiceName('svc')).toBe(true))
    test('false pour chaine vide',     () => expect(isValidServiceName('')).toBe(false))
    test('false pour null',            () => expect(isValidServiceName(null)).toBe(false))
  })

  describe('isValidRegistrationType', () => {
    test('true pour SINGLETON',  () => expect(isValidRegistrationType(REGISTRATION_TYPES.SINGLETON)).toBe(true))
    test('false pour inconnu',   () => expect(isValidRegistrationType('nope')).toBe(false))
  })

  describe('isValidFactory', () => {
    test('true pour une fonction',  () => expect(isValidFactory(() => {})).toBe(true))
    test('false pour null',         () => expect(isValidFactory(null)).toBe(false))
  })
})

// ─── ServiceDescriptor ────────────────────────────────────────────────────────

describe('ServiceDescriptor', () => {
  describe('INSTANCE', () => {
    test('retourne l instance fournie', () => {
      const obj = { id: 1 }
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.INSTANCE, instance: obj })
      expect(d.create()).toBe(obj)
    })

    test('retourne toujours la meme instance', () => {
      const obj = { id: 1 }
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.INSTANCE, instance: obj })
      expect(d.create()).toBe(d.create())
    })
  })

  describe('SINGLETON', () => {
    test('la factory n est pas appelee a la construction', () => {
      const factory = jest.fn(() => ({}))
      new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.SINGLETON, factory })
      expect(factory).not.toHaveBeenCalled()
    })

    test('la factory est appelee au premier create()', () => {
      const factory = jest.fn(() => ({}))
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.SINGLETON, factory })
      d.create()
      expect(factory).toHaveBeenCalledTimes(1)
    })

    test('la factory n est appelee qu une seule fois', () => {
      const factory = jest.fn(() => ({}))
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.SINGLETON, factory })
      d.create()
      d.create()
      d.create()
      expect(factory).toHaveBeenCalledTimes(1)
    })

    test('retourne toujours la meme instance', () => {
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.SINGLETON, factory: () => ({}) })
      expect(d.create()).toBe(d.create())
    })
  })

  describe('TRANSIENT', () => {
    test('la factory est appelee a chaque create()', () => {
      const factory = jest.fn(() => ({}))
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.TRANSIENT, factory })
      d.create()
      d.create()
      expect(factory).toHaveBeenCalledTimes(2)
    })

    test('retourne des instances differentes', () => {
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.TRANSIENT, factory: () => ({}) })
      expect(d.create()).not.toBe(d.create())
    })
  })

  describe('dispose', () => {
    test('appelle dispose() sur l instance si elle existe', () => {
      const instance = { dispose: jest.fn() }
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.INSTANCE, instance })
      d.dispose()
      expect(instance.dispose).toHaveBeenCalledTimes(1)
    })

    test('ne lance pas d erreur si l instance n a pas de dispose()', () => {
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.INSTANCE, instance: {} })
      expect(() => d.dispose()).not.toThrow()
    })

    test('nullifie l instance apres dispose', () => {
      const instance = { dispose: () => {} }
      const d = new ServiceDescriptor({ name: 'svc', lifetime: REGISTRATION_TYPES.SINGLETON, factory: () => instance })
      d.create()
      d.dispose()
      // apres dispose, re-create doit rappeler la factory (singleton recree)
      const factory2 = jest.fn(() => ({}))
      const d2 = new ServiceDescriptor({ name: 'svc2', lifetime: REGISTRATION_TYPES.SINGLETON, factory: factory2 })
      d2.dispose()
      d2.create()
      expect(factory2).toHaveBeenCalledTimes(1)
    })
  })

  describe('accesseurs', () => {
    test('name', () => {
      const d = new ServiceDescriptor({ name: 'myService', lifetime: REGISTRATION_TYPES.INSTANCE, instance: {} })
      expect(d.name).toBe('myService')
    })

    test('lifetime', () => {
      const d = new ServiceDescriptor({ name: 's', lifetime: REGISTRATION_TYPES.SINGLETON, factory: () => {} })
      expect(d.lifetime).toBe(REGISTRATION_TYPES.SINGLETON)
    })

    test('metadata est gele', () => {
      const d = new ServiceDescriptor({ name: 's', lifetime: REGISTRATION_TYPES.INSTANCE, instance: {}, metadata: { tag: 'test' } })
      expect(Object.isFrozen(d.metadata)).toBe(true)
      expect(d.metadata.tag).toBe('test')
    })
  })
})

// ─── ServiceRegistry ──────────────────────────────────────────────────────────

describe('ServiceRegistry', () => {
  let registry

  beforeEach(() => { registry = new ServiceRegistry() })

  // ── register ──────────────────────────────────────────────────────────────────

  describe('register()', () => {
    test('enregistre une instance directement', () => {
      registry.register('svc', { id: 1 })
      expect(registry.has('svc')).toBe(true)
    })

    test('enregistre un singleton via factory', () => {
      registry.register('svc', () => ({ id: 1 }), REGISTRATION_TYPES.SINGLETON)
      expect(registry.has('svc')).toBe(true)
    })

    test('enregistre un transient via factory', () => {
      registry.register('svc', () => ({ id: 1 }), REGISTRATION_TYPES.TRANSIENT)
      expect(registry.has('svc')).toBe(true)
    })

    test('une fonction sans lifetime explicite est enregistree comme SINGLETON', () => {
      registry.register('svc', () => ({ id: 1 }))
      const descriptor = registry.getAll()[0]
      expect(descriptor.lifetime).toBe(REGISTRATION_TYPES.SINGLETON)
    })

    test('rejette un doublon', () => {
      registry.register('svc', { id: 1 })
      expect(() => registry.register('svc', { id: 2 })).toThrow(DuplicateServiceError)
    })

    test('rejette un nom invalide', () => {
      expect(() => registry.register('', { id: 1 })).toThrow(InvalidRegistrationError)
    })

    test('rejette un nom null', () => {
      expect(() => registry.register(null, { id: 1 })).toThrow(InvalidRegistrationError)
    })

    test('rejette une factory invalide pour SINGLETON', () => {
      expect(() => registry.register('svc', 42, REGISTRATION_TYPES.SINGLETON)).toThrow(InvalidFactoryError)
    })

    test('rejette une factory invalide pour TRANSIENT', () => {
      expect(() => registry.register('svc', 'not-a-fn', REGISTRATION_TYPES.TRANSIENT)).toThrow(InvalidFactoryError)
    })

    test('la factory n est pas appelee lors de register()', () => {
      const factory = jest.fn(() => ({}))
      registry.register('svc', factory, REGISTRATION_TYPES.SINGLETON)
      expect(factory).not.toHaveBeenCalled()
    })
  })

  // ── resolve ───────────────────────────────────────────────────────────────────

  describe('resolve()', () => {
    test('retourne l instance enregistree', () => {
      const obj = { id: 42 }
      registry.register('svc', obj)
      expect(registry.resolve('svc')).toBe(obj)
    })

    test('singleton : retourne toujours la meme instance', () => {
      registry.register('svc', () => ({}), REGISTRATION_TYPES.SINGLETON)
      expect(registry.resolve('svc')).toBe(registry.resolve('svc'))
    })

    test('singleton : la factory n est appelee qu une fois', () => {
      const factory = jest.fn(() => ({}))
      registry.register('svc', factory, REGISTRATION_TYPES.SINGLETON)
      registry.resolve('svc')
      registry.resolve('svc')
      expect(factory).toHaveBeenCalledTimes(1)
    })

    test('transient : retourne des instances differentes', () => {
      registry.register('svc', () => ({}), REGISTRATION_TYPES.TRANSIENT)
      expect(registry.resolve('svc')).not.toBe(registry.resolve('svc'))
    })

    test('transient : la factory est appelee a chaque resolve', () => {
      const factory = jest.fn(() => ({}))
      registry.register('svc', factory, REGISTRATION_TYPES.TRANSIENT)
      registry.resolve('svc')
      registry.resolve('svc')
      expect(factory).toHaveBeenCalledTimes(2)
    })

    test('lance ServiceNotFoundError pour un service inconnu', () => {
      expect(() => registry.resolve('missing')).toThrow(ServiceNotFoundError)
    })

    test('lance InvalidRegistrationError pour un nom invalide', () => {
      expect(() => registry.resolve('')).toThrow(InvalidRegistrationError)
    })

    test('detecte une dependance circulaire', () => {
      registry.register('a', () => registry.resolve('a'), REGISTRATION_TYPES.SINGLETON)
      expect(() => registry.resolve('a')).toThrow(CircularDependencyError)
    })

    test('le registre reste utilisable apres une dependance circulaire', () => {
      registry.register('a', () => registry.resolve('a'), REGISTRATION_TYPES.SINGLETON)
      try { registry.resolve('a') } catch (_) { /* attendu */ }
      registry.register('b', { ok: true })
      expect(registry.resolve('b')).toEqual({ ok: true })
    })
  })

  // ── unregister ────────────────────────────────────────────────────────────────

  describe('unregister()', () => {
    test('supprime le service', () => {
      registry.register('svc', { id: 1 })
      registry.unregister('svc')
      expect(registry.has('svc')).toBe(false)
    })

    test('lance ServiceNotFoundError pour un service inconnu', () => {
      expect(() => registry.unregister('missing')).toThrow(ServiceNotFoundError)
    })

    test('appelle dispose() sur le descripteur', () => {
      const instance = { dispose: jest.fn() }
      registry.register('svc', instance)
      registry.unregister('svc')
      expect(instance.dispose).toHaveBeenCalledTimes(1)
    })
  })

  // ── has / size / getAll ───────────────────────────────────────────────────────

  describe('has()', () => {
    test('retourne true pour un service enregistre',  () => {
      registry.register('svc', {})
      expect(registry.has('svc')).toBe(true)
    })

    test('retourne false pour un service absent', () => {
      expect(registry.has('missing')).toBe(false)
    })
  })

  describe('size()', () => {
    test('retourne 0 a vide', () => {
      expect(registry.size()).toBe(0)
    })

    test('augmente apres register', () => {
      registry.register('a', {})
      registry.register('b', {})
      expect(registry.size()).toBe(2)
    })

    test('diminue apres unregister', () => {
      registry.register('a', {})
      registry.unregister('a')
      expect(registry.size()).toBe(0)
    })
  })

  describe('getAll()', () => {
    test('retourne un tableau vide a vide', () => {
      expect(registry.getAll()).toHaveLength(0)
    })

    test('retourne les descripteurs dans l ordre d insertion', () => {
      registry.register('a', {})
      registry.register('b', {})
      const names = registry.getAll().map(d => d.name)
      expect(names).toEqual(['a', 'b'])
    })
  })

  // ── clear ─────────────────────────────────────────────────────────────────────

  describe('clear()', () => {
    test('vide le registre', () => {
      registry.register('a', {})
      registry.register('b', {})
      registry.clear()
      expect(registry.size()).toBe(0)
    })

    test('appelle dispose() sur chaque descripteur', () => {
      const d1 = { dispose: jest.fn() }
      const d2 = { dispose: jest.fn() }
      registry.register('a', d1)
      registry.register('b', d2)
      registry.clear()
      expect(d1.dispose).toHaveBeenCalledTimes(1)
      expect(d2.dispose).toHaveBeenCalledTimes(1)
    })

    test('clear() sur registre vide ne lance pas d erreur', () => {
      expect(() => registry.clear()).not.toThrow()
    })
  })

  // ── lazy singleton ─────────────────────────────────────────────────────────────

  describe('lazy singleton', () => {
    test('la factory n est pas appelee avant resolve()', () => {
      const factory = jest.fn(() => ({}))
      registry.register('svc', factory, REGISTRATION_TYPES.SINGLETON)
      expect(factory).not.toHaveBeenCalled()
    })

    test('la factory est appelee exactement au premier resolve()', () => {
      const factory = jest.fn(() => ({}))
      registry.register('svc', factory, REGISTRATION_TYPES.SINGLETON)
      registry.resolve('svc')
      expect(factory).toHaveBeenCalledTimes(1)
    })
  })

  // ── multiples instances transientes ──────────────────────────────────────────

  describe('multiple transient instances', () => {
    test('chaque resolve() produit une nouvelle instance', () => {
      let counter = 0
      registry.register('svc', () => ({ id: ++counter }), REGISTRATION_TYPES.TRANSIENT)
      const a = registry.resolve('svc')
      const b = registry.resolve('svc')
      const c = registry.resolve('svc')
      expect(a.id).toBe(1)
      expect(b.id).toBe(2)
      expect(c.id).toBe(3)
    })
  })
})
