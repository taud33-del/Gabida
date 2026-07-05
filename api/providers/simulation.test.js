/**
 * api/providers/simulation.test.js
 *
 * Tests unitaires du SimulationProvider deterministe.
 *
 * Couverture :
 *   - factory createSimulationProvider (modes, mode inconnu)
 *   - determinisme (meme entree -> meme sortie)
 *   - conformite au contrat ReponseRaw
 *   - modes empty / refusal / error (erreur typee)
 *   - absence totale d'acces reseau
 *   - enregistrement via le ProviderRegistry, comme OpenAI
 *   - integration via callProvider()
 */

import {
  registerProvider,
  callProvider,
  ProviderRegistry,
  createSimulationProvider,
  simulationProvider,
  SimulationProviderError,
  SIMULATION_MODES,
} from '../index.js'

import { PROVIDERS } from '../../constants/Providers.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const messages = [
  { role: 'system', contenu: 'Tu es Aldric.' },
  { role: 'user',   contenu: 'Quel est ton nom ?' },
]

const parametres = { modele: 'sim-modele', timeout: 30000, options: {} }
const config      = { provider: PROVIDERS.SIMULATION, cleApi: 'n-importe-quoi', modele: 'sim-modele' }

// ─── Factory ──────────────────────────────────────────────────────────────────

describe('createSimulationProvider', () => {
  test('retourne une fonction (adaptateur)', () => {
    expect(typeof createSimulationProvider()).toBe('function')
  })

  test('mode par defaut = SUCCESS', async () => {
    const adapter  = createSimulationProvider()
    const reponse  = await adapter(messages, parametres, config)
    expect(reponse.texte).toContain('[simulation:success]')
  })

  test('leve SimulationProviderError pour un mode inconnu', () => {
    expect(() => createSimulationProvider({ mode: 'inexistant' }))
      .toThrow(SimulationProviderError)
  })
})

// ─── Determinisme ─────────────────────────────────────────────────────────────

describe('determinisme', () => {
  test('meme entree -> meme sortie', async () => {
    const adapter = createSimulationProvider({ mode: SIMULATION_MODES.SUCCESS })
    const r1 = await adapter(messages, parametres, config)
    const r2 = await adapter(messages, parametres, config)
    expect(r1).toEqual(r2)
  })

  test('conforme au contrat ReponseRaw', async () => {
    const reponse = await simulationProvider(messages, parametres, config)
    expect(typeof reponse.texte).toBe('string')
    expect(typeof reponse.tokensEntree).toBe('number')
    expect(typeof reponse.tokensSortie).toBe('number')
  })

  test('la reponse SUCCESS derive de l instruction', async () => {
    const reponse = await simulationProvider(messages, parametres, config)
    expect(reponse.texte).toBe('[simulation:success] Quel est ton nom ?')
  })
})

// ─── Modes ────────────────────────────────────────────────────────────────────

describe('modes', () => {
  test('EMPTY produit un texte vide', async () => {
    const adapter = createSimulationProvider({ mode: SIMULATION_MODES.EMPTY })
    const reponse = await adapter(messages, parametres, config)
    expect(reponse.texte).toBe('')
    expect(reponse.tokensSortie).toBe(0)
  })

  test('REFUSAL produit un refus fixe et stable', async () => {
    const adapter = createSimulationProvider({ mode: SIMULATION_MODES.REFUSAL })
    const r1 = await adapter(messages, parametres, config)
    const r2 = await adapter(messages, parametres, config)
    expect(r1.texte).toBe(r2.texte)
    expect(r1.texte.length).toBeGreaterThan(0)
  })

  test('ERROR leve une SimulationProviderError', async () => {
    const adapter = createSimulationProvider({ mode: SIMULATION_MODES.ERROR })
    await expect(adapter(messages, parametres, config)).rejects.toThrow(SimulationProviderError)
  })
})

// ─── Absence de reseau ────────────────────────────────────────────────────────

describe('absence de reseau', () => {
  test('n appelle jamais fetch', async () => {
    const originalFetch = globalThis.fetch
    let fetchAppels = 0
    globalThis.fetch = () => { fetchAppels += 1; throw new Error('reseau interdit') }
    try {
      await simulationProvider(messages, parametres, config)
      await createSimulationProvider({ mode: SIMULATION_MODES.REFUSAL })(messages, parametres, config)
      expect(fetchAppels).toBe(0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

// ─── Enregistrement (comme OpenAI) ────────────────────────────────────────────

describe('enregistrement', () => {
  test('s enregistre dans un ProviderRegistry comme n importe quel provider', () => {
    const registry = new ProviderRegistry()
    registry.register(PROVIDERS.SIMULATION, simulationProvider)
    expect(registry.has(PROVIDERS.SIMULATION)).toBe(true)
    expect(registry.get(PROVIDERS.SIMULATION)).toBe(simulationProvider)
  })

  test('s enregistre via registerProvider()', () => {
    expect(() => registerProvider(PROVIDERS.SIMULATION, simulationProvider)).not.toThrow()
  })
})

// ─── Integration callProvider ─────────────────────────────────────────────────

describe('callProvider avec le SimulationProvider', () => {
  test('retourne un ReponseIA deterministe', async () => {
    registerProvider('sim-callprovider', createSimulationProvider())
    const cfg     = { ...config, provider: 'sim-callprovider' }
    const prompt  = { systeme: 'Tu es Aldric.', historique: [], instruction: 'Quel est ton nom ?' }
    const r1 = await callProvider(prompt, cfg)
    const r2 = await callProvider(prompt, cfg)
    expect(r1.texte).toBe(r2.texte)
    expect(r1.meta.provider).toBe('sim-callprovider')
    expect(r1.texte).toContain('[simulation:success]')
  })

  test('propage la SimulationProviderError du mode ERROR', async () => {
    registerProvider('sim-error', createSimulationProvider({ mode: SIMULATION_MODES.ERROR }))
    const cfg    = { ...config, provider: 'sim-error' }
    const prompt = { systeme: 'x', historique: [], instruction: 'y' }
    await expect(callProvider(prompt, cfg)).rejects.toThrow(SimulationProviderError)
  })
})
