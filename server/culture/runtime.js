import OpenAI from 'openai'
import { creerClientGenerationOpenAI } from '../../core/dialogue/client-generation-openai.js'
import { createCultureEngine } from '../../core/experiences/culture/index.js'
import { createProductionCultureGenerator } from './production-generator.js'
import { createCultureSimulationGenerator } from './simulation-generator.js'

export class CultureRuntimeConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CultureRuntimeConfigurationError'
  }
}

function required(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CultureRuntimeConfigurationError(`${name} est requis en mode production.`)
  }
  return value.trim()
}

function readTimeout(value) {
  if (value === undefined || value === '') return 30000
  const timeoutMs = Number(value)
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new CultureRuntimeConfigurationError('CULTURE_REQUEST_TIMEOUT_MS doit etre un entier strictement positif.')
  }
  return timeoutMs
}

export function resolveCultureGenerator({
  env = process.env,
  generator,
  clientGeneration,
  openAIClient,
  logger = console,
} = {}) {
  if (generator) return Object.freeze({ generator, mode: 'custom' })

  const mode = (env.CULTURE_GENERATOR_MODE || 'simulation').trim().toLowerCase()
  if (mode === 'simulation') {
    return Object.freeze({ generator: createCultureSimulationGenerator(), mode })
  }
  if (mode !== 'production') {
    throw new CultureRuntimeConfigurationError('CULTURE_GENERATOR_MODE doit valoir simulation ou production.')
  }

  const model = required(env.CULTURE_MODEL, 'CULTURE_MODEL')
  const timeoutMs = readTimeout(env.CULTURE_REQUEST_TIMEOUT_MS)
  let generationClient = clientGeneration
  if (!generationClient) {
    const apiKey = required(env.OPENAI_API_KEY, 'OPENAI_API_KEY')
    const client = openAIClient || new OpenAI({ apiKey })
    generationClient = creerClientGenerationOpenAI({ client, modele: model })
  }
  const productionGenerator = createProductionCultureGenerator({
    clientGeneration: generationClient,
    timeoutMs,
    logger,
  })
  return Object.freeze({ generator: productionGenerator, mode })
}

export function createCultureRuntime(options = {}) {
  const {
    env = process.env,
    generator,
    clientGeneration,
    openAIClient,
    logger,
    ...engineOptions
  } = options
  const resolved = resolveCultureGenerator({ env, generator, clientGeneration, openAIClient, logger })
  const cultureEngine = createCultureEngine({ generator: resolved.generator, ...engineOptions })
  return Object.freeze({ cultureEngine, generatorMode: resolved.mode })
}

// Instance partagee par defaut, creee une seule fois au chargement du serveur.
export const cultureRuntime = createCultureRuntime()
