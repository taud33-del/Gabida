import {
  CultureRuntimeConfigurationError,
  createCultureRuntime,
  resolveCultureGenerator,
} from './runtime.js'
import { jest } from '@jest/globals'

describe('configuration du runtime Culture', () => {
  test('utilise la simulation par defaut', () => {
    expect(createCultureRuntime({ env: {} }).generatorMode).toBe('simulation')
  })

  test('active la production via la variable dediee sans reseau', () => {
    const clientGeneration = { generer: jest.fn() }
    const runtime = createCultureRuntime({
      env: { CULTURE_GENERATOR_MODE: 'production', CULTURE_MODEL: 'modele-test' },
      clientGeneration,
    })
    expect(runtime.generatorMode).toBe('production')
  })

  test('exige le modele en production', () => {
    expect(() => resolveCultureGenerator({
      env: { CULTURE_GENERATOR_MODE: 'production', OPENAI_API_KEY: 'secret' },
    })).toThrow(CultureRuntimeConfigurationError)
  })

  test('exige la cle existante si aucun client abstrait nest injecte', () => {
    expect(() => resolveCultureGenerator({
      env: { CULTURE_GENERATOR_MODE: 'production', CULTURE_MODEL: 'modele-test' },
    })).toThrow(/OPENAI_API_KEY/)
  })

  test('rejette un mode ou un timeout invalides', () => {
    expect(() => resolveCultureGenerator({ env: { CULTURE_GENERATOR_MODE: 'autre' } })).toThrow(/simulation ou production/)
    expect(() => resolveCultureGenerator({
      env: { CULTURE_GENERATOR_MODE: 'production', CULTURE_MODEL: 'm', CULTURE_REQUEST_TIMEOUT_MS: '0' },
      clientGeneration: { generer() {} },
    })).toThrow(/strictement positif/)
  })

  test('un generateur explicitement injecte reste prioritaire', () => {
    const generator = { plan() {}, respond() {} }
    const resolved = resolveCultureGenerator({ env: { CULTURE_GENERATOR_MODE: 'invalide' }, generator })
    expect(resolved).toEqual({ generator, mode: 'custom' })
  })
})
