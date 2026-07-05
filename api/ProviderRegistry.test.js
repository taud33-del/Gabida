/**
 * api/ProviderRegistry.test.js
 *
 * Tests unitaires de la classe ProviderRegistry.
 *
 * Couverture :
 *   - register  : enregistrement, doublon (erreur typee), adaptateur invalide
 *   - get       : resolution, absence (erreur typee)
 *   - has       : presence / absence
 *   - list      : inventaire, ordre d'insertion, isolation
 */

import { ProviderRegistry } from './ProviderRegistry.js'
import {
  ProviderAlreadyRegisteredError,
  ProviderNotFoundError,
  InvalidProviderError,
} from './ProviderError.js'

const adaptateur = async () => ({ texte: 'ok', tokensEntree: 1, tokensSortie: 1 })

describe('ProviderRegistry', () => {
  let registry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    test('enregistre un adaptateur sans erreur', () => {
      expect(() => registry.register('openai', adaptateur)).not.toThrow()
      expect(registry.has('openai')).toBe(true)
    })

    test('leve ProviderAlreadyRegisteredError si le nom existe deja', () => {
      registry.register('openai', adaptateur)
      expect(() => registry.register('openai', adaptateur))
        .toThrow(ProviderAlreadyRegisteredError)
    })

    test('n ecrase pas le provider existant en cas de doublon', () => {
      const premier = adaptateur
      const second  = async () => ({ texte: 'v2', tokensEntree: 2, tokensSortie: 2 })
      registry.register('openai', premier)
      expect(() => registry.register('openai', second)).toThrow()
      expect(registry.get('openai')).toBe(premier)
    })

    test('leve InvalidProviderError si l adaptateur n est pas une fonction', () => {
      expect(() => registry.register('openai', 'pas-une-fonction'))
        .toThrow(InvalidProviderError)
    })

    test('l erreur de doublon porte le nom du provider', () => {
      registry.register('openai', adaptateur)
      try {
        registry.register('openai', adaptateur)
      } catch (err) {
        expect(err.providerName).toBe('openai')
      }
    })
  })

  // ─── get ──────────────────────────────────────────────────────────────────

  describe('get', () => {
    test('retourne l adaptateur enregistre', () => {
      registry.register('openai', adaptateur)
      expect(registry.get('openai')).toBe(adaptateur)
    })

    test('leve ProviderNotFoundError si le provider est absent', () => {
      expect(() => registry.get('inconnu')).toThrow(ProviderNotFoundError)
    })

    test('ne retourne jamais undefined', () => {
      expect(() => registry.get('inconnu')).toThrow()
    })
  })

  // ─── has ──────────────────────────────────────────────────────────────────

  describe('has', () => {
    test('retourne true pour un provider enregistre', () => {
      registry.register('openai', adaptateur)
      expect(registry.has('openai')).toBe(true)
    })

    test('retourne false pour un provider absent', () => {
      expect(registry.has('inconnu')).toBe(false)
    })
  })

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    test('retourne un tableau vide au depart', () => {
      expect(registry.list()).toEqual([])
    })

    test('retourne les noms dans l ordre d insertion', () => {
      registry.register('openai',    adaptateur)
      registry.register('anthropic', adaptateur)
      registry.register('gemini',    adaptateur)
      expect(registry.list()).toEqual(['openai', 'anthropic', 'gemini'])
    })

    test('deux registres sont independants', () => {
      const autre = new ProviderRegistry()
      registry.register('openai', adaptateur)
      expect(autre.list()).toEqual([])
    })
  })
})
