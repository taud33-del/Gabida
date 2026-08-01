import {
  CultureProductionGeneratorError,
  PLAN_SCHEMA,
  createProductionCultureGenerator,
} from './production-generator.js'
import { jest } from '@jest/globals'

const validPlan = {
  understood: 'La demande porte sur une coutume.',
  intention: 'Expliquer sans simplifier a outrance.',
  contribution: 'Un exemple personnel complementaire.',
  relevance: 0.9,
  novelty: 0.8,
  complementarity: 0.7,
  roleCompliance: 1,
  personalityCompliance: 0.9,
  timing: 0.8,
  estimatedLength: 'short',
  shouldSpeak: true,
  reason: 'Le personnage apporte un point de vue utile.',
}

function input(role = 'speaker') {
  return {
    characterId: role === 'speaker' ? 'solene-han' : 'sonia-nadir',
    intention: validPlan,
    context: {
      layers: [
        { name: 'experience', content: { type: 'culture' } },
        { name: 'character', content: { centralSummary: 'Personnalite complete.', consistencyRules: ['Rester fidele.'] } },
        { name: 'conversation', content: { messages: [{ role: 'user', content: 'Bonjour' }] } },
        { name: 'temporaryRole', content: {
          role,
          language: 'sv',
          userLanguage: 'fr',
          translationSource: role === 'translator' ? {
            text: 'Vi börjar med fika.',
            language: 'sv',
            userMessage: 'On commence par quoi ?',
            explainedInformation: [],
          } : null,
        } },
      ],
    },
  }
}

function clientReturning(...values) {
  const generer = jest.fn()
  for (const value of values) {
    if (value instanceof Error) generer.mockRejectedValueOnce(value)
    else generer.mockResolvedValueOnce({ contenu: typeof value === 'string' ? value : JSON.stringify(value) })
  }
  return { generer }
}

describe('generateur Culture de production', () => {
  test('produit un plan strict via le client de generation existant', async () => {
    const clientGeneration = clientReturning(validPlan)
    const generator = createProductionCultureGenerator({ clientGeneration, timeoutMs: 1234 })
    await expect(generator.plan(input())).resolves.toEqual(validPlan)
    const [, options] = clientGeneration.generer.mock.calls[0]
    expect(options.timeoutMs).toBe(1234)
    expect(options.request.text.format.schema).toBe(PLAN_SCHEMA)
    expect(options.request.text.format.strict).toBe(true)
  })

  test('repare une seule fois un plan invalide', async () => {
    const clientGeneration = clientReturning('{', validPlan)
    const generator = createProductionCultureGenerator({ clientGeneration })
    await expect(generator.plan(input())).resolves.toEqual(validPlan)
    expect(clientGeneration.generer).toHaveBeenCalledTimes(2)
    expect(clientGeneration.generer.mock.calls[1][0].contenu).toMatch(/une seule fois/)
  })

  test('rejette un second plan invalide sans troisieme appel', async () => {
    const clientGeneration = clientReturning('{}', '{}')
    const generator = createProductionCultureGenerator({ clientGeneration })
    await expect(generator.plan(input())).rejects.toMatchObject({ code: 'INVALID_STRUCTURED_OUTPUT', stage: 'plan' })
    expect(clientGeneration.generer).toHaveBeenCalledTimes(2)
  })

  test('le plan ne demande et ne retourne aucune replique visible', async () => {
    const clientGeneration = clientReturning(validPlan)
    const generator = createProductionCultureGenerator({ clientGeneration })
    const plan = await generator.plan(input())
    expect(plan).not.toHaveProperty('text')
    expect(clientGeneration.generer.mock.calls[0][0].contenu).toMatch(/aucune reponse visible/)
  })

  test('le speaker repond uniquement dans la langue cible', async () => {
    const clientGeneration = clientReturning({ text: 'Hej!', language: 'sv' })
    const response = await createProductionCultureGenerator({ clientGeneration }).respond(input('speaker'))
    expect(response).toEqual({ text: 'Hej!', language: 'sv' })
    expect(clientGeneration.generer.mock.calls[0][0].contenu).toMatch(/uniquement en sv/)
  })

  test('le translator repond par defaut dans la langue utilisateur', async () => {
    const clientGeneration = clientReturning({ text: 'Bonjour !', language: 'fr' })
    const response = await createProductionCultureGenerator({ clientGeneration }).respond(input('translator'))
    expect(response.language).toBe('fr')
    expect(clientGeneration.generer.mock.calls[0][0].contenu).toMatch(/par defaut en fr/)
    expect(clientGeneration.generer.mock.calls[0][0].contenu).toContain('Vi börjar med fika.')
    expect(clientGeneration.generer.mock.calls[0][0].contenu).toMatch(/ne dois pas repondre directement/)
  })

  test('le plan du translator est limite a la reponse exacte du speaker', async () => {
    const clientGeneration = clientReturning(validPlan)
    await createProductionCultureGenerator({ clientGeneration }).plan(input('translator'))
    const prompt = clientGeneration.generer.mock.calls[0][0].contenu
    expect(prompt).toContain('Vi börjar med fika.')
    expect(prompt).toMatch(/seconde reponse independante/)
  })

  test('rejette une langue contraire au role temporaire', async () => {
    const generator = createProductionCultureGenerator({ clientGeneration: clientReturning({ text: 'Hello', language: 'en' }) })
    await expect(generator.respond(input('speaker'))).rejects.toMatchObject({ code: 'LANGUAGE_OR_RESPONSE_INVALID' })
  })

  test.each([
    [Object.assign(new Error('aborted'), { name: 'AbortError' }), 'MODEL_TIMEOUT'],
    [new Error('provider unavailable'), 'MODEL_PROVIDER_ERROR'],
  ])('normalise les erreurs fournisseur sans fuite (%s)', async (providerError, code) => {
    const logger = { error: jest.fn() }
    const generator = createProductionCultureGenerator({ clientGeneration: clientReturning(providerError), logger })
    await expect(generator.plan(input())).rejects.toMatchObject({ code })
    expect(logger.error).toHaveBeenCalledWith('[culture-production]', expect.objectContaining({ stage: 'plan', code }))
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('provider unavailable')
  })

  test('ne divulgue pas le contexte interne dans le resultat visible', async () => {
    const generator = createProductionCultureGenerator({ clientGeneration: clientReturning({ text: 'Hej!', language: 'sv' }) })
    const response = await generator.respond(input())
    expect(Object.keys(response)).toEqual(['text', 'language'])
    expect(JSON.stringify(response)).not.toMatch(/consistencyRules|messages|temporaryRole/)
  })

  test('exige un client de generation injecte', () => {
    expect(() => createProductionCultureGenerator()).toThrow(CultureProductionGeneratorError)
  })
})
